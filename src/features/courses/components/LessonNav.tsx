"use client";

import Link from "next/link";
import { useLang } from "@/lib/LanguageContext";
import type { NavStep } from "@/features/courses/utils/curriculumNav";

interface Props {
  courseSlug: string;
  /** Previous / next step across the whole published curriculum (see curriculumNav.ts). */
  previous: NavStep | null;
  next: NavStep | null;
  /** This lesson is the last step of the course. */
  isCourseEnd: boolean;
}

/**
 * Previous / Next for the lesson page. Steps follow the published curriculum
 * across module boundaries; a step can be a lesson or a module quiz, which
 * keeps its place after the module's lessons (its own page shows it locked
 * until those lessons are complete).
 */
export default function LessonNav({ courseSlug, previous, next, isCourseEnd }: Props) {
  const { t, lang } = useLang();
  const n = t.courses.nav;

  const href = (s: NavStep) =>
    s.kind === "quiz" ? `/courses/${courseSlug}/assessments/${s.id}` : `/courses/${courseSlug}/lessons/${s.id}`;
  const label = (s: NavStep) => {
    const title = lang === "ar" && s.titleAr ? s.titleAr : s.titleEn;
    return s.kind === "quiz" ? n.quiz_step.replace("{title}", title) : title;
  };

  if (!previous && !next && !isCourseEnd) return null;

  return (
    <nav className="mt-8 flex items-center justify-between gap-3 border-t border-white/[0.06] pt-6">
      {previous ? (
        <Link href={href(previous)} rel="prev" className="btn-ghost flex-1 px-4 py-2.5 text-[13px]">
          <span aria-hidden="true">{lang === "ar" ? "→" : "←"}</span> {label(previous)}
        </Link>
      ) : (
        <span className="flex-1 text-[13px] text-slate-600">{n.first_lesson}</span>
      )}
      {next ? (
        <Link href={href(next)} rel="next" className="btn-primary flex-1 px-4 py-2.5 text-end text-[13px]">
          {label(next)} <span aria-hidden="true">{lang === "ar" ? "←" : "→"}</span>
        </Link>
      ) : isCourseEnd ? (
        <span className="flex flex-1 flex-col items-end gap-1 text-end text-[13px]">
          <span className="text-slate-600">{n.course_end}</span>
          <Link href={`/courses/${courseSlug}`} className="btn-ghost px-0 text-[13px]">
            {n.back_to_course_overview}
          </Link>
        </span>
      ) : (
        <span className="flex-1 text-end text-[13px] text-slate-600">{n.last_lesson}</span>
      )}
    </nav>
  );
}
