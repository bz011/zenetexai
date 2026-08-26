"use client";

import Link from "next/link";
import { useLang } from "@/lib/LanguageContext";
import type { CourseWithProgress } from "@/features/courses/types/course";

export default function CourseDetailContent({ course }: { course: CourseWithProgress }) {
  const { t, lang } = useLang();
  const c = t.courses.detail;

  const progressPct =
    course.totalLessons > 0 ? Math.round((course.completedLessons / course.totalLessons) * 100) : 0;

  return (
    <div className="relative min-h-screen px-6 py-24">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[350px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/[0.08] blur-[100px]" />

      <div className="container-page relative max-w-3xl">
        <span className="label">{t.courses.dashboard.eyebrow}</span>
        <h1 className="mt-3 text-3xl font-bold text-white">
          {lang === "ar" && course.title_ar ? course.title_ar : course.title_en}
        </h1>
        {(course.description_en || course.description_ar) && (
          <p className="mt-3 max-w-lg text-[14px] leading-relaxed text-slate-400">
            {lang === "ar" && course.description_ar ? course.description_ar : course.description_en}
          </p>
        )}

        <div className="mt-6 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
            <div className="h-full rounded-full bg-indigo-500" style={{ width: `${progressPct}%` }} />
          </div>
          <span className="text-[12px] text-slate-500">
            {course.completedLessons}/{course.totalLessons} {c.lessons_label} · {progressPct}%
          </span>
        </div>

        {course.modules.length === 0 ? (
          <div className="card mt-8 p-8 text-center">
            <p className="text-[14px] text-slate-500">{c.empty}</p>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            {course.modules.map((mod, mi) => (
              <div key={mod.id} className="card p-6">
                <h2 className="text-[15px] font-semibold text-white">
                  {mi + 1}. {lang === "ar" && mod.title_ar ? mod.title_ar : mod.title_en}
                </h2>

                <div className="mt-4 space-y-1.5">
                  {mod.lessons.map((lesson) => (
                    <Link
                      key={lesson.id}
                      href={`/courses/${course.slug}/lessons/${lesson.id}`}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition-colors hover:bg-white/[0.04]"
                    >
                      <span className={lesson.completed ? "text-emerald-400" : "text-slate-600"}>
                        {lesson.completed ? "✓" : "○"}
                      </span>
                      <span className={lesson.completed ? "text-slate-300" : "text-slate-400"}>
                        {lang === "ar" && lesson.title_ar ? lesson.title_ar : lesson.title_en}
                      </span>
                    </Link>
                  ))}
                </div>

                {mod.moduleAssessment && (
                  <Link
                    href={`/courses/${course.slug}/assessments/${mod.moduleAssessment.id}`}
                    className="btn-ghost mt-4 inline-flex px-4 py-2 text-[13px]"
                  >
                    {c.module_assessment_cta}
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
