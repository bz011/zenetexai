"use client";

import Link from "next/link";
import { useLang } from "@/lib/LanguageContext";

/**
 * Shared "you're logged in but don't own this" state for lesson/assessment
 * pages and the Simulator (Practice/Mock Exam). Deliberately not a redirect
 * to /dashboard - the point (per Sprint 10 spec) is Courses -> see product ->
 * understand product -> decide to purchase, not a login-wall-style bounce.
 *
 * Resolves its own copy via useLang() (like every other Academy client
 * component) rather than taking pre-resolved strings as props, so the
 * server pages that render this never need to pick a language themselves.
 */
export default function LockedAccess({ variant, ctaHref }: { variant: "course" | "simulator"; ctaHref: string }) {
  const { t } = useLang();
  const l = t.commerce.locked;

  const title = variant === "course" ? l.course_title : l.simulator_title;
  const body = variant === "course" ? l.course_body : l.simulator_body;
  const ctaLabel = variant === "course" ? l.course_cta : l.simulator_cta;

  return (
    <div className="relative min-h-screen px-6 py-24">
      <div className="container-page relative max-w-lg">
        <div className="card p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/[0.12] text-[20px]">
            🔒
          </div>
          <h1 className="mt-5 text-xl font-bold text-white">{title}</h1>
          <p className="mt-3 text-[14px] leading-relaxed text-slate-400">{body}</p>
          <Link href={ctaHref} className="btn-primary mt-6 inline-flex px-5 py-2.5 text-[13px]">
            {ctaLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
