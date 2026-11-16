"use client";

import type { ReactNode } from "react";
import { useLang } from "@/lib/LanguageContext";
import page from "@/site/home/hero.module.css";
import { hanken, plexArabicA3 } from "@/site/fonts";
import SiteHeader from "@/site/home/SiteHeader";
import Footer from "@/site/home/Footer";
import styles from "./site.module.css";

/**
 * The one site frame: the approved header and footer around every corporate
 * page AND every Academy page (English and Arabic). The language and
 * direction come from LanguageContext, so non-mirrored pages follow the
 * visitor's stored preference exactly as before. `#main-content` is the
 * SkipLink target.
 *
 * Token scoping: the approved design's custom properties (--ink, --ink-2,
 * --line, --card, ...) share names with production's Tailwind tokens, which
 * are RGB channel triplets. So they are applied ONLY to the header and
 * footer here (and by each v5 page on its own root) - never around <main>,
 * where they would break the colours of pages not yet redesigned. Corporate
 * pages instead get the "zentex" theme (src/styles/tokens.css); Academy pages
 * get `.academy-shell`, the same palette plus the Academy's compatibility
 * layer and sticky-offset variables (src/app/globals.css).
 *
 * Options:
 *  - section="academy": the Academy frame. Marks Academy as the current
 *    section in the header, puts `subnav` (the Academy's own navigation)
 *    directly under it, and themes <main> with `.academy-shell`.
 *  - floating: a floating action (the WhatsApp button). It rides in a sticky
 *    rail at the END of <main>, so it follows the viewport while the content
 *    scrolls by and comes to rest just above the footer: it never sits on the
 *    footer's links or text. Pure CSS, no scroll listeners.
 */
export default function SiteChrome({
  children,
  section,
  subnav,
  floating,
}: {
  children: ReactNode;
  section?: "academy";
  subnav?: ReactNode;
  floating?: ReactNode;
}) {
  const { lang, isRTL } = useLang();
  const academy = section === "academy";
  return (
    <div className={`${hanken.variable} ${plexArabicA3.variable} ${styles.chrome}`} lang={lang} dir={isRTL ? "rtl" : "ltr"}>
      <div className={`${page.page} ${styles.band}`}>
        <SiteHeader section={section} />
      </div>
      <main
        id="main-content"
        tabIndex={-1}
        className={academy ? `${styles.main} ${styles.academyMain} academy-shell` : styles.main}
        data-theme={academy ? undefined : "zentex"}
      >
        {subnav}
        {children}
        {floating && (
          <div className={styles.floatRail}>
            <div className={styles.floatSlot}>{floating}</div>
          </div>
        )}
      </main>
      <div className={`${page.page} ${styles.band}`}>
        <Footer />
      </div>
    </div>
  );
}
