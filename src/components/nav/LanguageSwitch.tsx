"use client";

import { useLang } from "@/lib/LanguageContext";
import { chromeCopy } from "@/lib/chromeCopy";

/**
 * EN / AR toggle. The accessible name STARTS with the visible text ("EN / AR")
 * so it satisfies WCAG 2.5.3 (label in name) and speech-control users can say
 * what they see; the action is appended. 44x44 minimum target.
 */
export default function LanguageSwitch() {
  const { lang, setLang } = useLang();
  const c = chromeCopy[lang];
  return (
    <button
      type="button"
      onClick={() => setLang(lang === "en" ? "ar" : "en")}
      className="flex min-h-[2.75rem] min-w-[2.75rem] items-center justify-center gap-1 rounded-inner border border-line-strong px-3 text-xs font-semibold transition-colors hover:border-ink-3 hover:bg-surface-2"
      aria-label={`EN / AR - ${c.switchLanguage}`}
    >
      <span className={lang === "en" ? "text-ink" : "text-ink-3"}>EN</span>{" "}
      <span className="text-ink-3">/</span>{" "}
      <span className={lang === "ar" ? "text-ink" : "text-ink-3"}>AR</span>
    </button>
  );
}
