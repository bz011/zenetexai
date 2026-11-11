"use client";

import type { MouseEvent, ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLang } from "@/lib/LanguageContext";
import page from "@/site/home/hero.module.css";
import { hanken, plexArabicA3 } from "@/site/fonts";
import BrandLogo from "@/site/brand/BrandLogo";
import TealFlow from "./TealFlow";
import { authStrings } from "./authCopy";
import styles from "./auth.module.css";

/**
 * The frame of the account screens (approved Teal Flow design): a quiet
 * header (Ribbon logo, language switch, back to the site), the Teal Flow
 * ribbons in the upper-left and lower-right corners, and one line of footer
 * links. Used by the (auth) route group layout for /login, /signup,
 * /forgot-password, /reset-password and /verify-email (URLs unchanged).
 *
 * These routes have no /ar twins: the language follows the stored
 * preference (LanguageContext) and the switch flips it in place, exactly as
 * before. `#main-content` is the SkipLink target.
 */
export default function AuthFrame({ children }: { children: ReactNode }) {
  const { lang, setLang, isRTL } = useLang();
  const pathname = usePathname() ?? "/login";
  const k = authStrings(lang).ui;
  const other = lang === "en" ? "ar" : "en";

  function switchLanguage(e: MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    setLang(other);
  }

  return (
    <div className={`${page.page} ${hanken.variable} ${plexArabicA3.variable} ${styles.shell}`} lang={lang} dir={isRTL ? "rtl" : "ltr"}>
      <header className={styles.header}>
        <Link href="/" className={styles.logo}>
          <BrandLogo surface="light" height={28} priority className={styles.logoImage} />
        </Link>
        <nav className={styles.headerLinks} aria-label={lang === "ar" ? "روابط الصفحة" : "Page links"}>
          <a href={pathname} lang={other} hrefLang={other} className={styles.headerLink} onClick={switchLanguage}>
            {k.language}
          </a>
          <Link href="/" className={styles.headerLink}>
            {k.back}
          </Link>
        </nav>
      </header>

      <main id="main-content" tabIndex={-1} className={styles.main}>
        <TealFlow id="tf-start" corner="start" />
        <TealFlow id="tf-end" corner="end" />
        {children}
      </main>

      <footer className={styles.footer}>
        <span dir="ltr">© {new Date().getFullYear()} ZentexAI</span>
        <Link href="/privacy">{k.footer.privacy}</Link>
        <Link href="/terms">{k.footer.terms}</Link>
      </footer>
    </div>
  );
}

/** The centred content block of an account screen (heading, introduction, form). */
export function AuthColumn({ title, sub, size = "compact", children }: { title: string; sub?: ReactNode; size?: "compact" | "wide"; children: ReactNode }) {
  return (
    <div className={`${styles.column} ${size === "wide" ? styles.columnWide : ""}`}>
      <h1 className={styles.title}>{title}</h1>
      {sub && <p className={styles.sub}>{sub}</p>}
      {children}
    </div>
  );
}
