"use client";

import { useLang } from "@/lib/LanguageContext";

interface Props {
  total: number;
  currentIndex: number;
  answeredIndexes: Set<number>;
  flaggedIndexes: Set<number>;
  onJump: (index: number) => void;
}

export default function PracticeNavigator({ total, currentIndex, answeredIndexes, flaggedIndexes, onJump }: Props) {
  const { t } = useLang();
  const nv = t.assessment.navigator;

  return (
    <div className="card p-4">
      <p className="label mb-3">{nv.questions}</p>
      <div className="grid grid-cols-8 gap-1.5 sm:grid-cols-10">
        {Array.from({ length: total }, (_, i) => {
          const isCurrent = i === currentIndex;
          const isAnswered = answeredIndexes.has(i);
          const isFlagged = flaggedIndexes.has(i);
          return (
            <button
              key={i}
              onClick={() => onJump(i)}
              className={`relative flex h-8 w-8 items-center justify-center rounded-lg text-[11px] font-semibold transition-colors ${
                isCurrent
                  ? "bg-indigo-500 text-[#fff]"
                  : isAnswered
                    ? "bg-emerald-500/[0.18] text-emerald-300"
                    : "bg-white/[0.06] text-slate-400 hover:bg-white/[0.1]"
              }`}
            >
              {i + 1}
              {isFlagged && <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-amber-400" />}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/[0.5]" /> {nv.answered}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-white/[0.15]" /> {nv.unanswered}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> {nv.flagged}
        </span>
      </div>
    </div>
  );
}
