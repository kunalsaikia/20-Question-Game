import React from 'react';
import { BacklightTheme, DeviceExpression, GamePhase, AnswerChoice } from '../types/game';
import { DatasetPresetId } from '../services/twentyQuestions';
import { DeviceScreen } from './DeviceScreen';
import { DeviceButtons } from './DeviceButtons';
import { Volume2, VolumeX, Palette, RotateCcw, Database, BrainCircuit, Layers } from 'lucide-react';

interface RoundDeviceProps {
  phase: GamePhase;
  currentQuestion: string | null;
  questionNumber: number;
  totalQuestions: number;
  confidence: number;
  guess: string | null;
  explanation?: string | null;
  expression: DeviceExpression;
  theme: BacklightTheme;
  historyLength: number;
  lastAnswer: string | null;
  learnedCount: number;
  soundEnabled: boolean;
  smartQuestionMode: boolean;
  canUndo: boolean;
  canGuessNow: boolean;
  isLoading?: boolean;
  datasetId: DatasetPresetId;
  onSelectDataset: (id: DatasetPresetId) => void;
  onStartGame: () => void;
  onAnswer: (choice: AnswerChoice) => void;
  onConfirmGuess: (correct: boolean) => void;
  onUndo: () => void;
  onGuessNow: () => void;
  onToggleSound: () => void;
  onCycleTheme: () => void;
  onToggleSmartMode: () => void;
  onOpenInspector: () => void;
}

export const RoundDevice: React.FC<RoundDeviceProps> = ({
  phase,
  currentQuestion,
  questionNumber,
  totalQuestions,
  confidence,
  guess,
  explanation,
  expression,
  theme,
  historyLength,
  lastAnswer,
  learnedCount,
  soundEnabled,
  smartQuestionMode,
  canUndo,
  canGuessNow,
  isLoading = false,
  datasetId,
  onSelectDataset,
  onStartGame,
  onAnswer,
  onConfirmGuess,
  onUndo,
  onGuessNow,
  onToggleSound,
  onCycleTheme,
  onToggleSmartMode,
  onOpenInspector,
}) => {
  const datasetLabels: Record<DatasetPresetId, string> = {
    master: 'MASTER (120)',
    big: 'BIG.CSV (100)',
    medium: 'MED.CSV (13)',
    small: 'SMALL.CSV (12)',
    micro: 'MICRO.CSV (5)',
  };

  const cycleDataset = () => {
    const list: DatasetPresetId[] = ['master', 'big', 'medium', 'small', 'micro'];
    const nextIdx = (list.indexOf(datasetId) + 1) % list.length;
    onSelectDataset(list[nextIdx]);
  };

  return (
    <div className="relative flex flex-col items-center justify-center p-2 sm:p-4">
      {/* Outer ambient shadow & backlight halo */}
      <div
        className={`absolute rounded-full filter blur-3xl opacity-25 pointer-events-none transition-all duration-700 ${
          theme === 'emerald'
            ? 'bg-emerald-500 w-[600px] h-[600px] sm:w-[750px] sm:h-[750px]'
            : theme === 'amber'
            ? 'bg-amber-500 w-[600px] h-[600px] sm:w-[750px] sm:h-[750px]'
            : theme === 'cyan'
            ? 'bg-cyan-500 w-[600px] h-[600px] sm:w-[750px] sm:h-[750px]'
            : 'bg-rose-500 w-[600px] h-[600px] sm:w-[750px] sm:h-[750px]'
        }`}
      />

      {/* Main Circular Device Chassis */}
      <div className="relative w-[370px] h-[370px] xs:w-[430px] xs:h-[430px] sm:w-[560px] sm:h-[560px] md:w-[640px] md:h-[640px] lg:w-[680px] lg:h-[680px] rounded-full chassis-radial-lighting p-3 sm:p-5 md:p-7 flex flex-col items-center justify-between border-[6px] sm:border-[8px] border-zinc-700/80 shadow-[0_20px_60px_rgba(0,0,0,0.9),inset_0_2px_4px_rgba(255,255,255,0.25)] select-none">
        
        {/* Recessed Screws / Rivets at 4 Radial Angles */}
        <div className="absolute top-2 sm:top-3 left-1/2 -translate-x-1/2 w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-zinc-800 border border-zinc-950 shadow-inner flex items-center justify-center">
          <div className="w-1.5 h-0.5 bg-zinc-950 rotate-45" />
        </div>
        <div className="absolute bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-zinc-800 border border-zinc-950 shadow-inner flex items-center justify-center">
          <div className="w-1.5 h-0.5 bg-zinc-950 rotate-12" />
        </div>
        <div className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-zinc-800 border border-zinc-950 shadow-inner flex items-center justify-center">
          <div className="w-1.5 h-0.5 bg-zinc-950 rotate-90" />
        </div>
        <div className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-zinc-800 border border-zinc-950 shadow-inner flex items-center justify-center">
          <div className="w-1.5 h-0.5 bg-zinc-950 rotate-45" />
        </div>

        {/* Top Arc Brand Badge & Hardware Micro-Controls */}
        <div className="w-full flex items-center justify-between px-3 sm:px-6 z-30 pt-1">
          {/* Left Controls: Sound & Theme */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={onToggleSound}
              title={soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
              className="p-1 sm:p-1.5 rounded-full bg-zinc-800/90 hover:bg-zinc-700 border border-zinc-600 text-zinc-300 shadow active:translate-y-0.5 transition-all cursor-pointer"
            >
              {soundEnabled ? (
                <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-500" />
              )}
            </button>
            <button
              type="button"
              onClick={onCycleTheme}
              title="Cycle Backlight Color"
              className="p-1 sm:p-1.5 rounded-full bg-zinc-800/90 hover:bg-zinc-700 border border-zinc-600 text-zinc-300 shadow active:translate-y-0.5 transition-all cursor-pointer"
            >
              <Palette className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            </button>
          </div>

          {/* Center Brand Header & Dataset Selector Pill */}
          <div className="flex flex-col items-center">
            <div className="font-retro-brand font-black text-[11px] sm:text-xs md:text-sm tracking-[0.2em] text-zinc-200 uppercase drop-shadow">
              20Q · 64-BIT
            </div>
            {/* Quick dataset cycler */}
            <button
              type="button"
              onClick={cycleDataset}
              title="Click to cycle dataset (Master, Big, Med, Small, Micro)"
              className="mt-0.5 px-2 py-0.5 rounded-full bg-zinc-900/90 hover:bg-zinc-800 border border-emerald-500/40 text-[9px] font-tech text-emerald-400 font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Layers className="w-2.5 h-2.5" />
              <span>{datasetLabels[datasetId]}</span>
            </button>
          </div>

          {/* Right Controls: Question Mode, Inspector, & Reset */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={onToggleSmartMode}
              title={smartQuestionMode ? 'Adaptive Inference Mode' : 'Direct Matrix Mode'}
              className="p-1 sm:p-1.5 rounded-full bg-zinc-800/90 hover:bg-zinc-700 border border-zinc-600 text-zinc-300 shadow active:translate-y-0.5 transition-all cursor-pointer"
            >
              <BrainCircuit
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                  smartQuestionMode ? 'text-purple-400' : 'text-zinc-500'
                }`}
              />
            </button>
            <button
              type="button"
              onClick={onOpenInspector}
              title="Open Knowledge Inspector & Datasets"
              className="p-1 sm:p-1.5 rounded-full bg-zinc-800/90 hover:bg-zinc-700 border border-zinc-600 text-zinc-300 shadow active:translate-y-0.5 transition-all cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400" />
            </button>
            <button
              type="button"
              onClick={onStartGame}
              title="Restart Game"
              className="p-1 sm:p-1.5 rounded-full bg-zinc-800/90 hover:bg-zinc-700 border border-zinc-600 text-zinc-300 shadow active:translate-y-0.5 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
            </button>
          </div>
        </div>

        {/* Central Circular Screen with Metallic Bezel */}
        <div className="relative w-[250px] h-[250px] xs:w-[295px] xs:h-[295px] sm:w-[390px] sm:h-[390px] md:w-[450px] md:h-[450px] lg:w-[480px] lg:h-[480px] rounded-full bezel-ring p-2 sm:p-3.5 md:p-4 flex items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.9),inset_0_2px_4px_rgba(255,255,255,0.15)]">
          {/* Glass Lens reflection overlay */}
          <div className="absolute inset-0 rounded-full lcd-lens-glass pointer-events-none z-30" />
          <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
            <DeviceScreen
              phase={phase}
              currentQuestion={currentQuestion}
              questionNumber={questionNumber}
              totalQuestions={totalQuestions}
              confidence={confidence}
              guess={guess}
              explanation={explanation}
              expression={expression}
              theme={theme}
              historyLength={historyLength}
              lastAnswer={lastAnswer}
              learnedCount={learnedCount}
              isLoading={isLoading}
              datasetName={datasetLabels[datasetId]}
              onStartGame={onStartGame}
              onConfirmGuess={onConfirmGuess}
            />
          </div>
        </div>

        {/* Tactile Answer Buttons Curved along the Bottom Arc */}
        <div className="w-full flex flex-col items-center gap-1 sm:gap-2 z-30 pb-0.5 sm:pb-1">
          <DeviceButtons
            phase={phase}
            disabled={isLoading}
            canUndo={canUndo}
            canGuessNow={canGuessNow}
            onAnswer={onAnswer}
            onConfirmGuess={onConfirmGuess}
            onUndo={onUndo}
            onGuessNow={onGuessNow}
            onStartGame={onStartGame}
          />
        </div>
      </div>
    </div>
  );
};
