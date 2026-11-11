"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLang } from "@/lib/LanguageContext";
import { resolveRouteLocale } from "@/lib/i18nRoutes";
import { getLabContent } from "@/site/content";
import BrandLogo from "@/site/brand/BrandLogo";
import { footerCopy } from "./footerCopy";
import styles from "./footer.module.css";

/**
 * Footer (approved v5 design), used by every corporate page through
 * SiteChrome: deep navy, picking up from the CTA's dark teal. The logo is the
 * same Ribbon Z lockup as the header, in its dark-surface version (BrandLogo).
 * Section links ("#solutions") point at the homepage when not already on it.
 */
export default function Footer() {
  const { lang } = useLang();
  const onHome = resolveRouteLocale(usePathname() ?? "/").enPath === "/";
  const c = getLabContent(lang);
  const k = footerCopy[lang];
  const href = (to: string) => (!to.startsWith("#") ? c.href(to) : onHome ? to : c.href("/") + to);
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.top}>
        <div className={styles.brand}>
          <Link href={c.href("/")} className={styles.logo} aria-label={k.home}>
            <BrandLogo surface="dark" height={32} decorative />
          </Link>
          <p className={styles.statement}>{k.statement}</p>
        </div>

        <nav className={styles.nav} aria-label={k.navLabel}>
          {k.columns.map((col) => (
            <div key={col.title} className={styles.col}>
              <h2 className={styles.colTitle}>{col.title}</h2>
              <ul>
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={href(l.href)} className={styles.link}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div className={styles.bottom}>
        <p className={styles.rights}>
          <span dir="ltr">© {year} ZentexAI.</span> {k.rights}
        </p>
        <ul className={styles.legal} aria-label={k.legalLabel}>
          {k.legal.map((l) => (
            <li key={l.label}>
              <Link href={href(l.href)} className={styles.link}>{l.label}</Link>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
