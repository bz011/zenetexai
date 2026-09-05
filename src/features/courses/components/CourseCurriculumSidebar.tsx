"use client";

import Link from "next/link";
import { useLang } from "@/lib/LanguageContext";

export interface CurriculumLesson {
  id: string;
  titleEn: string;
  titleAr: string | null;
  durationMinutes: number | null;
  completed: boolean;
}

export interface CurriculumModule {
  id: string;
  titleEn: string;
  titleAr: string | null;
  lessons: CurriculumLesson[];
}

interface Props {
  courseSlug: string;
  courseTitleEn: string;
  courseTitleAr: string | null;
  modules: CurriculumModule[];
  totalLessons: number;
  completedLessons: number;
  currentLessonId: string;
}

/**
 * The course curriculum nav - shared markup for both the always-visible
 * desktop sidebar and the collapsible mobile drawer (see
 * LessonDetailContent.tsx, which toggles this panel's visibility on small
 * screens via a wrapping className rather than rendering two copies).
 *
 * Deliberately has no "locked lesson" state: this platform doesn't have
 * progressive/sequential lesson unlocking - every lesson reaching this
 * component belongs to a course the viewer is already entitled to (gated
 * one level up, in page.tsx), so every lesson listed here is genuinely
 * open. Inventing lock icons for a state that doesn't exist in the data
 * model would be misleading.
 */
export default function CourseCurriculumSidebar({
  courseSlug,
  courseTitleEn,
  courseTitleAr,
  modules,
  totalLessons,
  completedLessons,
  currentLessonId,
}: Props) {
  const { t, lang } = useLang();
  const w = t.courses.workspace;

  const courseTitle = lang === "ar" && courseTitleAr ? courseTitleAr : courseTitleEn;
  const progressPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const progressLabel = w.progress_label.replace("{completed}", String(completedLessons)).replace("{total}", String(totalLessons));

  return (
    <div className="card flex max-h-[calc(100vh-7rem)] flex-col overflow-hidden p-0">
      <div className="border-b border-white/[0.06] p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{courseTitle}</p>
        <p className="mt-2 text-[15px] font-semibold text-white">{w.curriculum_heading}</p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
          <div className="h-full rounded-full bg-indigo-500 transition-[width]" style={{ width: `${progressPct}%` }} />
        </div>
        <p className="mt-1.5 text-[12px] text-slate-500">{progressLabel}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {modules.map((mod, mi) => {
          const modTitle = lang === "ar" && mod.titleAr ? mod.titleAr : mod.titleEn;
          return (
            <div key={mod.id} className="mb-3 last:mb-0">
              <p className="px-2 py-1.5 text-[12px] font-semibold text-slate-400">
                {mi + 1}. {modTitle}
              </p>
              <div className="space-y-0.5">
                {mod.lessons.map((lesson) => {
                  const lessonTitle = lang === "ar" && lesson.titleAr ? lesson.titleAr : lesson.titleEn;
                  const isCurrent = lesson.id === currentLessonId;
                  return (
                    <Link
                      key={lesson.id}
                      href={`/courses/${courseSlug}/lessons/${lesson.id}`}
                      aria-current={isCurrent ? "page" : undefined}
                      className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors ${
                        isCurrent
                          ? "bg-indigo-500/[0.12] font-medium text-indigo-400"
                          : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
                      }`}
                    >
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] ${
                          lesson.completed ? "bg-emerald-500/[0.15] text-emerald-400" : "border border-white/[0.14] text-transparent"
                        }`}
                      >
                        {lesson.completed ? "✓" : ""}
                      </span>
                      <span className="flex-1 truncate">{lessonTitle}</span>
                      {lesson.durationMinutes != null && (
                        <span className="shrink-0 text-[11px] text-slate-600">
                          {w.duration_minutes_label.replace("{n}", String(lesson.durationMinutes))}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
