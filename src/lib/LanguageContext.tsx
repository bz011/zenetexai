"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import translations, { Lang, Translations } from "./translations";

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Translations;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

// Sprint 9.1: language previously lived only in in-memory state, so ANY
// refresh (including the ones a timed Practice/Mock Exam session's own
// autosave-driven re-renders don't trigger, but a manual reload does)
// silently reset a student back to English mid-assessment. One shared
// localStorage key, read once on mount and written on every change, fixes
// this globally rather than adding a second, assessment-only persistence
// mechanism.
const STORAGE_KEY = "zentexai-lang";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const isRTL = lang === "ar";
  const t = translations[lang];

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "ar") setLangState(stored);
  }, []);

  function setLang(next: Lang) {
    setLangState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used inside LanguageProvider");
  return ctx;
}
