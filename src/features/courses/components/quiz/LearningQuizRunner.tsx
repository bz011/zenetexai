"use client";

import Link from "next/link";
import { useLang } from "@/lib/LanguageContext";
import QuizRunner from "./QuizRunner";
import type { QuizQuestion, QuizSubmitAnswer, QuizSubmitResult } from "@/features/courses/types/course";

interface Props {
  assessmentId: string;
  questions: QuizQuestion[];
  courseSlug: string;
}

/**
 * The learning-module-specific wrapper around the generic QuizRunner engine
 * — supplies the /api/assessments/[id]/submit endpoint and the
 * course/history navigation, so QuizRunner itself stays free of any
 * course-specific concept. A future PracticeModeRunner/MockExamRunner would
 * be an equally thin wrapper: same QuizRunner, same six question
 * components, same quizGradingService — only the submit endpoint and the
 * post-result CTAs differ.
 */
export default function LearningQuizRunner({ assessmentId, questions, courseSlug }: Props) {
  const { t } = useLang();
  const a = t.courses.assessment;

  async function onSubmit(answers: QuizSubmitAnswer[]): Promise<QuizSubmitResult> {
    const res = await fetch(`/api/assessments/${assessmentId}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    });
    return res.json();
  }

  return (
    <QuizRunner
      questions={questions}
      onSubmit={onSubmit}
      renderActions={({ onRetry }) => (
        <>
          <button onClick={onRetry} className="btn-ghost px-5 py-2.5 text-[13px]">
            {a.retry}
          </button>
          <Link href={`/courses/${courseSlug}`} className="btn-primary px-5 py-2.5 text-[13px]">
            {a.continue_learning}
          </Link>
          <Link href={`/courses/${courseSlug}/assessments/${assessmentId}/history`} className="btn-ghost px-5 py-2.5 text-[13px]">
            {a.view_history}
          </Link>
        </>
      )}
    />
  );
}
