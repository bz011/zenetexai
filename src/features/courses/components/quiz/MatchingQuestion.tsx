"use client";

import { useLang } from "@/lib/LanguageContext";
import type { QuizQuestion, QuizSubmitAnswer } from "@/features/courses/types/course";

interface Props {
  question: QuizQuestion;
  value?: QuizSubmitAnswer;
  onChange: (partial: Partial<QuizSubmitAnswer>) => void;
}

/** Select-to-pair UI (not drag-and-drop) — fully keyboard/screen-reader accessible without a DnD library. */
export default function MatchingQuestion({ question, value, onChange }: Props) {
  const { lang } = useLang();
  const pairs = value?.matchingPairs ?? [];
  const rightIdByLeft = new Map(pairs.map((p) => [p.leftItemId, p.rightItemId]));

  function setPair(leftItemId: string, rightItemId: string) {
    const next = question.matchingLeft
      .map((l) => ({
        leftItemId: l.id,
        rightItemId: l.id === leftItemId ? rightItemId : rightIdByLeft.get(l.id) ?? "",
      }))
      .filter((p) => p.rightItemId);
    onChange({ matchingPairs: next });
  }

  return (
    <div className="space-y-2.5">
      {question.matchingLeft.map((left) => (
        <div key={left.id} className="flex items-center gap-3 rounded-xl border border-white/[0.08] px-4 py-2.5">
          <span className="flex-1 text-[13px] text-slate-300">{lang === "ar" && left.textAr ? left.textAr : left.textEn}</span>
          <select
            value={rightIdByLeft.get(left.id) ?? ""}
            onChange={(e) => setPair(left.id, e.target.value)}
            className="rounded-lg border border-white/[0.09] bg-white/[0.04] px-3 py-1.5 text-[13px] text-white outline-none"
          >
            <option value="" disabled>
              —
            </option>
            {question.matchingRight.map((right) => (
              <option key={right.id} value={right.id}>
                {lang === "ar" && right.textAr ? right.textAr : right.textEn}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}
