import React from 'react';
import { X, Code2, Cpu, Sparkles, BookOpen } from 'lucide-react';

interface HowItWorksModalProps {
  onClose: () => void;
}

export const HowItWorksModal: React.FC<HowItWorksModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in font-sans">
      <div className="relative w-full max-w-2xl max-h-[88vh] flex flex-col bg-zinc-900 border border-zinc-700/80 rounded-3xl shadow-2xl overflow-hidden text-zinc-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-retro-brand text-sm md:text-base font-bold tracking-wider text-emerald-300">
                HOW THE 64-BIT ALGORITHM WORKS
              </h2>
              <p className="text-xs text-zinc-400 font-tech">
                Exact parity with Python TwentyQuestions Engine
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-zinc-300 leading-relaxed">
          {/* Section 1: Core Scoring Math */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span>1. Difference-Penalty Scoring Vector</span>
            </div>
            <p>
              Every object in memory starts at <strong className="text-emerald-400">0 penalty points</strong>.
              For each question asked, your answer is assigned a float weight:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-tech">
              <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-center">
                <div className="text-emerald-400 font-bold text-sm">YES</div>
                <div className="text-zinc-400 text-[11px]">Weight = 1.0</div>
              </div>
              <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-center">
                <div className="text-rose-400 font-bold text-sm">NO</div>
                <div className="text-zinc-400 text-[11px]">Weight = 0.0</div>
              </div>
              <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-center">
                <div className="text-amber-400 font-bold text-sm">SOMETIMES</div>
                <div className="text-zinc-400 text-[11px]">Weight = 0.5</div>
              </div>
              <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-center">
                <div className="text-sky-400 font-bold text-sm">UNKNOWN</div>
                <div className="text-zinc-400 text-[11px]">Skip penalty</div>
              </div>
            </div>
            <p className="pt-2">
              The engine penalizes each candidate by the absolute difference between your answer and the object's attribute:
            </p>
            <pre className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-emerald-400 text-[11px] overflow-x-auto">
              self.scores[obj['name']] -= abs(weight - obj_val)
            </pre>
            <p className="text-zinc-400">
              Objects that closely match your answers stay closest to 0.0, while conflicting items accumulate negative score penalties!
            </p>
          </div>

          {/* Section 2: Guessing */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>2. Deductive Inference & Guessing</span>
            </div>
            <p>
              After 20 questions (or when you trigger <strong className="text-purple-300">GUESS NOW</strong>), the device chooses the object with the highest score:
            </p>
            <pre className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-purple-300 text-[11px] overflow-x-auto">
              guess = max(self.scores, key=self.scores.get)
            </pre>
          </div>

          {/* Section 3: Machine Learning & Memory Expansion */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
              <Code2 className="w-4 h-4 text-sky-400" />
              <span>3. Self-Learning Knowledge Base</span>
            </div>
            <p>
              If the device guesses wrong, it prompts you for:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-zinc-400">
              <li>The correct name of what you were thinking of</li>
              <li>A new distinguishing question that is <strong className="text-emerald-400">YES</strong> for your object, but <strong className="text-rose-400">NO</strong> for the device's wrong guess</li>
            </ol>
            <p className="pt-1">
              It automatically registers the new question, sets the new item to 1.0, updates the wrong guess to 0.0, sets default 0.5 attributes for others, and persists to local EEPROM!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-800 bg-zinc-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
