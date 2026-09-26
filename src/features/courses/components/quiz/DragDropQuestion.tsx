"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/lib/LanguageContext";
import type { QuizQuestion, QuizSubmitAnswer } from "@/features/courses/types/course";

interface Props {
  question: QuizQuestion;
  value?: QuizSubmitAnswer;
  onChange: (partial: Partial<QuizSubmitAnswer>) => void;
}

/** Up/down reordering rather than native HTML5 drag-and-drop — more reliable across browsers/devices and keyboard-accessible. */
export default function DragDropQuestion({ question, value, onChange }: Props) {
  const { lang } = useLang();
  const [order, setOrder] = useState<string[]>(value?.dragDropOrder ?? question.dragDropItems.map((i) => i.id));

  useEffect(() => {
    onChange({ dragDropOrder: order });
    // Only on mount — records the initial (unordered) arrangement as the starting answer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    [next[index], next[target]] = [next[target], next[index]];
    setOrder(next);
    onChange({ dragDropOrder: next });
  }

  const itemById = new Map(question.dragDropItems.map((i) => [i.id, i]));

  return (
    <div className="space-y-2">
      {order.map((itemId, i) => {
        const item = itemById.get(itemId);
        if (!item) return null;
        return (
          <div key={itemId} className="flex items-center gap-3 rounded-xl border border-white/[0.08] px-4 py-2.5">
            <span className="w-5 text-center text-[12px] text-slate-500">{i + 1}</span>
            <span className="flex-1 text-[13px] text-slate-300">{lang === "ar" && item.textAr ? item.textAr : item.textEn}</span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                className="rounded-lg px-2 py-1 text-[12px] text-slate-400 hover:bg-white/[0.06] disabled:opacity-30"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === order.length - 1}
                className="rounded-lg px-2 py-1 text-[12px] text-slate-400 hover:bg-white/[0.06] disabled:opacity-30"
              >
                ↓
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
