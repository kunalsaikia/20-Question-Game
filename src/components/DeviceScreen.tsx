import React from 'react';
import { RotateCcw, Trophy, Frown, Sparkles, BrainCircuit } from 'lucide-react';
import { BacklightTheme, DeviceExpression, GamePhase } from '../types/game';

interface DeviceScreenProps {
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
  isLoading: boolean;
  datasetName?: string;
  onStartGame: () => void;
  onConfirmGuess?: (correct: boolean) => void;
}

export const DeviceScreen: React.FC<DeviceScreenProps> = ({
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
  isLoading,
  datasetName,
  onStartGame,
  onConfirmGuess,
}) => {
  const themeStyles = {
    emerald: {
      bg: 'bg-emerald-950/95',
      screenBorder: 'border-emerald-600/70',
      textPrimary: 'text-emerald-300',
      textMuted: 'text-emerald-500/80',
      accent: 'text-emerald-200',
      glow: 'shadow-[inset_0_0_40px_rgba(16,185,129,0.35)]',
      dotColor: 'bg-emerald-400',
    },
    amber: {
      bg: 'bg-amber-950/95',
      screenBorder: 'border-amber-600/70',
      textPrimary: 'text-amber-200',
      textMuted: 'text-amber-400/80',
      accent: 'text-amber-100',
      glow: 'shadow-[inset_0_0_40px_rgba(245,158,11,0.35)]',
      dotColor: 'bg-amber-400',
    },
    cyan: {
      bg: 'bg-cyan-950/95',
      screenBorder: 'border-cyan-600/70',
      textPrimary: 'text-cyan-200',
      textMuted: 'text-cyan-400/80',
      accent: 'text-cyan-100',
      glow: 'shadow-[inset_0_0_40px_rgba(6,182,212,0.35)]',
      dotColor: 'bg-cyan-400',
    },
    ruby: {
      bg: 'bg-rose-950/95',
      screenBorder: 'border-rose-600/70',
      textPrimary: 'text-rose-200',
      textMuted: 'text-rose-400/80',
      accent: 'text-rose-100',
      glow: 'shadow-[inset_0_0_40px_rgba(244,63,94,0.35)]',
      dotColor: 'bg-rose-400',
    },
  }[theme];

  // Render animated 8-bit dot-matrix avatar expressions
  const renderAvatar = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center gap-1.5">
          <span className="text-xs sm:text-base font-mono tracking-widest animate-pulse text-amber-300 font-bold">
            [ ⌁ DEDUCING ⌁ ]
          </span>
        </div>
      );
    }

    switch (expression) {
      case 'thinking':
        return <span className="text-xs sm:text-base font-mono tracking-widest animate-pulse font-bold">[ • ~ • ]</span>;
      case 'curious':
        return <span className="text-xs sm:text-base font-mono tracking-widest font-bold">[ o _ O ]</span>;
      case 'smug':
        return <span className="text-xs sm:text-base font-mono tracking-widest text-emerald-300 font-bold">[ ¬ ‿ ¬ ]</span>;
      case 'celebrating':
        return <span className="text-xs sm:text-base font-mono tracking-widest animate-bounce text-emerald-300 font-bold">[ ＾▽＾ ]</span>;
      case 'puzzled':
        return <span className="text-xs sm:text-base font-mono tracking-widest text-rose-300 font-bold">[ × _ × ]</span>;
      case 'learning':
        return <span className="text-xs sm:text-base font-mono tracking-widest animate-pulse text-sky-300 font-bold">[ ⚡ _ ⚡ ]</span>;
      case 'idle':
      default:
        return <span className="text-xs sm:text-base font-mono tracking-widest font-bold">[ • _ • ]</span>;
    }
  };

  const displayQuestion = currentQuestion || 'Is it a living thing (animal, plant, or organism)?';

  return (
    <div
      className={`relative w-full h-full rounded-full border-4 ${themeStyles.screenBorder} ${themeStyles.bg} ${themeStyles.glow} overflow-hidden p-2.5 sm:p-5 md:p-6 flex flex-col justify-between items-center text-center select-none shadow-inner`}
    >
      {/* Light Scanline & pixel grid overlays */}
      <div className="absolute inset-0 pointer-events-none lcd-scanlines opacity-10 z-10" />
      <div className="absolute inset-0 pointer-events-none lcd-grid-pattern opacity-10 z-10" />

      {/* Top LCD Telemetry Row - constrained to inner safe circle */}
      <div className="w-full max-w-[82%] flex items-center justify-between z-20 font-tech text-[10px] sm:text-xs tracking-wider pt-0.5 sm:pt-1">
        <div className={`flex items-center gap-1.5 ${themeStyles.textMuted}`}>
          <span className="uppercase font-bold">64-BIT</span>
          {datasetName && <span className="hidden sm:inline uppercase text-[9px] text-zinc-400">· {datasetName}</span>}
          {learnedCount > 0 && <span className="text-emerald-400 font-bold">· +{learnedCount}</span>}
        </div>
        <div className="tabular-nums font-mono font-bold text-white bg-black/60 px-2 sm:px-2.5 py-0.5 rounded border border-white/10 text-[10px] sm:text-xs">
          {phase === 'PLAYING'
            ? `Q ${String(questionNumber).padStart(2, '0')}/${totalQuestions}`
            : phase === 'GUESSING'
            ? 'FINAL GUESS'
            : phase === 'VICTORY'
            ? 'VICTORY'
            : phase === 'LEARNING'
            ? 'DEFEAT'
            : phase === 'READY'
            ? 'STANDBY'
            : 'SYS ACTIVE'}
        </div>
        <div className={`tabular-nums font-mono font-bold ${themeStyles.textPrimary} text-[10px] sm:text-xs`}>
          {phase === 'PLAYING' ? `${confidence}% CONF` : 'READY'}
        </div>
      </div>

      {/* Center Display Area - Perfectly centered inside expanded circle, preventing clipped edges */}
      <div className="w-full max-w-[88%] flex-1 flex flex-col items-center justify-center z-20 py-1 sm:py-2">
        {/* Animated Avatar expression */}
        <div className={`mb-1 sm:mb-2 font-lcd ${themeStyles.textPrimary}`}>
          {renderAvatar()}
        </div>

        {/* Phase: READY */}
        {phase === 'READY' && (
          <div className="space-y-2 sm:space-y-3 max-w-[92%] px-2">
            <div className="font-retro-brand text-base sm:text-xl md:text-2xl font-black tracking-widest text-white uppercase drop-shadow">
              20 QUESTIONS
            </div>
            <p className="font-tech text-xs sm:text-sm leading-snug sm:leading-relaxed text-zinc-200">
              Think of ANY animal, object, or thing.
              <br />
              I will read your thoughts in 20 questions!
            </p>
            <div className="pt-1 sm:pt-2 flex flex-col items-center">
              <button
                type="button"
                onClick={onStartGame}
                className="px-6 sm:px-8 py-2 sm:py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-zinc-950 font-retro-brand text-xs sm:text-sm md:text-base font-black tracking-widest uppercase transition-all duration-150 transform hover:scale-105 active:scale-95 shadow-[0_0_25px_rgba(16,185,129,0.7)] border-2 border-white/50 cursor-pointer animate-pulse"
              >
                [ START MIND READ ]
              </button>
              <span className="text-[10px] font-tech text-emerald-300/80 font-bold uppercase mt-1">
                Press [Enter] or [R] to begin
              </span>
            </div>
          </div>
        )}

        {/* Phase: PLAYING (Question is clearly visible, high-contrast, never clipped) */}
        {phase === 'PLAYING' && (
          <div className="w-full space-y-1.5 sm:space-y-2 max-w-[95%]">
            <div className="flex items-center justify-center gap-2">
              <span className="font-tech text-[10px] sm:text-xs tracking-widest uppercase font-bold text-emerald-300 bg-emerald-950/80 px-2.5 py-0.5 rounded border border-emerald-500/40">
                QUESTION #{questionNumber} OF {totalQuestions}
              </span>
              {isLoading && (
                <span className="text-[10px] sm:text-xs font-tech text-amber-300 animate-pulse font-bold">
                  THINKING...
                </span>
              )}
            </div>

            {/* High-visibility primary question text box */}
            <div className="p-2.5 sm:p-3.5 rounded-2xl bg-black/80 border border-white/30 shadow-lg">
              <div className="font-tech text-xs sm:text-base md:text-lg font-bold leading-snug sm:leading-snug text-white drop-shadow">
                "{displayQuestion}"
              </div>
            </div>

            {lastAnswer && historyLength > 0 && (
              <div className="font-tech text-[10px] sm:text-xs text-zinc-300 pt-0.5">
                PREVIOUS ANSWER: <span className="uppercase font-bold text-emerald-400 underline">{lastAnswer}</span>
              </div>
            )}
          </div>
        )}

        {/* Phase: GUESSING (Guessed word in big bold legible letters, no truncate) */}
        {phase === 'GUESSING' && (
          <div className="w-full space-y-1 sm:space-y-2 max-w-[94%]">
            <div className="font-tech text-[10px] sm:text-xs tracking-widest uppercase font-bold text-purple-300 flex items-center justify-center gap-1.5">
              <BrainCircuit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>★ MIND READ COMPLETE ★</span>
            </div>
            <div className="font-tech text-xs sm:text-sm text-zinc-300 font-medium">
              I AM GUESSING IT IS A...
            </div>
            {/* The Guessed word in huge, bright typography centered safely within the circle */}
            <div className="my-1 sm:my-2 py-2 sm:py-3 px-3 sm:px-4 rounded-2xl bg-black/85 border-2 border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.5)]">
              <div className="font-retro-brand text-lg sm:text-2xl md:text-3xl font-black tracking-wider uppercase text-emerald-300 drop-shadow break-words text-center leading-tight">
                {guess}
              </div>
            </div>
            <div className="font-tech text-xs sm:text-sm font-bold text-white pt-0.5">
              WAS I RIGHT?
            </div>
            <div className="font-tech text-[10px] sm:text-xs text-emerald-400 font-bold tracking-wider">
              [PRESS YES [Y] OR NO [N] BELOW]
            </div>
          </div>
        )}

        {/* Phase: VICTORY - Highly visible, spacious Play Again option */}
        {phase === 'VICTORY' && (
          <div className="space-y-1.5 sm:space-y-2.5 max-w-[94%] px-2">
            <div className="font-retro-brand text-sm sm:text-lg md:text-xl font-black tracking-wider text-emerald-300 flex items-center justify-center gap-2">
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300" />
              <span>★ I WIN! ★</span>
            </div>
            <div className="font-tech text-xs sm:text-sm text-zinc-200 leading-tight">
              I deduced you were thinking of:
            </div>
            <div className="py-1 px-3 rounded-xl bg-black/80 border border-emerald-400/80 shadow-md">
              <span className="font-retro-brand text-base sm:text-2xl font-black uppercase text-emerald-300 drop-shadow">
                {guess}
              </span>
            </div>
            <div className="font-tech text-[10px] sm:text-xs text-zinc-300">
              Solved in <span className="font-bold text-white">{historyLength}</span> questions!
            </div>
            {/* Prominent, unmissable Play Again button inside circle */}
            <div className="pt-1 sm:pt-2 flex flex-col items-center">
              <button
                type="button"
                onClick={onStartGame}
                className="group px-6 sm:px-8 py-2.5 sm:py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-zinc-950 font-retro-brand text-xs sm:text-sm md:text-base font-black tracking-widest uppercase transition-all duration-150 transform hover:scale-105 active:scale-95 shadow-[0_0_25px_rgba(16,185,129,0.8),0_4px_12px_rgba(0,0,0,0.5)] border-2 border-white/50 cursor-pointer flex items-center gap-2 animate-pulse"
              >
                <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                <span>PLAY AGAIN</span>
              </button>
              <span className="text-[10px] font-tech text-emerald-300 font-bold uppercase mt-1 tracking-wider">
                [PRESS 'R' OR CLICK TO PLAY AGAIN]
              </span>
            </div>
          </div>
        )}

        {/* Phase: LEARNING (When device guessed wrong) - Clearly visible Play Again option! */}
        {phase === 'LEARNING' && (
          <div className="space-y-1.5 sm:space-y-2.5 max-w-[94%] px-2">
            <div className="font-retro-brand text-xs sm:text-base md:text-lg font-black tracking-wider text-rose-400 flex items-center justify-center gap-1.5">
              <Frown className="w-4 h-4 sm:w-5 sm:h-5 text-rose-300" />
              <span>YOU OUTSMARTED ME!</span>
            </div>
            <div className="font-tech text-xs sm:text-sm text-zinc-200 leading-tight">
              My guess <span className="font-bold text-rose-300 uppercase underline">"{guess}"</span> was wrong!
            </div>
            <div className="font-tech text-[10px] sm:text-xs text-zinc-300">
              You defeated the 64-bit neural engine!
            </div>
            {/* Prominent Play Again button inside circle right here! */}
            <div className="pt-1 sm:pt-2 flex flex-col items-center">
              <button
                type="button"
                onClick={onStartGame}
                className="group px-6 sm:px-8 py-2.5 sm:py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-zinc-950 font-retro-brand text-xs sm:text-sm md:text-base font-black tracking-widest uppercase transition-all duration-150 transform hover:scale-105 active:scale-95 shadow-[0_0_25px_rgba(16,185,129,0.8),0_4px_12px_rgba(0,0,0,0.5)] border-2 border-white/50 cursor-pointer flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                <span>PLAY AGAIN</span>
              </button>
              <span className="text-[10px] font-tech text-amber-300 font-bold mt-1">
                Teach me below, or click Play Again now!
              </span>
            </div>
          </div>
        )}

        {/* Phase: LEARNED_SUCCESS - Unmissable Play Again button */}
        {phase === 'LEARNED_SUCCESS' && (
          <div className="space-y-1.5 sm:space-y-2.5 max-w-[94%] px-2">
            <div className="font-retro-brand text-xs sm:text-base md:text-lg font-black tracking-wider text-emerald-300 flex items-center justify-center gap-1.5">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300" />
              <span>★ EEPROM FLASHED! ★</span>
            </div>
            <p className="font-tech text-xs sm:text-sm leading-tight text-zinc-200">
              New object and discriminator question saved to persistent neural memory!
            </p>
            <div className="pt-1 sm:pt-2 flex flex-col items-center">
              <button
                type="button"
                onClick={onStartGame}
                className="group px-6 sm:px-8 py-2.5 sm:py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-zinc-950 font-retro-brand text-xs sm:text-sm md:text-base font-black tracking-widest uppercase transition-all duration-150 transform hover:scale-105 active:scale-95 shadow-[0_0_25px_rgba(16,185,129,0.8),0_4px_12px_rgba(0,0,0,0.5)] border-2 border-white/50 cursor-pointer flex items-center gap-2 animate-pulse"
              >
                <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                <span>PLAY AGAIN</span>
              </button>
              <span className="text-[10px] font-tech text-emerald-300 font-bold uppercase mt-1 tracking-wider">
                [PRESS 'R' OR CLICK TO PLAY]
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom LCD Mini Bar */}
      <div className="w-full max-w-[82%] flex items-center justify-between z-20 font-tech text-[9px] sm:text-[11px] tracking-wider text-zinc-300 pb-0.5 sm:pb-1">
        <span className={themeStyles.textMuted}>NEURAL CORE</span>
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${themeStyles.dotColor} animate-ping`} />
          <span className="text-white font-bold">ONLINE</span>
        </div>
        <span className={themeStyles.textMuted}>ROM: 64-BIT</span>
      </div>
    </div>
  );
};
