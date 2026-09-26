"use client";

import { useLang } from "@/lib/LanguageContext";

/**
 * Explicit, always-visible EN/AR toggle for assessment surfaces (Sprint
 * 9.1 item 1) - placed directly in each runner's own top bar rather than
 * relying solely on AcademyHeader, since the Mock Exam runner is
 * deliberately bare (no header at all - see AcademyShell.tsx) and needs
 * its own self-contained control.
 */
export default function AssessmentLangToggle() {
  const { lang, setLang, t } = useLang();

  return (
    <button
      onClick={() => setLang(lang === "en" ? "ar" : "en")}
      className="flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2.5 text-[11px] font-semibold transition-colors hover:border-slate-300 hover:bg-slate-50"
      aria-label={t.assessment.langToggle}
    >
      <span className={lang === "en" ? "text-slate-900" : "text-slate-400"}>EN</span>
      <span className="text-slate-300">/</span>
      <span className={lang === "ar" ? "text-slate-900" : "text-slate-400"}>AR</span>
    </button>
  );
}
