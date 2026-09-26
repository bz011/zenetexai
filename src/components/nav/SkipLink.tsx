"use client";

import { useLang } from "@/lib/LanguageContext";
import { chromeCopy } from "@/lib/chromeCopy";

/** First focusable element on every shell page; jumps keyboard users past the navigation. Target: #main-content. */
export default function SkipLink() {
  const { lang } = useLang();
  return (
    <a href="#main-content" className="skip-link">
      {chromeCopy[lang].skipToContent}
    </a>
  );
}
