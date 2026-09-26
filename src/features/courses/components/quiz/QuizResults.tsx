"use client";

import type { ReactNode } from "react";
import { useLang } from "@/lib/LanguageContext";
import type { QuizQuestion, QuizSubmitResult } from "@/features/courses/types/course";

interface Props {
  questions: QuizQuestion[];
  result: QuizSubmitResult;
  /** Mode-specific CTAs (retry / continue-learning / view-history / exam-analytics / etc.) — QuizResults itself has no opinion on what comes next. */
  actions: ReactNode;
}

/** Purely presentational — score + per-question correct/incorrect + explanation. No navigation, no mode-specific concepts, reused unmodified across every quiz mode. */
export default function QuizResults({ questions, result, actions }: Props) {
  const { t, lang } = useLang();
  const a = t.courses.assessment;

  return (
    <div className="card p-7">
      <div className="text-center">
        <p className={`text-3xl font-bold ${result.passed ? "text-emerald-400" : "text-red-400"}`}>{result.score}%</p>
        <p className="mt-2 text-[14px] text-slate-400">{result.passed ? a.passed : a.failed}</p>
      </div>

      <div className="mt-8 space-y-5">
        {questions.map((q) => {
          const questionResult = result.results?.find((r) => r.questionId === q.id);
          const explanation = lang === "ar" ? questionResult?.explanationAr : questionResult?.explanationEn;
          return (
            <div key={q.id} className="border-t border-white/[0.06] pt-5">
              <div className="flex items-start gap-2">
                <span className={questionResult?.isCorrect ? "text-emerald-400" : "text-red-400"}>
                  {questionResult?.isCorrect ? "✓" : "✗"}
                </span>
                <p className="text-[14px] font-medium text-white">
                  {lang === "ar" && q.questionTextAr ? q.questionTextAr : q.questionTextEn}
                </p>
              </div>
              {explanation && <p className="mt-2 ms-6 text-[13px] leading-relaxed text-slate-400">{explanation}</p>}
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">{actions}</div>
    </div>
  );
}
