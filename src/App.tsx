import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { TwentyQuestionsEngine } from './services/twentyQuestions';
import { soundEffects } from './services/soundEffects';
import {
  AnswerChoice,
  BacklightTheme,
  DeviceExpression,
  GamePhase,
  KnowledgeData,
} from './types/game';
import { TopBar } from './components/TopBar';
import { RoundDevice } from './components/RoundDevice';
import { LearningInterface } from './components/LearningInterface';
import { KnowledgeInspector } from './components/KnowledgeInspector';
import { HowItWorksModal } from './components/HowItWorksModal';
import {
  Keyboard,
  Sparkles,
  Layers,
  Award,
  Cpu,
} from 'lucide-react';

export default function App() {
  const engine = useMemo(() => new TwentyQuestionsEngine(), []);

  // UI States - Start directly in PLAYING phase to launch game immediately
  const [phase, setPhase] = useState<GamePhase>('PLAYING');
  const [currentPrompt, setCurrentPrompt] = useState<string | null>(() => {
    let initialQ = 'Is it a living thing (animal, plant, or organism)?';
    if (engine.currentDatasetId !== 'master') {
      const best = engine.getLocalBestQuestion();
      if (best) {
        initialQ = engine.knowledge.questions[best] || best;
      }
    }
    return initialQ;
  });
  const [theme, setTheme] = useState<BacklightTheme>('emerald');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [smartMode, setSmartMode] = useState<boolean>(true);
  const [wrongGuess, setWrongGuess] = useState<string | null>(null);
  const [currentGuess, setCurrentGuess] = useState<string | null>(null);
  const [guessExplanation, setGuessExplanation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Modals
  const [showInspector, setShowInspector] = useState<boolean>(false);
  const [showHowItWorks, setShowHowItWorks] = useState<boolean>(false);

  // Stats & Refresh counters
  const [, setRerenderKey] = useState<number>(0);
  const forceUpdate = () => setRerenderKey((k) => k + 1);

  const [gamesWon, setGamesWon] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('20q_games_won') || 0);
    } catch {
      return 0;
    }
  });

  // Calculate dynamic values
  const askedCount = engine.answerHistory.length;
  const totalQuestionsLimit = 20;
  const confidence = engine.getConfidence();
  const candidateRanking = engine.getCandidateRanking();
  const lastHistoryItem = engine.answerHistory[engine.answerHistory.length - 1];
  const lastAnswer = lastHistoryItem ? lastHistoryItem.answer : null;
  const learnedCount = engine.knowledge.objects.filter((o) => o.learned).length;

  // Derive dynamic 8-bit expression
  const expression: DeviceExpression = useMemo(() => {
    if (isLoading) return 'thinking';
    if (phase === 'READY') return 'idle';
    if (phase === 'VICTORY') return 'celebrating';
    if (phase === 'GUESSING') return confidence > 75 ? 'smug' : 'curious';
    if (phase === 'LEARNING') return 'puzzled';
    if (phase === 'LEARNED_SUCCESS') return 'learning';
    if (askedCount > 14) return 'smug';
    if (askedCount > 7) return 'curious';
    return 'thinking';
  }, [phase, confidence, askedCount, isLoading]);

  // Start / Reset Game - Immediately sets Question 1 with 0ms delay!
  const handleStartGame = useCallback(() => {
    soundEffects.playClick();
    engine.resetGame();
    setWrongGuess(null);
    setCurrentGuess(null);
    setGuessExplanation(null);

    // Initial question depends on active dataset
    let initialQ = 'Is it a living thing (animal, plant, or organism)?';
    if (engine.currentDatasetId !== 'master') {
      const best = engine.getLocalBestQuestion();
      if (best) {
        initialQ = engine.knowledge.questions[best] || best;
      }
    }

    setCurrentPrompt(initialQ);
    setIsLoading(false);
    setPhase('PLAYING');
    forceUpdate();
  }, [engine]);

  // Handle switching datasets
  const handleSelectDataset = useCallback(
    (datasetId: any) => {
      soundEffects.playClick();
      engine.setDataset(datasetId);
      handleStartGame();
    },
    [engine, handleStartGame]
  );

  // Trigger deduction and guess
  const executeFinalGuess = useCallback(async () => {
    setIsLoading(true);
    soundEffects.playProcessing();
    try {
      const deduction = await engine.deduceFinalGuess();
      setCurrentGuess(deduction.guess);
      setGuessExplanation(deduction.explanation || null);
      setPhase('GUESSING');
      setCurrentPrompt(null);
    } catch {
      const fallback = engine.getGuess();
      setCurrentGuess(fallback);
      setPhase('GUESSING');
      setCurrentPrompt(null);
    } finally {
      setIsLoading(false);
      forceUpdate();
    }
  }, [engine]);

  // Submit Answer
  const handleAnswer = useCallback(
    async (choice: AnswerChoice) => {
      if (phase !== 'PLAYING' || !currentPrompt || isLoading) return;

      soundEffects.playAnswer(choice);
      engine.answerQuestion(currentPrompt, choice);

      const nextRoundNumber = engine.answerHistory.length + 1;

      // Check if limit reached
      if (engine.answerHistory.length >= totalQuestionsLimit) {
        await executeFinalGuess();
        return;
      }

      setIsLoading(true);
      try {
        // Fetch adaptive next question based on the user's answers!
        const nextResult = await engine.getAdaptiveNextQuestion(nextRoundNumber);

        if (nextResult.readyToGuess && engine.answerHistory.length >= 8) {
          // AI has narrowed down the word with high certainty!
          await executeFinalGuess();
        } else {
          setCurrentPrompt(nextResult.question);
        }
      } catch (err) {
        console.error('Failed to get next adaptive question:', err);
        const fallback = engine.getLocalBestQuestion();
        const p = fallback ? engine.knowledge.questions[fallback] || fallback : 'Does it make sound?';
        setCurrentPrompt(p);
      } finally {
        setIsLoading(false);
        forceUpdate();
      }
    },
    [phase, currentPrompt, isLoading, engine, totalQuestionsLimit, executeFinalGuess]
  );

  // Undo Last Answer
  const handleUndo = useCallback(() => {
    if (phase !== 'PLAYING' || isLoading) return;
    const ok = engine.undoLastAnswer();
    if (ok) {
      soundEffects.playClick();
      const prev = engine.getLocalBestQuestion();
      if (prev) {
        setCurrentPrompt(engine.knowledge.questions[prev] || prev);
      }
      forceUpdate();
    }
  }, [phase, isLoading, engine]);

  // Force Guess Now
  const handleGuessNow = useCallback(() => {
    if (phase !== 'PLAYING' || isLoading) return;
    executeFinalGuess();
  }, [phase, isLoading, executeFinalGuess]);

  // User confirms whether the device's guess was right or wrong
  const handleConfirmGuess = useCallback(
    (isCorrect: boolean) => {
      if (isCorrect) {
        soundEffects.playVictory();
        setPhase('VICTORY');
        setGamesWon((prev) => {
          const next = prev + 1;
          try {
            localStorage.setItem('20q_games_won', String(next));
          } catch {}
          return next;
        });
      } else {
        soundEffects.playDefeat();
        setWrongGuess(currentGuess || 'Mystery Item');
        setPhase('LEARNING');
      }
      forceUpdate();
    },
    [currentGuess]
  );

  // Learning completion
  const handleCommitLearning = useCallback(
    (correctName: string, newQText: string) => {
      if (!wrongGuess) return;
      soundEffects.playLearnSuccess();
      engine.learn(wrongGuess, correctName, newQText);
      setPhase('LEARNED_SUCCESS');
      setWrongGuess(null);
      forceUpdate();
    },
    [wrongGuess, engine]
  );

  // Cycle LCD theme
  const handleCycleTheme = useCallback(() => {
    soundEffects.playClick();
    setTheme((prev) => {
      if (prev === 'emerald') return 'amber';
      if (prev === 'amber') return 'cyan';
      if (prev === 'cyan') return 'ruby';
      return 'emerald';
    });
  }, []);

  // Toggle Sound
  const handleToggleSound = useCallback(() => {
    soundEffects.enabled = !soundEffects.enabled;
    setSoundEnabled(soundEffects.enabled);
    if (soundEffects.enabled) {
      soundEffects.playClick();
    }
  }, []);

  // Toggle Question Mode (AI Adaptive vs Local ROM)
  const handleToggleSmartMode = useCallback(() => {
    soundEffects.playClick();
    engine.useAiAdaptive = !engine.useAiAdaptive;
    setSmartMode(engine.useAiAdaptive);
    forceUpdate();
  }, [engine]);

  // Global Keyboard listener for tactile physical buttons
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      const key = e.key.toLowerCase();

      if (phase === 'PLAYING' && !isLoading) {
        if (key === 'y') {
          e.preventDefault();
          handleAnswer('yes');
        } else if (key === 'n') {
          e.preventDefault();
          handleAnswer('no');
        } else if (key === 's') {
          e.preventDefault();
          handleAnswer('sometimes');
        } else if (key === 'u' || key === '?') {
          e.preventDefault();
          handleAnswer('unknown');
        } else if (key === 'z') {
          e.preventDefault();
          handleUndo();
        } else if (key === 'g') {
          e.preventDefault();
          handleGuessNow();
        }
      } else if (phase === 'GUESSING') {
        if (key === 'y') {
          e.preventDefault();
          handleConfirmGuess(true);
        } else if (key === 'n') {
          e.preventDefault();
          handleConfirmGuess(false);
        }
      }

      if (
        key === 'r' ||
        (key === 'enter' && (phase === 'READY' || phase === 'VICTORY' || phase === 'LEARNING' || phase === 'LEARNED_SUCCESS'))
      ) {
        e.preventDefault();
        handleStartGame();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, isLoading, handleAnswer, handleUndo, handleGuessNow, handleConfirmGuess, handleStartGame]);

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500 selection:text-zinc-950">
      {/* 3-Zone Top Bar */}
      <TopBar
        onOpenHowItWorks={() => setShowHowItWorks(true)}
        onOpenInspector={() => setShowInspector(true)}
        onNewGame={handleStartGame}
      />

      {/* Main Workspace Frame */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 md:py-8 flex flex-col items-center justify-center">
        {/* Editorial Subtitle / Status row */}
        <div className="w-full flex items-center justify-between mb-3 md:mb-5 max-w-2xl px-2">
          <div className="flex items-center gap-2 text-xs text-zinc-400 font-tech">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Cpu className="w-3.5 h-3.5" />
              <span>{smartMode ? 'Adaptive Neural AI' : '64-Bit Local ROM'}</span>
            </span>
            <span aria-hidden="true">·</span>
            <span>{askedCount}/20 Questions</span>
            <span aria-hidden="true">·</span>
            <span>{engine.knowledge.objects.length} Known Words</span>
          </div>

          <div className="flex items-center gap-3 text-xs font-tech">
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <Award className="w-3.5 h-3.5" />
              <span>{gamesWon} Wins</span>
            </span>
          </div>
        </div>

        {/* Prominent Active Question Banner (Ensures user ALWAYS clearly sees what question they are being asked) */}
        {phase === 'PLAYING' && (
          <div className="w-full max-w-xl mx-auto mb-3 p-3.5 rounded-2xl bg-zinc-900/90 border-2 border-emerald-500/50 text-center shadow-lg animate-fade-in">
            <div className="text-[11px] font-tech font-bold uppercase tracking-widest text-emerald-400 mb-1 flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>QUESTION #{askedCount + 1} OF 20</span>
              {isLoading && <span className="text-amber-400 font-bold">(CALCULATING NEXT ANGLE...)</span>}
            </div>
            <div className="text-base sm:text-xl font-tech font-bold text-white tracking-wide">
              "{currentPrompt || 'Is it a living thing (animal, plant, or organism)?'}"
            </div>
            <div className="text-xs text-zinc-400 mt-1">
              Press the <strong className="text-emerald-400">YES [Y]</strong>, <strong className="text-rose-400">NO [N]</strong>, <strong className="text-amber-400">SOMETIMES [S]</strong>, or <strong className="text-sky-400">UNKNOWN [U]</strong> buttons below to answer!
            </div>
          </div>
        )}

        {/* Prominent Final Guess Banner (Ensures user ALWAYS sees the final answer clearly regardless of circle design) */}
        {phase === 'GUESSING' && (
          <div className="w-full max-w-xl mx-auto mb-4 p-5 rounded-3xl bg-zinc-900/95 border-2 border-purple-400 text-center shadow-[0_0_35px_rgba(168,85,247,0.35)] animate-fade-in">
            <div className="text-xs font-tech font-bold uppercase tracking-widest text-purple-300 mb-1 flex items-center justify-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-ping" />
              <span>★ FINAL MIND READ DEDUCTION ★</span>
            </div>
            <div className="text-sm font-tech text-zinc-300">
              The 64-bit neural engine deduces that you were thinking of:
            </div>
            <div className="text-3xl sm:text-5xl font-retro-brand font-black text-emerald-400 uppercase tracking-widest my-3 drop-shadow-[0_0_20px_rgba(52,211,153,0.6)]">
              {currentGuess}
            </div>
            {guessExplanation && (
              <p className="text-xs font-tech text-zinc-300 max-w-md mx-auto mb-3 px-2">
                "{guessExplanation}"
              </p>
            )}
            <div className="text-sm font-tech font-bold text-white mb-3">
              Was the device right?
            </div>
            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => handleConfirmGuess(true)}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-tech text-xs sm:text-sm font-black uppercase tracking-wider transition-all active:scale-95 shadow-lg shadow-emerald-950 cursor-pointer"
              >
                YES! YOU GOT IT! [Y]
              </button>
              <button
                type="button"
                onClick={() => handleConfirmGuess(false)}
                className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-tech text-xs sm:text-sm font-black uppercase tracking-wider transition-all active:scale-95 shadow-lg shadow-rose-950 cursor-pointer"
              >
                NO, WRONG GUESS [N]
              </button>
            </div>
          </div>
        )}

        {/* Prominent Victory Celebration Banner */}
        {phase === 'VICTORY' && (
          <div className="w-full max-w-xl mx-auto mb-4 p-5 rounded-3xl bg-zinc-900/95 border-2 border-emerald-400 text-center shadow-[0_0_35px_rgba(52,211,153,0.35)] animate-fade-in">
            <div className="text-xs font-tech font-bold uppercase tracking-widest text-emerald-300 mb-1">
              ★ 64-BIT NEURAL VICTORY! ★
            </div>
            <div className="text-sm font-tech text-zinc-300">
              The device successfully read your thoughts:
            </div>
            <div className="text-3xl sm:text-5xl font-retro-brand font-black text-white uppercase tracking-widest my-2 drop-shadow">
              {currentGuess}
            </div>
            <div className="text-xs font-tech text-zinc-400 mb-4">
              Deduction solved in {engine.answerHistory.length} questions!
            </div>
            <button
              type="button"
              onClick={handleStartGame}
              className="px-6 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-zinc-950 font-tech text-xs sm:text-sm font-black uppercase tracking-wider transition-all active:scale-95 shadow cursor-pointer"
            >
              PLAY NEW ROUND [R]
            </button>
          </div>
        )}

        {/* Central Round 64-Bit Physical Device */}
        <div className="flex flex-col items-center justify-center w-full my-2">
          <RoundDevice
            phase={phase}
            currentQuestion={currentPrompt}
            questionNumber={askedCount + 1}
            totalQuestions={totalQuestionsLimit}
            confidence={confidence}
            guess={currentGuess}
            explanation={guessExplanation}
            expression={expression}
            theme={theme}
            historyLength={engine.answerHistory.length}
            lastAnswer={lastAnswer}
            learnedCount={learnedCount}
            soundEnabled={soundEnabled}
            smartQuestionMode={smartMode}
            canUndo={engine.answerHistory.length > 0}
            canGuessNow={engine.answerHistory.length >= 3}
            isLoading={isLoading}
            datasetId={engine.currentDatasetId}
            onSelectDataset={handleSelectDataset}
            onStartGame={handleStartGame}
            onAnswer={handleAnswer}
            onConfirmGuess={handleConfirmGuess}
            onUndo={handleUndo}
            onGuessNow={handleGuessNow}
            onToggleSound={handleToggleSound}
            onCycleTheme={handleCycleTheme}
            onToggleSmartMode={handleToggleSmartMode}
            onOpenInspector={() => setShowInspector(true)}
          />
        </div>

        {/* Information Grid below device (History, Controls, Knowledge stats) */}
        <div className="w-full max-w-4xl mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Column 1: Live Question History */}
          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800 text-xs font-tech uppercase text-zinc-300">
              <span className="flex items-center gap-1.5 font-bold">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>Adaptive Deduction Log</span>
              </span>
              <span className="text-zinc-500 tabular-nums">
                {engine.answerHistory.length}/20
              </span>
            </div>
            <div className="flex-1 max-h-48 overflow-y-auto space-y-1.5 pr-1 text-xs">
              {engine.answerHistory.length === 0 ? (
                <div className="h-28 flex flex-col items-center justify-center text-center text-zinc-500 font-tech">
                  <span>No questions answered yet.</span>
                  <span className="text-[11px] text-zinc-600 mt-1">
                    Press START to begin mind-reading!
                  </span>
                </div>
              ) : (
                engine.answerHistory.map((item, idx) => (
                  <div
                    key={`${item.qKey}-${idx}`}
                    className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/70 border border-zinc-800/60 text-[11px]"
                  >
                    <span className="text-zinc-300 truncate max-w-[170px]" title={item.prompt}>
                      {idx + 1}. {item.prompt}
                    </span>
                    <span
                      className={`font-tech font-bold uppercase ${
                        item.answer === 'yes'
                          ? 'text-emerald-400'
                          : item.answer === 'no'
                          ? 'text-rose-400'
                          : item.answer === 'sometimes'
                          ? 'text-amber-400'
                          : 'text-sky-400'
                      }`}
                    >
                      {item.answer}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Column 2: Physical Hardware Shortcuts */}
          <div id="shortcuts" className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800 text-xs font-tech uppercase text-zinc-300">
              <span className="flex items-center gap-1.5 font-bold">
                <Keyboard className="w-3.5 h-3.5 text-purple-400" />
                <span>Tactile Hotkeys</span>
              </span>
              <span className="text-zinc-500 font-mono text-[10px]">64-BIT I/O</span>
            </div>
            <div className="space-y-2 text-xs font-tech">
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-zinc-950/50">
                <span className="text-zinc-300">YES Answer</span>
                <kbd className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-emerald-300 text-[11px] font-mono">
                  [Y]
                </kbd>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-zinc-950/50">
                <span className="text-zinc-300">NO Answer</span>
                <kbd className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-rose-300 text-[11px] font-mono">
                  [N]
                </kbd>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-zinc-950/50">
                <span className="text-zinc-300">SOMETIMES Answer</span>
                <kbd className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-amber-300 text-[11px] font-mono">
                  [S]
                </kbd>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-zinc-950/50">
                <span className="text-zinc-300">UNKNOWN Answer</span>
                <kbd className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-sky-300 text-[11px] font-mono">
                  [U]
                </kbd>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-zinc-950/50">
                <span className="text-zinc-300">UNDO Last Move</span>
                <kbd className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 text-[11px] font-mono">
                  [Z]
                </kbd>
              </div>
            </div>
          </div>

          {/* Column 3: How the Adaptive Deduction works */}
          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800 text-xs font-tech uppercase text-zinc-300">
                <span className="flex items-center gap-1.5 font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                  <span>Adaptive Deduction</span>
                </span>
                <span className="text-emerald-400 text-[10px] font-bold">ACTIVE</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Questions are never random or static. Each question is calculated based directly
                on your previous responses to halve the remaining candidate possibilities and deduce
                the exact word you have in mind by question 20.
              </p>
            </div>
            <div className="pt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowInspector(true)}
                className="w-full py-2 px-3 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-200 text-xs font-tech font-bold uppercase transition-colors text-center cursor-pointer"
              >
                Inspect Memory & Scores ({engine.knowledge.objects.length} Objects)
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-zinc-900 py-4 px-6 text-center text-xs text-zinc-600 font-tech">
        <div className="flex items-center justify-center gap-2">
          <span>20 Questions 64-Bit Neural Device</span>
          <span>·</span>
          <span>Adaptive Deduction Engine</span>
        </div>
      </footer>

      {/* Modals & Overlays */}
      {phase === 'LEARNING' && wrongGuess && (
        <LearningInterface
          wrongGuess={wrongGuess}
          onCommitLearning={handleCommitLearning}
          onCancel={() => {
            setPhase('READY');
            setWrongGuess(null);
          }}
        />
      )}

      {showInspector && (
        <KnowledgeInspector
          knowledge={engine.knowledge}
          candidateRanking={candidateRanking}
          currentDatasetId={engine.currentDatasetId}
          onSelectDataset={handleSelectDataset}
          onClose={() => setShowInspector(false)}
          onResetFactory={() => {
            engine.resetToFactory();
            setPhase('READY');
            forceUpdate();
          }}
          onImportKnowledge={(data: KnowledgeData) => {
            engine.importKnowledge(data);
            setPhase('READY');
            forceUpdate();
          }}
        />
      )}

      {showHowItWorks && (
        <HowItWorksModal onClose={() => setShowHowItWorks(false)} />
      )}
    </div>
  );
}
