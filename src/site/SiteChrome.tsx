"use client";

import type { ReactNode } from "react";
import { useLang } from "@/lib/LanguageContext";
import page from "@/site/home/hero.module.css";
import { hanken, plexArabicA3 } from "@/site/fonts";
import SiteHeader from "@/site/home/SiteHeader";
import Footer from "@/site/home/Footer";
import styles from "./site.module.css";

/**
 * The corporate site frame: the approved header and footer around every
 * corporate page (English and Arabic). The language and direction come from
 * LanguageContext, so non-mirrored pages follow the visitor's stored
 * preference exactly as before. `#main-content` is the SkipLink target.
 *
 * Token scoping: the approved design's custom properties (--ink, --ink-2,
 * --line, --card, ...) share names with production's Tailwind tokens, which
 * are RGB channel triplets. So they are applied ONLY to the header and
 * footer here (and by each v5 page on its own root) - never around <main>,
 * where they would break the colours of pages not yet redesigned. Those
 * pages instead get the "zentex" theme (src/styles/tokens.css): the same
 * palette expressed in production's own token names.
 */
export default function SiteChrome({ children }: { children: ReactNode }) {
  const { lang, isRTL } = useLang();
  return (
    <div className={`${hanken.variable} ${plexArabicA3.variable} ${styles.chrome}`} lang={lang} dir={isRTL ? "rtl" : "ltr"}>
      <div className={`${page.page} ${styles.band}`}>
        <SiteHeader />
      </div>
      <main id="main-content" tabIndex={-1} className={styles.main} data-theme="zentex">
        {children}
      </main>
      <div className={`${page.page} ${styles.band}`}>
        <Footer />
      </div>
    </div>
  );
}
