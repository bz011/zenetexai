"use client";

import Link from "next/link";
import { useLang } from "@/lib/LanguageContext";

/**
 * Shown instead of the quiz runner when the student has not yet completed
 * every published lesson in the quiz's module (Sprint 11 module-quiz
 * unlocking). This is the UI reflection of the SAME check the submit API
 * route re-verifies server-side (courseService.isModuleQuizUnlocked) — a
 * student who bypasses this page via a direct URL is still blocked at
 * submission, so this component is a UX courtesy, not the enforcement
 * itself.
 */
export default function QuizLocked({ courseSlug }: { courseSlug: string }) {
  const { t } = useLang();
  const a = t.courses.assessment;
  const l = t.courses.lesson;

  return (
    <div className="relative min-h-screen px-6 py-24">
      <div className="container-page relative max-w-lg">
        <div className="card p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/[0.12] text-[20px]">
            🔒
          </div>
          <p className="mt-5 text-[14px] leading-relaxed text-slate-400">{a.locked}</p>
          <Link href={`/courses/${courseSlug}`} className="btn-primary mt-6 inline-flex px-5 py-2.5 text-[13px]">
            {l.back_to_course}
          </Link>
        </div>
      </div>
    </div>
  );
}
