"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useLang } from "@/lib/LanguageContext";
import MarkdownBody from "@/components/MarkdownBody";
import VideoEmbed from "@/features/courses/components/VideoEmbed";
import LearningQuizRunner from "@/features/courses/components/quiz/LearningQuizRunner";
import LessonNotes from "@/features/courses/components/LessonNotes";
import LessonResourceList from "@/features/courses/components/LessonResourceList";
import LessonNav from "@/features/courses/components/LessonNav";
import { markLessonComplete } from "@/features/courses/services/progressService";
import { useActiveStudyTracker } from "@/features/courses/hooks/useActiveStudyTracker";
import type { Lesson, LearningAssessment, QuizQuestion } from "@/features/courses/types/course";

interface Props {
  courseSlug: string;
  lesson: Lesson;
  completed: boolean;
  checkpoint: LearningAssessment | null;
  checkpointQuestions: QuizQuestion[];
  previousLesson: { id: string; title_en: string; title_ar: string | null } | null;
  nextLesson: { id: string; title_en: string; title_ar: string | null } | null;
  resources: { id: string; fileName: string; fileUrl: string }[];
  initialNoteText: string;
}

export default function LessonDetailContent({
  courseSlug,
  lesson,
  completed,
  checkpoint,
  checkpointQuestions,
  previousLesson,
  nextLesson,
  resources,
  initialNoteText,
}: Props) {
  const { t, lang } = useLang();
  const l = t.courses.lesson;

  const [isCompleted, setIsCompleted] = useState(completed);
  const [isPending, startTransition] = useTransition();
  const { markActive } = useActiveStudyTracker();

  function handleMarkComplete() {
    startTransition(async () => {
      const res = await markLessonComplete(lesson.id, courseSlug);
      if (res.success) setIsCompleted(true);
    });
  }

  const content = lang === "ar" && lesson.content_ar ? lesson.content_ar : lesson.content_en;

  return (
    <div className="relative min-h-screen px-6 py-24">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[350px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/[0.08] blur-[100px]" />

      <div className="container-page relative max-w-2xl">
        <Link
          href={`/courses/${courseSlug}`}
          className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-slate-500 hover:text-slate-300 transition-colors"
        >
          ← {l.back_to_course}
        </Link>

        <h1 className="text-2xl font-bold text-white md:text-3xl">
          {lang === "ar" && lesson.title_ar ? lesson.title_ar : lesson.title_en}
        </h1>

        <div className="mt-6">
          <VideoEmbed
            provider={lesson.video_provider}
            url={lesson.video_url}
            placeholderLabel={l.video_placeholder}
            onActivity={markActive}
          />
        </div>

        {content && (
          <div className="mt-8">
            <MarkdownBody content={content} />
          </div>
        )}

        <LessonResourceList resources={resources} />

        <button
          onClick={handleMarkComplete}
          disabled={isCompleted || isPending}
          className="btn-primary mt-8 px-5 py-2.5 text-[13px] disabled:opacity-50"
        >
          {isCompleted ? l.completed : isPending ? l.marking : l.mark_complete}
        </button>

        <LessonNav courseSlug={courseSlug} previous={previousLesson} next={nextLesson} />

        <div className="mt-6">
          <LessonNotes lessonId={lesson.id} initialNoteText={initialNoteText} />
        </div>

        {checkpoint && checkpointQuestions.length > 0 && (
          <div className="mt-12">
            <span className="label">{l.checkpoint_label}</span>
            <h2 className="mt-2 text-lg font-semibold text-white">
              {lang === "ar" && checkpoint.title_ar ? checkpoint.title_ar : checkpoint.title_en}
            </h2>
            <div className="mt-4">
              <LearningQuizRunner assessmentId={checkpoint.id} questions={checkpointQuestions} courseSlug={courseSlug} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
