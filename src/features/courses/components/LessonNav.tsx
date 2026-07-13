"use client";

import Link from "next/link";
import { useLang } from "@/lib/LanguageContext";

interface Props {
  courseSlug: string;
  previous: { id: string; title_en: string; title_ar: string | null } | null;
  next: { id: string; title_en: string; title_ar: string | null } | null;
}

export default function LessonNav({ courseSlug, previous, next }: Props) {
  const { t, lang } = useLang();
  const n = t.courses.nav;

  if (!previous && !next) return null;

  return (
    <div className="mt-8 flex items-center justify-between gap-3 border-t border-white/[0.06] pt-6">
      {previous ? (
        <Link
          href={`/courses/${courseSlug}/lessons/${previous.id}`}
          className="btn-ghost flex-1 px-4 py-2.5 text-[13px]"
        >
          ← {lang === "ar" && previous.title_ar ? previous.title_ar : previous.title_en}
        </Link>
      ) : (
        <span className="flex-1 text-[13px] text-slate-600">{n.first_lesson}</span>
      )}
      {next ? (
        <Link
          href={`/courses/${courseSlug}/lessons/${next.id}`}
          className="btn-primary flex-1 px-4 py-2.5 text-end text-[13px]"
        >
          {lang === "ar" && next.title_ar ? next.title_ar : next.title_en} →
        </Link>
      ) : (
        <span className="flex-1 text-end text-[13px] text-slate-600">{n.last_lesson}</span>
      )}
    </div>
  );
}
