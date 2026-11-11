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
 * corporate page (English and Arabic), in the approved tokens and type. The
 * language and direction come from LanguageContext, so non-mirrored pages
 * follow the visitor's stored preference exactly as before.
 * `#main-content` is the SkipLink target, as in the previous layout.
 */
export default function SiteChrome({ children }: { children: ReactNode }) {
  const { lang, isRTL } = useLang();
  return (
    <div className={`${page.page} ${hanken.variable} ${plexArabicA3.variable} ${styles.chrome}`} lang={lang} dir={isRTL ? "rtl" : "ltr"}>
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className={styles.main}>
        {children}
      </main>
      <Footer />
    </div>
  );
}
