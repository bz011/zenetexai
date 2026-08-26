"use client";

import Link from "next/link";
import { useLang } from "@/lib/LanguageContext";
import LearningQuizRunner from "@/features/courses/components/quiz/LearningQuizRunner";
import { useActiveStudyTracker } from "@/features/courses/hooks/useActiveStudyTracker";
import type { LearningAssessment, QuizQuestion } from "@/features/courses/types/course";

interface Props {
  courseSlug: string;
  assessment: LearningAssessment;
  questions: QuizQuestion[];
}

export default function ModuleAssessmentContent({ courseSlug, assessment, questions }: Props) {
  const { t, lang } = useLang();
  const l = t.courses.lesson;
  // Mounts the same activity tracker as the lesson page - quiz interaction
  // (clicking options, dragging reorder buttons, typing in matching
  // selects) is itself mouse/keyboard activity, so no extra wiring needed.
  useActiveStudyTracker();

  return (
    <div className="relative min-h-screen px-6 py-24">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[350px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/[0.08] blur-[100px]" />

      <div className="container-page relative max-w-2xl">
        <Link
          href={`/courses/${courseSlug}`}
          className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-slate-500 hover:text-slate-300 transition-colors"
        >
          ← {l.back_to_course}
        </Link>

        <h1 className="text-2xl font-bold text-white md:text-3xl">
          {lang === "ar" && assessment.title_ar ? assessment.title_ar : assessment.title_en}
        </h1>

        <div className="mt-8">
          <LearningQuizRunner assessmentId={assessment.id} questions={questions} courseSlug={courseSlug} />
        </div>
      </div>
    </div>
  );
}
