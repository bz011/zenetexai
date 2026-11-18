"use client";

import { useLang } from "@/lib/LanguageContext";

/**
 * Heading and introduction of the Practice Mode and Mock Exam pages, in the
 * interface language (audit F7: they were English-only in Arabic mode). The
 * "PMP" label uses the shared brand label style (teal accent token) on both
 * pages (audit F10: the Mock Exam page used a hard-coded blue).
 */
export default function SimulatorPageHeader({ variant }: { variant: "practice" | "mockExam" }) {
  const { t, lang } = useLang();
  const k = variant === "practice" ? t.practiceConfig : t.examStart;
  return (
    <div dir={lang === "ar" ? "rtl" : "ltr"}>
      <span className="label">PMP</span>
      <h1 className="mt-3 text-2xl font-bold text-ink">{k.pageTitle}</h1>
      <p className="mt-2 text-[14px] text-ink-2">{k.pageIntro}</p>
    </div>
  );
}
