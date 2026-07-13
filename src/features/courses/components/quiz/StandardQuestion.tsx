"use client";

import { useLang } from "@/lib/LanguageContext";
import type { QuizQuestion, QuizSubmitAnswer } from "@/features/courses/types/course";

interface Props {
  question: QuizQuestion;
  value?: QuizSubmitAnswer;
  onChange: (partial: Partial<QuizSubmitAnswer>) => void;
}

/** Handles both "standard" and "graphic_based" interaction types, and both single/multiple_response answer types. */
export default function StandardQuestion({ question, value, onChange }: Props) {
  const { lang } = useLang();
  const selected = new Set(value?.selectedOptionIds ?? []);
  const isMultiple = question.answerType === "multiple_response";

  function toggle(optionId: string) {
    if (isMultiple) {
      const next = new Set(selected);
      if (next.has(optionId)) next.delete(optionId);
      else next.add(optionId);
      onChange({ selectedOptionIds: Array.from(next) });
    } else {
      onChange({ selectedOptionIds: [optionId] });
    }
  }

  return (
    <div>
      {question.images.length > 0 && (
        <div className="mb-3 space-y-2">
          {question.images.map((img, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={img.imagePath}
              alt={(lang === "ar" && img.altAr) || img.altEn || ""}
              className="max-h-80 w-full rounded-xl border border-white/[0.08] object-contain"
            />
          ))}
        </div>
      )}
      <div className="space-y-2">
        {question.options.map((opt) => (
          <label
            key={opt.id}
            className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-2.5 text-[13px] transition-colors ${
              selected.has(opt.id)
                ? "border-indigo-500/60 bg-indigo-500/[0.08] text-white"
                : "border-white/[0.08] text-slate-300 hover:bg-white/[0.03]"
            }`}
          >
            <input
              type={isMultiple ? "checkbox" : "radio"}
              name={question.id}
              checked={selected.has(opt.id)}
              onChange={() => toggle(opt.id)}
              className="accent-indigo-500"
            />
            {lang === "ar" && opt.textAr ? opt.textAr : opt.textEn}
          </label>
        ))}
      </div>
    </div>
  );
}
