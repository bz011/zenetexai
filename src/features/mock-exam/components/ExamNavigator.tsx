"use client";

/**
 * Question navigator, grouped by section. States are conveyed with icons/
 * text as well as color (item 12 - accessible, non-color-only states):
 * a checkmark for answered, a flag glyph for flagged, a lock glyph for a
 * section sealed by sections_locked (post-break review restriction), plain
 * number otherwise. Locked-section buttons are disabled, not merely styled.
 */

interface Props {
  total: number;
  currentIndex: number;
  answeredIndexes: Set<number>;
  flaggedIndexes: Set<number>;
  sectionNumbers: number[];
  sectionsLocked: number[];
  onJump: (index: number) => void;
}

export default function ExamNavigator({ total, currentIndex, answeredIndexes, flaggedIndexes, sectionNumbers, sectionsLocked, onJump }: Props) {
  const sections = Array.from(new Set(sectionNumbers)).sort((a, b) => a - b);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Questions</p>
      <div className="space-y-4">
        {sections.map((sectionNumber) => {
          const isLocked = sectionsLocked.includes(sectionNumber);
          const indexes = sectionNumbers.reduce<number[]>((acc, s, i) => (s === sectionNumber ? [...acc, i] : acc), []);
          return (
            <div key={sectionNumber}>
              <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                Section {sectionNumber}
                {isLocked && (
                  <span aria-label="Section locked" title="Section locked - review period ended">
                    🔒
                  </span>
                )}
              </p>
              <div className="grid grid-cols-8 gap-1.5 sm:grid-cols-10">
                {indexes.map((i) => {
                  const isCurrent = i === currentIndex;
                  const isAnswered = answeredIndexes.has(i);
                  const isFlagged = flaggedIndexes.has(i);
                  const disabled = isLocked && !isCurrent;
                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={disabled}
                      onClick={() => onJump(i)}
                      aria-current={isCurrent ? "true" : undefined}
                      aria-label={`Question ${i + 1}${isAnswered ? ", answered" : ", unanswered"}${isFlagged ? ", flagged" : ""}${disabled ? ", locked" : ""}`}
                      className={`relative flex h-8 w-8 items-center justify-center rounded-lg border text-[11px] font-semibold transition-colors ${
                        isCurrent
                          ? "border-indigo-600 bg-indigo-600 text-white"
                          : disabled
                            ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-300"
                            : isAnswered
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300"
                              : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {isAnswered && !isCurrent ? "✓" : i + 1}
                      {isFlagged && (
                        <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-400 text-[8px] leading-none text-white">
                          ⚑
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-3 text-[11px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="flex h-4 w-4 items-center justify-center rounded border border-emerald-200 bg-emerald-50 text-[9px] text-emerald-700">✓</span>{" "}
          Answered
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-4 w-4 rounded border border-slate-200 bg-white" /> Unanswered
        </span>
        <span className="flex items-center gap-1.5">
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[8px] text-white">⚑</span> Flagged
        </span>
        <span className="flex items-center gap-1.5">🔒 Section locked</span>
      </div>
    </div>
  );
}
