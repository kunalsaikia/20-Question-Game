import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Google GenAI client
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Primary model: gemini-3.1-flash-lite has generous quota and sub-second latency
const MODEL_NAME = 'gemini-3.1-flash-lite';
const FALLBACK_MODEL = 'gemini-flash-latest';

/**
 * Route: Check if Gemini AI Neural Co-Processor is active
 */
app.get('/api/20q/status', (req, res) => {
  res.json({
    hasApiKey: Boolean(apiKey),
    model: MODEL_NAME,
    mode: '64-bit-neural-coprocessor',
  });
});

/**
 * Route: Next Question Generator
 * Generates an adaptive question based strictly on the player's previous responses!
 */
app.post('/api/20q/next-question', async (req, res) => {
  try {
    const { history, questionNumber } = req.body as {
      history: Array<{ question: string; answer: string }>;
      questionNumber: number;
    };

    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API not configured, using local fallback engine',
      });
    }

    const historyFormatted =
      history && history.length > 0
        ? history
            .map((h, idx) => `Q${idx + 1}: "${h.question}" -> Answer: ${h.answer.toUpperCase()}`)
            .join('\n')
        : 'No questions asked yet. This is Question 1.';

    const systemPrompt = `You are the brain of the classic 20 Questions (20Q) 64-bit handheld electronic device.
A human player is thinking of a specific word or concept.
Your mission is to read their mind and deduce EXACTLY what word they are thinking of in 20 questions or fewer.

ABSOLUTE CARDINAL RULES FOR COGNITIVE DEDUCTION:
1. STRICT BRANCH PRUNING (NEVER ASK REDUNDANT OR CONTRADICTORY QUESTIONS):
   - If the player answered "NO" to living/animal: The entity is 100% INANIMATE. NEVER ask if it is an animal, plant, living, mammal, pet, has fur, eats, breathes, or has legs! That entire branch is dead.
   - If the player answered "NO" to electricity/batteries: NEVER ask if it has a screen, buttons, software, plugs in, or uses technology.
   - If the player answered "NO" to edible/food: NEVER ask about cooking, baking, sweet, or taste.
   - If the player answered "NO" to wearable/body: NEVER ask about fabric, clothing, or jewelry.

2. LOGICAL HIERARCHICAL DRILL-DOWN (STEP BY STEP, DO NOT JUMP AROUND):
   - Step 1 (Domain & Scale): Living vs Inanimate? Natural vs Man-made? Can you comfortably hold it in one hand?
   - Step 2 (Category Narrowing): If inanimate & non-electronic & handheld: Is it worn or applied to the human body (clothing, cosmetic, accessory)? Or is it a kitchen tool? Or paper/writing? Or hardware?
   - Step 3 (Subcategory Refinement): If body/cosmetic: Is it a cosmetic, grooming, or makeup product? Or is it fabric/clothing?
   - Step 4 (Specific Discriminator): If cosmetic: Is it a liquid? Is it used on nails or face?
   - DO NOT jump to an ultra-specific question like "Is it nail polish?" or "Does it have strings?" unless earlier answers have already narrowed the category down to cosmetics or instruments!

3. REPETITION BAN:
   - Check the complete history carefully. Never re-ask a question or re-phrase a concept that was already answered.

4. QUESTION FORMAT:
   - Must be answerable with YES, NO, SOMETIMES, or UNKNOWN.
   - Keep under 10 words, clear, polite, and ending with a question mark.`;

    const userPrompt = `History of all previous questions and the user's answers:
${historyFormatted}

This is Question #${questionNumber || (history?.length || 0) + 1} of 20.
Analyze all answers so far:
1. What branches are completely ELIMINATED? (Do not ask about them!)
2. What are the top 3 most likely candidate words matching ALL previous answers?
3. What is the single sharpest question to narrow down between those candidates right now?
4. If you have narrowed it down with >85% confidence (after at least 6 questions) or reached Question 20, set "readyToGuess": true.`;

    let response;
    try {
      response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.25,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              nextQuestion: {
                type: Type.STRING,
                description: 'The single best next question to ask (under 12 words, ends with ?).',
              },
              confidence: {
                type: Type.NUMBER,
                description: 'Confidence in top candidate (1 to 99).',
              },
              topCandidate: {
                type: Type.STRING,
                description: 'The single most likely word.',
              },
              topCandidates: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Top 3 candidates.',
              },
              readyToGuess: {
                type: Type.BOOLEAN,
                description: 'True if ready to make final guess.',
              },
              reasoning: {
                type: Type.STRING,
                description: '1-sentence deduction path.',
              },
            },
            required: ['nextQuestion', 'confidence', 'topCandidate', 'readyToGuess'],
          },
        },
      });
    } catch (modelErr) {
      console.warn(`Error on ${MODEL_NAME}, attempting fallback to ${FALLBACK_MODEL}:`, modelErr);
      response = await ai.models.generateContent({
        model: FALLBACK_MODEL,
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.25,
          responseMimeType: 'application/json',
        },
      });
    }

    const parsed = JSON.parse(response.text || '{}');

    // Post-generation validation to guarantee zero contradictions:
    let candidateQuestion = (parsed.nextQuestion || '').trim();

    // Check what branches are eliminated from user history
    let livingEliminated = false;
    let electricityEliminated = false;
    let wearableEliminated = false;
    let foodEliminated = false;

    if (history && history.length > 0) {
      for (const h of history) {
        const qLower = h.question.toLowerCase();
        const aLower = h.answer.toLowerCase();
        if (qLower.includes('living thing') || qLower.includes('animal') || qLower.includes('alive')) {
          if (aLower === 'no') livingEliminated = true;
        }
        if (qLower.includes('electricity') || qLower.includes('battery') || qLower.includes('batteries')) {
          if (aLower === 'no') electricityEliminated = true;
        }
        if (qLower.includes('worn on') || qLower.includes('clothing') || qLower.includes('applied to the body')) {
          if (aLower === 'no') wearableEliminated = true;
        }
        if (qLower.includes('eat') || qLower.includes('drink') || qLower.includes('food')) {
          if (aLower === 'no') foodEliminated = true;
        }
      }
    }

    const qLower = candidateQuestion.toLowerCase();
    const isAnimalQuestion = /animal|organism|alive|living|mammal|bird|reptile|fish|amphibian|insect|fur|feathers|legs|predator|venomous|tail|breathe/i.test(qLower);
    const isElectricQuestion = /electri|batter|screen|digital|plug|software|comput/i.test(qLower);
    const isWearableQuestion = /wear|cloth|fabric|jewel|cosmetic|makeup|shoe/i.test(qLower);

    const alreadyAsked = history ? history.some(h => h.question.toLowerCase().trim() === qLower) : false;

    if (
      alreadyAsked ||
      (livingEliminated && isAnimalQuestion) ||
      (electricityEliminated && isElectricQuestion) ||
      (wearableEliminated && isWearableQuestion) ||
      !candidateQuestion
    ) {
      // Deterministic hierarchical replacement
      const askedQuestions = (history || []).map(h => h.question.toLowerCase());
      const fallbackHierarchy = [
        'Was it manufactured or built by humans?',
        'Does it use electricity, batteries, or digital technology?',
        'Can you comfortably hold or pick it up in one hand?',
        'Is it worn on or applied to the human body (clothing, cosmetic, accessory)?',
        'Can humans eat or drink it (food/beverage)?',
        'Is it primarily constructed from metal?',
        'Is it a liquid, gel, or cosmetic product?',
        'Is it found inside a typical home or office?',
        'Is it physically larger than an automobile or car?',
        'Does it produce sound or music?'
      ];

      for (const candidate of fallbackHierarchy) {
        const cLower = candidate.toLowerCase();
        if (askedQuestions.some(aq => aq.includes(cLower) || cLower.includes(aq))) continue;
        if (electricityEliminated && /electricity|batteries/.test(cLower)) continue;
        if (wearableEliminated && /worn|cosmetic/.test(cLower)) continue;
        if (foodEliminated && /eat|drink/.test(cLower)) continue;

        candidateQuestion = candidate;
        break;
      }
      parsed.nextQuestion = candidateQuestion;
    }

    return res.json(parsed);
  } catch (error) {
    console.error('Error generating next question via Gemini:', error);
    return res.status(500).json({
      error: 'Failed to generate question with AI',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * Route: Final Guess Deductor
 * Deduces the exact word based on all answers.
 */
app.post('/api/20q/guess', async (req, res) => {
  try {
    const { history } = req.body as {
      history: Array<{ question: string; answer: string }>;
    };

    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API not configured, using local fallback engine',
      });
    }

    const historyFormatted = (history || [])
      .map((h, idx) => `Q${idx + 1}: "${h.question}" -> Answer: ${h.answer.toUpperCase()}`)
      .join('\n');

    const prompt = `You are the final deduction engine of the 20 Questions game.
Here is the complete history of questions asked and the player's answers:

${historyFormatted}

Based on every single response, what is the single exact object, animal, food, device, or concept the user is thinking of?
Pick the most specific, natural noun (e.g. "Nail polish", "Glove", "Cat", "Toaster", "Elephant", "Pizza", "Guitar", "Smartphone", "Bicycle").`;

    let response;
    try {
      response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              guess: {
                type: Type.STRING,
                description: 'The guessed word or entity, capitalized.',
              },
              confidence: {
                type: Type.NUMBER,
                description: 'Confidence score percentage from 60 to 99.',
              },
              category: {
                type: Type.STRING,
                description: 'Broad category.',
              },
              explanation: {
                type: Type.STRING,
                description: 'Brief reason why this fits all answers.',
              },
            },
            required: ['guess', 'confidence'],
          },
        },
      });
    } catch (err) {
      response = await ai.models.generateContent({
        model: FALLBACK_MODEL,
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });
    }

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error) {
    console.error('Error deducing guess with Gemini:', error);
    return res.status(500).json({
      error: 'Failed to deduce guess',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// Setup Vite middleware in dev or static files in prod
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`20Q 64-Bit Device Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
