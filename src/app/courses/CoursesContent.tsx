"use client";

import Link from "next/link";
import { useLang } from "@/lib/LanguageContext";
import type { Course } from "@/features/courses/types/course";

export default function CoursesContent({ courses }: { courses: Course[] }) {
  const { t, lang } = useLang();
  const c = t.courses.dashboard;

  return (
    <div className="relative min-h-screen px-6 py-24">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[350px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/[0.08] blur-[100px]" />

      <div className="container-page relative max-w-3xl">
        <span className="label">{c.eyebrow}</span>
        <h1 className="mt-3 text-3xl font-bold text-white">{c.heading}</h1>

        {courses.length === 0 ? (
          <div className="card mt-8 p-8 text-center">
            <p className="text-[14px] text-slate-500">{c.empty}</p>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {courses.map((course) => (
              <Link
                key={course.id}
                href={`/courses/${course.slug}`}
                className="card card-hover block p-6"
              >
                <h2 className="text-[16px] font-semibold text-white">
                  {lang === "ar" && course.title_ar ? course.title_ar : course.title_en}
                </h2>
                {(course.description_en || course.description_ar) && (
                  <p className="mt-2 text-[13px] leading-relaxed text-slate-400">
                    {lang === "ar" && course.description_ar ? course.description_ar : course.description_en}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
