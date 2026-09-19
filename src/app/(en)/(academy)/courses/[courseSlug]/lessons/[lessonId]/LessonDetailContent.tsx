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
import CourseCurriculumSidebar, { type CurriculumModule } from "@/features/courses/components/CourseCurriculumSidebar";
import { markLessonComplete } from "@/features/courses/services/progressService";
import { useActiveStudyTracker } from "@/features/courses/hooks/useActiveStudyTracker";
import type { Lesson, LearningAssessment, QuizQuestion } from "@/features/courses/types/course";

interface Props {
  courseSlug: string;
  courseTitleEn: string;
  courseTitleAr: string | null;
  lesson: Lesson;
  completed: boolean;
  checkpoint: LearningAssessment | null;
  checkpointQuestions: QuizQuestion[];
  previousLesson: { id: string; title_en: string; title_ar: string | null } | null;
  nextLesson: { id: string; title_en: string; title_ar: string | null } | null;
  resources: { id: string; fileName: string; fileUrl: string }[];
  initialNoteText: string;
  curriculum: CurriculumModule[];
  totalLessons: number;
  completedLessons: number;
}

export default function LessonDetailContent({
  courseSlug,
  courseTitleEn,
  courseTitleAr,
  lesson,
  completed,
  checkpoint,
  checkpointQuestions,
  previousLesson,
  nextLesson,
  resources,
  initialNoteText,
  curriculum,
  totalLessons,
  completedLessons,
}: Props) {
  const { t, lang } = useLang();
  const l = t.courses.lesson;
  const w = t.courses.workspace;

  const [isCompleted, setIsCompleted] = useState(completed);
  const [isPending, startTransition] = useTransition();
  const [showCurriculum, setShowCurriculum] = useState(false);
  const { markActive } = useActiveStudyTracker();

  function handleMarkComplete() {
    startTransition(async () => {
      const res = await markLessonComplete(lesson.id, courseSlug);
      if (res.success) setIsCompleted(true);
    });
  }

  const content = lang === "ar" && lesson.content_ar ? lesson.content_ar : lesson.content_en;
  const courseTitle = lang === "ar" && courseTitleAr ? courseTitleAr : courseTitleEn;
  const effectiveCompleted = isCompleted ? Math.max(completedLessons, 1) : completedLessons;
  const progressLabel = w.progress_label.replace("{completed}", String(effectiveCompleted)).replace("{total}", String(totalLessons));

  const sidebar = (
    <CourseCurriculumSidebar
      courseSlug={courseSlug}
      courseTitleEn={courseTitleEn}
      courseTitleAr={courseTitleAr}
      modules={curriculum}
      totalLessons={totalLessons}
      completedLessons={effectiveCompleted}
      currentLessonId={lesson.id}
    />
  );

  return (
    <div dir={lang === "ar" ? "rtl" : "ltr"} className="min-h-screen pb-20">
      {/* Compact in-page workspace bar - the global AcademyHeader above this
          already carries branding + EN/AR + Dashboard, so this stays slim:
          just where-am-I (course + back link) and progress. */}
      <div className="sticky top-[57px] z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="container-page flex items-center justify-between gap-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href={`/courses/${courseSlug}`}
              className="shrink-0 text-[13px] text-slate-500 transition-colors hover:text-slate-700"
            >
              ← {l.back_to_course}
            </Link>
            <span className="hidden shrink-0 text-slate-300 sm:inline">/</span>
            <span className="truncate text-[13px] font-medium text-slate-700 sm:inline hidden">{courseTitle}</span>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <div className="hidden items-center gap-2 sm:flex">
              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-[width]"
                  style={{ width: `${totalLessons > 0 ? Math.round((effectiveCompleted / totalLessons) * 100) : 0}%` }}
                />
              </div>
              <span className="whitespace-nowrap text-[12px] text-slate-500">{progressLabel}</span>
            </div>
            <button
              onClick={() => setShowCurriculum((v) => !v)}
              className="btn-ghost whitespace-nowrap px-3 py-1.5 text-[12px] lg:hidden"
            >
              {showCurriculum ? w.close_curriculum : w.view_curriculum}
            </button>
          </div>
        </div>
      </div>

      <div className="container-page pt-6">
        {/* Mobile/tablet curriculum drawer - collapsed by default, never
            squeezes the player; only the desktop grid column below is
            always visible. */}
        <div className={`${showCurriculum ? "block" : "hidden"} mb-6 lg:hidden`}>{sidebar}</div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px]">
          {/* Main learning column */}
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h1 className="text-xl font-bold text-slate-900 md:text-2xl">
                {lang === "ar" && lesson.title_ar ? lesson.title_ar : lesson.title_en}
              </h1>
              {lesson.duration_minutes != null && (
                <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[12px] text-slate-500">
                  {w.duration_minutes_label.replace("{n}", String(lesson.duration_minutes))}
                </span>
              )}
            </div>

            <div className="mt-4">
              <VideoEmbed
                provider={lesson.video_provider}
                url={lesson.video_url}
                placeholderLabel={l.video_placeholder}
                onActivity={markActive}
              />
            </div>

            {content && (
              <div className="card mt-6 p-6">
                <MarkdownBody content={content} />
              </div>
            )}

            <LessonResourceList resources={resources} />

            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                onClick={handleMarkComplete}
                disabled={isCompleted || isPending}
                className="btn-primary px-5 py-2.5 text-[13px] disabled:opacity-50"
              >
                {isCompleted ? l.completed : isPending ? l.marking : l.mark_complete}
              </button>
            </div>

            <LessonNav courseSlug={courseSlug} previous={previousLesson} next={nextLesson} />

            <div className="mt-6">
              <LessonNotes lessonId={lesson.id} initialNoteText={initialNoteText} />
            </div>

            {checkpoint && checkpointQuestions.length > 0 && (
              <div className="card mt-8 p-6">
                <span className="label">{l.checkpoint_label}</span>
                <h2 className="mt-2 text-lg font-semibold text-slate-900">
                  {lang === "ar" && checkpoint.title_ar ? checkpoint.title_ar : checkpoint.title_en}
                </h2>
                <div className="mt-4">
                  <LearningQuizRunner assessmentId={checkpoint.id} questions={checkpointQuestions} courseSlug={courseSlug} />
                </div>
              </div>
            )}
          </div>

          {/* Desktop curriculum sidebar - independently scrollable, sticky
              under the workspace bar. Hidden below lg (see mobile drawer above). */}
          <aside className="hidden lg:block">
            <div className="sticky top-[113px]">{sidebar}</div>
          </aside>
        </div>
      </div>
    </div>
  );
}
