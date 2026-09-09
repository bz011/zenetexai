"use client";

import Link from "next/link";
import { useLang } from "@/lib/LanguageContext";

/**
 * Shown instead of the quiz runner when a module_assessment row exists and
 * is published but has zero real questions attached yet (content not
 * seeded/imported yet - see courseService.getReadyAssessmentIds). RLS
 * already keeps an unpublished assessment fully invisible; this is the
 * defense-in-depth layer for the "published too early" case, so an empty
 * quiz can never be opened and submitted as if it were real, regardless of
 * how the caller reached this assessment id.
 */
export default function QuizNotReady({ courseSlug }: { courseSlug: string }) {
  const { t } = useLang();
  const a = t.courses.assessment;
  const l = t.courses.lesson;

  return (
    <div className="relative min-h-screen px-6 py-24">
      <div className="container-page relative max-w-lg">
        <div className="card p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/[0.12] text-[20px]">
            🕓
          </div>
          <p className="mt-5 text-[14px] leading-relaxed text-slate-400">{a.not_ready}</p>
          <Link href={`/courses/${courseSlug}`} className="btn-primary mt-6 inline-flex px-5 py-2.5 text-[13px]">
            {l.back_to_course}
          </Link>
        </div>
      </div>
    </div>
  );
}
