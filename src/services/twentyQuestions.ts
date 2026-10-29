import { DEFAULT_KNOWLEDGE } from '../data/defaultKnowledge';
import { BIG_DATASET, MEDIUM_DATASET, SMALL_DATASET, MICRO_DATASET } from '../data/earthToJakeDatasets';
import { AnswerChoice, AnswerRecord, CandidateScore, KnowledgeData } from '../types/game';

// Storage key for persistent state
const STORAGE_KEY = 'twenty_questions_knowledge_v3';

export type DatasetPresetId = 'master' | 'big' | 'medium' | 'small' | 'micro';

export interface NextQuestionResult {
  question: string;
  confidence: number;
  topCandidate?: string;
  topCandidates?: string[];
  readyToGuess?: boolean;
  source: 'ai' | 'local';
}

export interface GuessResult {
  guess: string;
  confidence: number;
  explanation?: string;
}

export class TwentyQuestionsEngine {
  public knowledge: KnowledgeData;
  public scores: Record<string, number> = {};
  public askedQuestions: string[] = [];
  public answerHistory: AnswerRecord[] = [];
  public useAiAdaptive: boolean = true;
  public isAiAvailable: boolean = true;
  public currentDatasetId: DatasetPresetId = 'master';
  private currentAiCandidate: string | null = null;
  private currentConfidence: number = 20;

  // Question gates: maps question key to the pair of objects it was created to distinguish
  public questionGates: Record<string, { entityA: string; entityB: string }> = {};

  constructor() {
    this.knowledge = this.loadData();
    this.resetGame();
  }

  public loadData(): KnowledgeData {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.objects && parsed.questions && Object.keys(parsed.questions).length > 0) {
            if (parsed.gates) {
              this.questionGates = parsed.gates;
            }
            if (parsed.currentDatasetId) {
              this.currentDatasetId = parsed.currentDatasetId;
            }
            return parsed;
          }
        }
      } catch (err) {
        console.warn('Failed to load saved knowledge from localStorage, using defaults', err);
      }
    }
    return JSON.parse(JSON.stringify(DEFAULT_KNOWLEDGE));
  }

  public saveData(): void {
    if (typeof window !== 'undefined') {
      try {
        const payload = {
          ...this.knowledge,
          gates: this.questionGates,
          currentDatasetId: this.currentDatasetId,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload, null, 2));
      } catch (err) {
        console.error('Failed to save knowledge to localStorage', err);
      }
    }
  }

  /**
   * Switch between EarthToJake datasets (Big, Medium, Small, Micro) or Master merged knowledge
   */
  public setDataset(datasetId: DatasetPresetId): void {
    this.currentDatasetId = datasetId;
    switch (datasetId) {
      case 'big':
        this.knowledge = JSON.parse(JSON.stringify(BIG_DATASET));
        break;
      case 'medium':
        this.knowledge = JSON.parse(JSON.stringify(MEDIUM_DATASET));
        break;
      case 'small':
        this.knowledge = JSON.parse(JSON.stringify(SMALL_DATASET));
        break;
      case 'micro':
        this.knowledge = JSON.parse(JSON.stringify(MICRO_DATASET));
        break;
      case 'master':
      default:
        this.knowledge = JSON.parse(JSON.stringify(DEFAULT_KNOWLEDGE));
        break;
    }
    this.saveData();
    this.resetGame();
  }

  public resetGame(): void {
    this.scores = {};
    for (const obj of this.knowledge.objects) {
      this.scores[obj.name] = 0;
    }
    this.askedQuestions = [];
    this.answerHistory = [];
    this.currentAiCandidate = null;
    this.currentConfidence = 20;
  }

  public getCandidateRanking(): CandidateScore[] {
    const list = Object.entries(this.scores).map(([name, score]) => {
      const answeredCount = this.answerHistory.filter((h) => h.weight !== null).length;
      let matchPercentage = 100;
      if (answeredCount > 0) {
        const raw = 1 - Math.abs(score) / answeredCount;
        matchPercentage = Math.max(0, Math.min(100, Math.round(raw * 100)));
      }
      return { name, score, matchPercentage };
    });

    list.sort((a, b) => b.score - a.score);
    return list;
  }

  public getConfidence(): number {
    return this.currentConfidence;
  }

  /**
   * Generates next adaptive question based on responses.
   * Calls server-side Gemini Neural Coprocessor if enabled and available,
   * with fallback to local minimax information-jump selection.
   */
  public async getAdaptiveNextQuestion(questionNumber: number): Promise<NextQuestionResult> {
    // Check eliminated branches
    const livingEliminated = this.isLivingEliminated();

    // In master mode, Question 1 is always the foundational living vs inanimate distinction
    if (this.answerHistory.length === 0 && this.currentDatasetId === 'master') {
      return {
        question: 'Is it a living thing (animal, plant, or organism)?',
        confidence: 25,
        topCandidate: 'Unknown',
        topCandidates: [],
        readyToGuess: false,
        source: 'local',
      };
    }

    if (this.useAiAdaptive && this.isAiAvailable) {
      try {
        const historyPayload = this.answerHistory.map((h) => ({
          question: h.prompt,
          answer: h.answer,
        }));

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        const res = await fetch('/api/20q/next-question', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            history: historyPayload,
            questionNumber,
          }),
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (data.nextQuestion) {
            const qStr = data.nextQuestion.toLowerCase();
            const isAnimal = /animal|organism|alive|living|mammal|bird|reptile|fish|amphibian|insect|fur|feathers|legs|predator|venomous/i.test(qStr);

            // Verify AI didn't violate branch pruning or repeat an already asked question
            const alreadyAsked = this.answerHistory.some(h => h.prompt.toLowerCase().trim() === qStr.trim());
            const violatesLiving = livingEliminated && isAnimal;

            if (!violatesLiving && !alreadyAsked) {
              this.currentConfidence = Math.max(25, Math.min(99, Math.round(data.confidence || 50)));
              if (data.topCandidate) {
                this.currentAiCandidate = data.topCandidate;
              }
              return {
                question: data.nextQuestion,
                confidence: this.currentConfidence,
                topCandidate: data.topCandidate,
                topCandidates: data.topCandidates || [],
                readyToGuess: Boolean(data.readyToGuess),
                source: 'ai',
              };
            }
          }
        }
      } catch {
        // Fall back gracefully to local minimax engine
      }
    }

    // Local Minimax (EarthToJake 20Q information-jump) question selection
    const localQ = this.getLocalBestQuestion();
    const prompt = localQ ? this.knowledge.questions[localQ] || localQ : 'Is it found inside a typical home?';

    const ranking = this.getCandidateRanking();
    if (ranking.length > 1) {
      const diff = Math.abs(ranking[0].score - ranking[1].score);
      const conf = Math.min(95, 30 + this.answerHistory.length * 3.5 + diff * 15);
      this.currentConfidence = Math.round(conf);
    }

    const ready = this.answerHistory.length >= 20 || (ranking.length > 1 && Math.abs(ranking[0].score - ranking[1].score) >= 2.5 && this.answerHistory.length >= 8);

    return {
      question: prompt,
      confidence: this.currentConfidence,
      topCandidate: ranking[0]?.name,
      topCandidates: ranking.slice(0, 3).map((r) => r.name),
      readyToGuess: ready,
      source: 'local',
    };
  }

  private isLivingEliminated(): boolean {
    for (const h of this.answerHistory) {
      const lower = h.prompt.toLowerCase();
      if (lower.includes('living thing') || lower.includes('animal or organism') || lower.includes('is it alive')) {
        if (h.answer === 'no') return true;
      }
    }
    return false;
  }

  /**
   * EarthToJake Minimax Information-Jump Question Selection algorithm.
   * Finds the question that produces the maximum worst-case distinction among surviving candidates.
   */
  public getLocalBestQuestion(): string | null {
    // 1. Identify which branches are eliminated
    let livingEliminated = false;
    let inanimateEliminated = false;
    let electricityEliminated = false;
    let foodEliminated = false;
    let wearableEliminated = false;

    for (const h of this.answerHistory) {
      const lower = h.prompt.toLowerCase();
      if (lower.includes('living thing') || lower.includes('animal or organism') || lower.includes('is it alive')) {
        if (h.answer === 'no') livingEliminated = true;
        if (h.answer === 'yes') inanimateEliminated = true;
      }
      if (lower.includes('electricity') || lower.includes('batteries')) {
        if (h.answer === 'no') electricityEliminated = true;
      }
      if (lower.includes('eat or drink') || lower.includes('edible') || lower.includes('food')) {
        if (h.answer === 'no') foodEliminated = true;
      }
      if (lower.includes('worn on') || lower.includes('clothing') || lower.includes('applied to the human body')) {
        if (h.answer === 'no') wearableEliminated = true;
      }
    }

    const ranking = this.getCandidateRanking();
    const topScore = ranking[0]?.score ?? 0;
    // Surviving plausible candidates
    const plausibleCandidates = ranking
      .filter((c) => Math.abs(c.score - topScore) <= 2.0)
      .slice(0, 20);

    const topCandidateNames = plausibleCandidates.slice(0, 3).map((r) => r.name.toLowerCase());

    // 2. Filter unasked questions with strict branch pruning rules
    const unasked = Object.keys(this.knowledge.questions).filter((qKey) => {
      if (this.askedQuestions.includes(qKey)) return false;

      // Rule out living questions if living was answered NO
      if (livingEliminated) {
        if ([
          'is_alive', 'is_animal', 'is_mammal', 'is_bird', 'is_reptile', 'is_fish',
          'is_amphibian', 'is_insect', 'is_invertebrate', 'has_hair', 'has_feathers',
          'lays_eggs', 'feeds_milk', 'airborne', 'aquatic', 'predator', 'toothed',
          'has_backbone', 'breathes_air', 'venomous', 'has_fins', 'zero_legs',
          'two_legs', 'four_legs', 'five_legs', 'six_legs', 'eight_legs',
          'has_tail', 'warm_blooded', 'is_endangered', 'lives_in_groups', 'has_trunk',
          'cat_size_or_larger'
        ].includes(qKey)) {
          return false;
        }
      }

      // Rule out inanimate questions if living was answered YES
      if (inanimateEliminated) {
        if (['is_man_made', 'uses_electricity', 'made_of_metal', 'is_liquid', 'is_worn'].includes(qKey)) {
          return false;
        }
      }

      // Rule out electricity questions if electricity was answered NO
      if (electricityEliminated && ['uses_electricity'].includes(qKey)) {
        return false;
      }

      // Rule out food questions if food was answered NO
      if (foodEliminated && ['can_eat'].includes(qKey)) {
        return false;
      }

      // Rule out wearable questions if wearable was answered NO
      if (wearableEliminated && ['is_worn'].includes(qKey)) {
        return false;
      }

      // Gating for custom learned questions:
      // Only ask a learned question if one of the items it was created to distinguish is in the top 3 contenders!
      const gate = this.questionGates[qKey];
      if (gate) {
        const matchesContenders =
          topCandidateNames.includes(gate.entityA.toLowerCase()) ||
          topCandidateNames.includes(gate.entityB.toLowerCase());
        if (!matchesContenders) {
          return false;
        }
      }

      return true;
    });

    if (unasked.length === 0) return null;
    if (plausibleCandidates.length <= 1) return unasked[0];

    // EarthToJake Minimax Information Gain:
    // Pick the question that maximizes the worst-case partition among plausible candidates!
    let bestQ = unasked[0];
    let bestWorstCase = -1;

    for (const qKey of unasked) {
      let yesWeight = 0;
      let noWeight = 0;

      for (const cand of plausibleCandidates) {
        const obj = this.knowledge.objects.find((o) => o.name === cand.name);
        const val = obj?.attributes[qKey] ?? 0.5;
        if (val >= 0.7) yesWeight += 1;
        else if (val <= 0.3) noWeight += 1;
        else {
          yesWeight += 0.5;
          noWeight += 0.5;
        }
      }

      const worstCase = Math.min(yesWeight, noWeight);
      if (worstCase > bestWorstCase) {
        bestWorstCase = worstCase;
        bestQ = qKey;
      }
    }

    return bestQ;
  }

  /**
   * Submits user's answer and applies the Python scoring formula:
   * scores[obj['name']] -= abs(weight - obj_val)
   */
  public answerQuestion(qText: string, answer: AnswerChoice): void {
    let weight: number | null = null;
    if (answer === 'yes') weight = 1.0;
    else if (answer === 'no') weight = 0.0;
    else if (answer === 'sometimes') weight = 0.5;
    else weight = null;

    // Match question key
    let qKey = Object.keys(this.knowledge.questions).find(
      (k) => this.knowledge.questions[k].toLowerCase().trim() === qText.toLowerCase().trim()
    );
    if (!qKey) {
      qKey = qText.toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 30);
    }

    if (weight !== null) {
      // User's exact Python penalty math:
      for (const obj of this.knowledge.objects) {
        const objVal = obj.attributes[qKey] !== undefined ? obj.attributes[qKey] : 0.5;
        this.scores[obj.name] -= Math.abs(weight - objVal);
      }
    }

    this.askedQuestions.push(qKey);
    this.answerHistory.push({
      qKey,
      prompt: qText,
      answer,
      weight,
      roundNumber: this.askedQuestions.length,
    });
  }

  /**
   * Undo last question.
   */
  public undoLastAnswer(): boolean {
    if (this.answerHistory.length === 0) return false;
    this.answerHistory.pop();
    this.askedQuestions.pop();

    this.scores = {};
    for (const obj of this.knowledge.objects) {
      this.scores[obj.name] = 0;
    }

    for (const record of this.answerHistory) {
      if (record.weight !== null) {
        for (const obj of this.knowledge.objects) {
          const objVal = obj.attributes[record.qKey] !== undefined ? obj.attributes[record.qKey] : 0.5;
          this.scores[obj.name] -= Math.abs(record.weight - objVal);
        }
      }
    }
    return true;
  }

  /**
   * Deduces the final guess.
   */
  public async deduceFinalGuess(): Promise<GuessResult> {
    if (this.useAiAdaptive && this.isAiAvailable) {
      try {
        const historyPayload = this.answerHistory.map((h) => ({
          question: h.prompt,
          answer: h.answer,
        }));

        const res = await fetch('/api/20q/guess', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ history: historyPayload }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.guess) {
            return {
              guess: data.guess,
              confidence: data.confidence || 85,
              explanation: data.explanation || 'Deduction derived from player answers.',
            };
          }
        }
      } catch {
        // Fallback to local ranking
      }
    }

    const ranking = this.getCandidateRanking();
    const best = this.getGuess();
    return {
      guess: best,
      confidence: this.currentConfidence,
      explanation: 'Matches maximum attributes in 64-bit neural memory.',
    };
  }

  public getGuess(): string {
    const ranking = this.getCandidateRanking();
    return this.currentAiCandidate || ranking[0]?.name || 'Mystery Object';
  }

  /**
   * Learns a new object and question with gate context:
   * The new distinguishing question is GATED specifically to { correctName, wrongGuess }!
   */
  public learn(wrongGuess: string, correctName: string, newQText: string): void {
    const formattedName = correctName.trim().charAt(0).toUpperCase() + correctName.trim().slice(1);
    let newQKey = newQText
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_ ]/g, '')
      .replace(/\s+/g, '_');

    if (!newQKey) {
      newQKey = `custom_q_${Date.now()}`;
    }

    const cleanPrompt = newQText.trim().endsWith('?') ? newQText.trim() : `${newQText.trim()}?`;

    // 1. Add question
    this.knowledge.questions[newQKey] = cleanPrompt;

    // 2. Associate gate context so it's NEVER asked for unrelated items!
    this.questionGates[newQKey] = {
      entityA: formattedName,
      entityB: wrongGuess,
    };

    // 3. Update existing objects with 0.5
    for (const obj of this.knowledge.objects) {
      obj.attributes[newQKey] = 0.5;
    }

    // 4. New object attributes
    const newAttributes: Record<string, number> = {};
    for (const q of Object.keys(this.knowledge.questions)) {
      newAttributes[q] = 0.5;
    }
    newAttributes[newQKey] = 1.0;

    this.knowledge.objects.push({
      name: formattedName,
      attributes: newAttributes,
      category: 'Learned',
      learned: true,
    });

    // 5. Update wrong guess to 0.0
    for (const obj of this.knowledge.objects) {
      if (obj.name.toLowerCase() === wrongGuess.toLowerCase()) {
        obj.attributes[newQKey] = 0.0;
      }
    }

    this.saveData();
  }

  public resetToFactory(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('twenty_questions_knowledge_v2');
      localStorage.removeItem('twenty_questions_knowledge_v1');
    }
    this.knowledge = JSON.parse(JSON.stringify(DEFAULT_KNOWLEDGE));
    this.questionGates = {};
    this.currentDatasetId = 'master';
    this.resetGame();
  }

  public importKnowledge(imported: KnowledgeData): boolean {
    if (!imported.objects || !imported.questions) return false;
    this.knowledge = imported;
    this.saveData();
    this.resetGame();
    return true;
  }
}
