import React from 'react';
import { AnswerChoice, GamePhase } from '../types/game';
import { Check, X, HelpCircle, MinusCircle, RotateCcw, Lightbulb } from 'lucide-react';

interface DeviceButtonsProps {
  phase: GamePhase;
  disabled: boolean;
  canUndo: boolean;
  canGuessNow: boolean;
  onAnswer: (choice: AnswerChoice) => void;
  onConfirmGuess?: (correct: boolean) => void;
  onUndo: () => void;
  onGuessNow: () => void;
  onStartGame?: () => void;
}

export const DeviceButtons: React.FC<DeviceButtonsProps> = ({
  phase,
  disabled,
  canUndo,
  canGuessNow,
  onAnswer,
  onConfirmGuess,
  onUndo,
  onGuessNow,
  onStartGame,
}) => {
  const isGuessing = phase === 'GUESSING';
  const isPlaying = phase === 'PLAYING';
  const isFinished = phase === 'VICTORY' || phase === 'LEARNING' || phase === 'LEARNED_SUCCESS';

  const isYesActive = (isPlaying && !disabled) || isGuessing;
  const isNoActive = (isPlaying && !disabled) || isGuessing;
  const isSometimesActive = isPlaying && !disabled;
  const isUnknownActive = isPlaying && !disabled;

  const handleYes = () => {
    if (isGuessing && onConfirmGuess) {
      onConfirmGuess(true);
    } else if (isPlaying && !disabled) {
      onAnswer('yes');
    }
  };

  const handleNo = () => {
    if (isGuessing && onConfirmGuess) {
      onConfirmGuess(false);
    } else if (isPlaying && !disabled) {
      onAnswer('no');
    }
  };

  return (
    <div className="w-full flex flex-col items-center gap-2 sm:gap-3 z-30 select-none">
      {/* If game is finished, display a large tactile Play Again hardware button */}
      {isFinished && onStartGame ? (
        <div className="w-full max-w-sm px-2 flex flex-col items-center">
          <button
            type="button"
            onClick={onStartGame}
            className="w-full py-2.5 sm:py-3.5 px-6 rounded-2xl cursor-pointer active:translate-y-1 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 hover:from-emerald-500 hover:via-teal-400 hover:to-emerald-500 border-2 border-emerald-300 text-zinc-950 font-retro-brand font-black text-xs sm:text-sm md:text-base tracking-widest uppercase shadow-[0_6px_0_#064e3b,0_12px_20px_rgba(0,0,0,0.6)] active:shadow-[0_2px_0_#064e3b] transition-all flex items-center justify-center gap-2 animate-pulse"
          >
            <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
            <span>PLAY AGAIN [R]</span>
          </button>
          <span className="text-[10px] font-tech text-emerald-300/90 font-bold mt-1 tracking-wider uppercase">
            Press [R] or click to start new game
          </span>
        </div>
      ) : (
        /* Primary 4 Answer Buttons Curved/Arranged for ergonomic tactile play */
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 md:gap-4 w-full max-w-md px-2">
          {/* YES Button */}
          <button
            type="button"
            disabled={!isYesActive}
            onClick={handleYes}
            className={`group relative flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl border-2 transition-all duration-100 ${
              !isYesActive
              ? 'opacity-35 cursor-not-allowed bg-zinc-900 border-zinc-800 text-zinc-600'
              : 'cursor-pointer active:translate-y-1 bg-gradient-to-b from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 border-emerald-400 text-white shadow-[0_6px_0_#064e3b,0_10px_15px_rgba(0,0,0,0.5)] active:shadow-[0_2px_0_#064e3b]'
          } ${isGuessing ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-zinc-950 animate-pulse' : ''}`}
          title={isGuessing ? 'Confirm YES: Device guessed correctly! [Y]' : "Press 'Y' or click to answer YES"}
        >
          {/* LED Indicator pip */}
          <div className="w-2.5 h-2.5 rounded-full mb-1 bg-emerald-300 shadow-[0_0_10px_#34d399]" />
          <div className="flex items-center gap-1.5 font-retro-brand font-black text-sm md:text-base tracking-wider">
            <Check className="w-4 h-4 stroke-[3]" />
            <span>YES</span>
          </div>
          <span className="text-[10px] font-tech text-emerald-200/90 font-bold mt-0.5 tracking-wider">
            {isGuessing ? 'CORRECT [Y]' : '[Y]'}
          </span>
        </button>

        {/* NO Button */}
        <button
          type="button"
          disabled={!isNoActive}
          onClick={handleNo}
          className={`group relative flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all duration-100 ${
            !isNoActive
              ? 'opacity-35 cursor-not-allowed bg-zinc-900 border-zinc-800 text-zinc-600'
              : 'cursor-pointer active:translate-y-1 bg-gradient-to-b from-rose-600 to-rose-800 hover:from-rose-500 hover:to-rose-700 border-rose-400 text-white shadow-[0_6px_0_#881337,0_10px_15px_rgba(0,0,0,0.5)] active:shadow-[0_2px_0_#881337]'
          } ${isGuessing ? 'ring-2 ring-rose-400 ring-offset-2 ring-offset-zinc-950' : ''}`}
          title={isGuessing ? 'Confirm NO: Device was wrong [N]' : "Press 'N' or click to answer NO"}
        >
          <div className="w-2.5 h-2.5 rounded-full mb-1 bg-rose-300 shadow-[0_0_10px_#fb7185]" />
          <div className="flex items-center gap-1.5 font-retro-brand font-black text-sm md:text-base tracking-wider">
            <X className="w-4 h-4 stroke-[3]" />
            <span>NO</span>
          </div>
          <span className="text-[10px] font-tech text-rose-200/90 font-bold mt-0.5 tracking-wider">
            {isGuessing ? 'WRONG [N]' : '[N]'}
          </span>
        </button>

        {/* SOMETIMES Button */}
        <button
          type="button"
          disabled={!isSometimesActive}
          onClick={() => onAnswer('sometimes')}
          className={`group relative flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all duration-100 ${
            !isSometimesActive
              ? 'opacity-30 cursor-not-allowed bg-zinc-900 border-zinc-800 text-zinc-600'
              : 'cursor-pointer active:translate-y-1 bg-gradient-to-b from-amber-600 to-amber-800 hover:from-amber-500 hover:to-amber-700 border-amber-400 text-white shadow-[0_6px_0_#78350f,0_10px_15px_rgba(0,0,0,0.5)] active:shadow-[0_2px_0_#78350f]'
          }`}
          title="Press 'S' or click to answer SOMETIMES / PARTLY"
        >
          <div className="w-2 h-2 rounded-full mb-1 bg-amber-300 shadow-[0_0_8px_#fcd34d]" />
          <div className="flex items-center gap-1 font-retro-brand font-black text-xs md:text-sm tracking-wider">
            <MinusCircle className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>SOMETIMES</span>
          </div>
          <span className="text-[10px] font-tech text-amber-200/80 font-bold mt-0.5 tracking-wider">[S]</span>
        </button>

        {/* UNKNOWN Button */}
        <button
          type="button"
          disabled={!isUnknownActive}
          onClick={() => onAnswer('unknown')}
          className={`group relative flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all duration-100 ${
            !isUnknownActive
              ? 'opacity-30 cursor-not-allowed bg-zinc-900 border-zinc-800 text-zinc-600'
              : 'cursor-pointer active:translate-y-1 bg-gradient-to-b from-sky-600 to-sky-800 hover:from-sky-500 hover:to-sky-700 border-sky-400 text-white shadow-[0_6px_0_#075985,0_10px_15px_rgba(0,0,0,0.5)] active:shadow-[0_2px_0_#075985]'
          }`}
          title="Press 'U' or click to answer UNKNOWN"
        >
          <div className="w-2 h-2 rounded-full mb-1 bg-sky-300 shadow-[0_0_8px_#7dd3fc]" />
          <div className="flex items-center gap-1 font-retro-brand font-black text-xs md:text-sm tracking-wider">
            <HelpCircle className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>UNKNOWN</span>
          </div>
          <span className="text-[10px] font-tech text-sky-200/80 font-bold mt-0.5 tracking-wider">[U]</span>
        </button>
      </div>
      )}

      {/* Auxiliary Tactile Action Controls (Undo & Force Guess) */}
      {!isFinished && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={!canUndo}
            onClick={onUndo}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-tech font-bold uppercase transition-all ${
              canUndo
                ? 'cursor-pointer bg-zinc-800/90 hover:bg-zinc-700 border-zinc-600 text-zinc-200 shadow-sm active:translate-y-0.5'
                : 'opacity-30 cursor-not-allowed bg-zinc-900 border-zinc-800 text-zinc-600'
            }`}
            title="Undo last answer [Z]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>UNDO [Z]</span>
          </button>

          <button
            type="button"
            disabled={!canGuessNow}
            onClick={onGuessNow}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-tech font-bold uppercase transition-all ${
              canGuessNow
                ? 'cursor-pointer bg-purple-950/80 hover:bg-purple-900/90 border-purple-500/80 text-purple-200 shadow-sm active:translate-y-0.5'
                : 'opacity-30 cursor-not-allowed bg-zinc-900 border-zinc-800 text-zinc-600'
            }`}
            title="Force device to make its best guess now [G]"
          >
            <Lightbulb className="w-3.5 h-3.5 text-purple-300" />
            <span>GUESS NOW [G]</span>
          </button>
        </div>
      )}
    </div>
  );
};
