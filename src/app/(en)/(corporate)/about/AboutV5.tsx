"use client";

import { useLang } from "@/lib/LanguageContext";
import AboutPage from "@/site/about/AboutPage";

/**
 * /about has no /ar twin: like the page it replaces, it follows the
 * visitor's stored language preference (LanguageContext), rendered in the
 * browser. Arabic URLs for it are a separate, pending routing decision.
 */
export default function AboutV5() {
  const { lang } = useLang();
  return <AboutPage lang={lang} />;
}
