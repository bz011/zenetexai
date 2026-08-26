"use client";

import Link from "next/link";
import { useLang } from "@/lib/LanguageContext";
import type { LearningAssessment, QuizAttemptSummary } from "@/features/courses/types/course";

interface Props {
  courseSlug: string;
  assessment: LearningAssessment;
  attempts: QuizAttemptSummary[];
}

export default function HistoryListContent({ courseSlug, assessment, attempts }: Props) {
  const { t, lang } = useLang();
  const h = t.courses.history;

  return (
    <div className="relative min-h-screen px-6 py-24">
      <div className="container-page relative max-w-2xl">
        <Link
          href={`/courses/${courseSlug}/assessments/${assessment.id}`}
          className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-slate-500 hover:text-slate-300 transition-colors"
        >
          ← {h.back_to_quiz}
        </Link>

        <h1 className="text-2xl font-bold text-white">
          {h.title}: {lang === "ar" && assessment.title_ar ? assessment.title_ar : assessment.title_en}
        </h1>

        {attempts.length === 0 ? (
          <p className="mt-8 text-[14px] text-slate-500">{h.empty}</p>
        ) : (
          <div className="mt-8 space-y-2">
            {attempts.map((attempt) => (
              <Link
                key={attempt.id}
                href={`/courses/${courseSlug}/assessments/${assessment.id}/history/${attempt.id}`}
                className="card flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-white/[0.04]"
              >
                <span className="text-[13px] text-slate-400">
                  {new Date(attempt.completedAt).toLocaleString(lang === "ar" ? "ar" : "en-US")}
                </span>
                <span className={`text-[14px] font-semibold ${attempt.passed ? "text-emerald-400" : "text-red-400"}`}>
                  {attempt.score}%
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
