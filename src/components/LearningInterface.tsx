import React, { useState } from 'react';
import { Cpu, ArrowRight, X, AlertCircle } from 'lucide-react';

interface LearningInterfaceProps {
  wrongGuess: string;
  onCommitLearning: (correctName: string, newQText: string) => void;
  onCancel: () => void;
}

export const LearningInterface: React.FC<LearningInterfaceProps> = ({
  wrongGuess,
  onCommitLearning,
  onCancel,
}) => {
  const [correctName, setCorrectName] = useState('');
  const [newQText, setNewQText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctName.trim()) {
      setError('Please enter what object you were thinking of.');
      return;
    }
    if (!newQText.trim()) {
      setError(`Please enter a distinguishing question that separates ${correctName.trim()} from ${wrongGuess}.`);
      return;
    }
    setError(null);
    onCommitLearning(correctName.trim(), newQText.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-zinc-900 border-2 border-emerald-500/60 rounded-3xl p-6 md:p-8 shadow-[0_0_50px_rgba(16,185,129,0.2)] text-zinc-100 font-sans">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-retro-brand text-sm md:text-base font-bold tracking-wider text-emerald-300">
                TEACH 64-BIT NEURAL CORE
              </h2>
              <p className="text-xs text-zinc-400 font-tech">
                FAILED ON: <span className="text-rose-400 uppercase font-bold">{wrongGuess}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Learning Explanation */}
        <div className="my-4 p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs text-zinc-300 space-y-1 font-tech">
          <p className="text-emerald-400 font-bold">» DARN! I GIVE UP. EXPAND MY KNOWLEDGE BASE!</p>
          <p className="text-zinc-400">
            Teach me what you were thinking of, and give me a question that separates it from my wrong guess.
            This will permanently update my EEPROM memory.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-tech font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
              1. What were you thinking of?
            </label>
            <input
              type="text"
              value={correctName}
              onChange={(e) => setCorrectName(e.target.value)}
              placeholder="e.g. Penguin, Laptop, Pineapple, Guitar"
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-zinc-100 placeholder:text-zinc-600 text-sm font-sans outline-none"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-tech font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
              2. Question where answer is <span className="text-emerald-400 font-bold">YES</span> for{' '}
              <span className="text-white underline">{correctName || 'your object'}</span> and{' '}
              <span className="text-rose-400 font-bold">NO</span> for{' '}
              <span className="text-rose-300">{wrongGuess}</span>:
            </label>
            <input
              type="text"
              value={newQText}
              onChange={(e) => setNewQText(e.target.value)}
              placeholder={`e.g. Does it live in Antarctica? / Does it have strings?`}
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-zinc-100 placeholder:text-zinc-600 text-sm font-sans outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-xl text-xs font-tech font-bold uppercase text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-tech text-xs font-bold uppercase tracking-wider shadow-lg shadow-emerald-950 transition-all active:scale-95 cursor-pointer"
            >
              <span>PROGRAM EEPROM</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
