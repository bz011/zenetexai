"use client";

import Link from "next/link";
import { useLang } from "@/lib/LanguageContext";
import type { QuizAttemptDetail } from "@/features/courses/types/course";

interface Props {
  courseSlug: string;
  assessmentId: string;
  attempt: QuizAttemptDetail;
}

export default function AttemptDetailContent({ courseSlug, assessmentId, attempt }: Props) {
  const { t, lang } = useLang();
  const h = t.courses.history;

  return (
    <div className="relative min-h-screen px-6 py-24">
      <div className="container-page relative max-w-2xl">
        <Link
          href={`/courses/${courseSlug}/assessments/${assessmentId}/history`}
          className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-slate-500 hover:text-slate-300 transition-colors"
        >
          ← {h.back_to_history}
        </Link>

        <div className="text-center">
          <p className={`text-3xl font-bold ${attempt.passed ? "text-emerald-400" : "text-red-400"}`}>{attempt.score}%</p>
          <p className="mt-2 text-[13px] text-slate-500">
            {new Date(attempt.completedAt).toLocaleString(lang === "ar" ? "ar" : "en-US")}
          </p>
        </div>

        <div className="mt-8 space-y-5">
          {attempt.questions.map((q, qi) => {
            const explanation = lang === "ar" ? q.result.explanationAr : q.result.explanationEn;
            const answer = q.response;

            return (
              <div key={q.id} className="card p-5">
                <div className="flex items-start gap-2">
                  <span className={q.result.isCorrect ? "text-emerald-400" : "text-red-400"}>
                    {q.result.isCorrect ? "✓" : "✗"}
                  </span>
                  <p className="text-[14px] font-medium text-white">
                    {qi + 1}. {lang === "ar" && q.questionTextAr ? q.questionTextAr : q.questionTextEn}
                  </p>
                </div>

                <div className="mt-3 ms-6 text-[13px] text-slate-400">
                  {(q.interactionType === "standard" || q.interactionType === "graphic_based") && (
                    <p>
                      {h.your_answer}:{" "}
                      {q.options
                        .filter((o) => answer?.selectedOptionIds?.includes(o.id))
                        .map((o) => (lang === "ar" && o.textAr ? o.textAr : o.textEn))
                        .join(", ") || h.no_answer}
                    </p>
                  )}
                  {q.interactionType === "matching" &&
                    (answer?.matchingPairs?.length ? (
                      <ul className="space-y-1">
                        {answer.matchingPairs.map((p, i) => {
                          const left = q.matchingLeft.find((l) => l.id === p.leftItemId);
                          const right = q.matchingRight.find((r) => r.id === p.rightItemId);
                          return (
                            <li key={i}>
                              {left ? (lang === "ar" && left.textAr ? left.textAr : left.textEn) : "?"} →{" "}
                              {right ? (lang === "ar" && right.textAr ? right.textAr : right.textEn) : "?"}
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p>{h.no_answer}</p>
                    ))}
                  {q.interactionType === "drag_and_drop" &&
                    (answer?.dragDropOrder?.length ? (
                      <ol className="list-decimal space-y-1 ps-4">
                        {answer.dragDropOrder.map((itemId) => {
                          const item = q.dragDropItems.find((d) => d.id === itemId);
                          return <li key={itemId}>{item ? (lang === "ar" && item.textAr ? item.textAr : item.textEn) : "?"}</li>;
                        })}
                      </ol>
                    ) : (
                      <p>{h.no_answer}</p>
                    ))}
                  {q.interactionType === "hotspot" && <p>{answer?.hotspotClick ? h.hotspot_answered : h.no_answer}</p>}
                </div>

                {explanation && <p className="mt-2 ms-6 text-[13px] leading-relaxed text-slate-400">{explanation}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
