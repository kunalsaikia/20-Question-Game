import React from 'react';

interface TopBarProps {
  onOpenHowItWorks: () => void;
  onOpenInspector: () => void;
  onNewGame: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onOpenHowItWorks,
  onOpenInspector,
  onNewGame,
}) => {
  return (
    <header className="w-full flex items-center justify-between gap-8 px-6 py-4 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40">
      {/* Zone 1: Brand wordmark */}
      <a href="/" className="text-base sm:text-lg font-bold tracking-tight text-white font-retro-brand whitespace-nowrap shrink-0 flex items-center gap-2">
        <span>20Q 64-BIT</span>
      </a>

      {/* Zone 2: Clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-400">
        <button
          type="button"
          onClick={onOpenHowItWorks}
          className="hover:text-zinc-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          Algorithm & Rules
        </button>
        <button
          type="button"
          onClick={onOpenInspector}
          className="hover:text-zinc-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          Knowledge EEPROM
        </button>
        <a
          href="#shortcuts"
          className="hover:text-zinc-100 transition-colors whitespace-nowrap shrink-0"
        >
          Key Controls
        </a>
      </nav>

      {/* Zone 3: 1 Primary Action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={onNewGame}
          className="px-4 py-2 text-xs font-semibold text-zinc-950 bg-emerald-400 rounded-lg hover:bg-emerald-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-sm active:scale-95"
        >
          Start New Game
        </button>
      </div>
    </header>
  );
};
