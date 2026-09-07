"use client";

import { useLang } from "@/lib/LanguageContext";
import { tf } from "@/lib/translations";

/**
 * Question navigator, scoped to ONLY the current section (Sprint 9.1 item
 * 4) - a completed/locked section's questions, and any not-yet-reached
 * future section's questions, are never listed here at all, not merely
 * disabled. States are conveyed with icons/text as well as color (item
 * 12 - accessible, non-color-only states): a checkmark for answered, a
 * flag glyph for flagged, plain number otherwise.
 */

interface Props {
  sectionNumber: number;
  /** This section's question indexes into the full exam array, in display order. */
  sectionQuestionIndexes: number[];
  currentIndex: number;
  answeredIndexes: Set<number>;
  flaggedIndexes: Set<number>;
  onJump: (index: number) => void;
}

export default function ExamNavigator({ sectionNumber, sectionQuestionIndexes, currentIndex, answeredIndexes, flaggedIndexes, onJump }: Props) {
  const { t } = useLang();
  const nv = t.assessment.navigator;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">{tf(nv.sectionQuestions, { n: sectionNumber })}</p>
      <div className="grid grid-cols-8 gap-1.5 sm:grid-cols-10">
        {sectionQuestionIndexes.map((i) => {
          const isCurrent = i === currentIndex;
          const isAnswered = answeredIndexes.has(i);
          const isFlagged = flaggedIndexes.has(i);
          const positionInSection = i - sectionQuestionIndexes[0] + 1;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onJump(i)}
              aria-current={isCurrent ? "true" : undefined}
              aria-label={`Question ${positionInSection} of this section${isAnswered ? ", answered" : ", unanswered"}${isFlagged ? ", flagged" : ""}`}
              className={`relative flex h-8 w-8 items-center justify-center rounded-lg border text-[11px] font-semibold transition-colors ${
                isCurrent
                  ? "border-indigo-600 bg-indigo-600 text-[#fff]"
                  : isAnswered
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300"
                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              {isAnswered && !isCurrent ? "✓" : positionInSection}
              {isFlagged && (
                <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-400 text-[8px] leading-none text-white">
                  ⚑
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-3 text-[11px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="flex h-4 w-4 items-center justify-center rounded border border-emerald-200 bg-emerald-50 text-[9px] text-emerald-700">✓</span>{" "}
          {nv.answered}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-4 w-4 rounded border border-slate-200 bg-white" /> {nv.unanswered}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[8px] text-white">⚑</span> {nv.flagged}
        </span>
      </div>
      <p className="mt-3 text-[11px] text-slate-400">{nv.sealedNote}</p>
    </div>
  );
}
