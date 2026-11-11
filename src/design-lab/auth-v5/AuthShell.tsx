import type { ReactNode } from "react";
import Image from "next/image";
import { getLabContent, type Lang } from "@/design-lab/content";
import { hanken, plexArabicA3 } from "@/design-lab/a3/fonts";
import page from "@/design-lab/home-v5/hero.module.css";
import ribbonLogo from "../../../public/images/branding/zentexai-ribbon-logo-nav.png";
import { authStrings } from "./authCopy";
import TealFlow from "./TealFlow";
import styles from "./auth.module.css";

/**
 * The frame shared by every auth screen (v5): a quiet header (the official
 * Ribbon logo, the language switch and a way back to the site; not the full
 * marketing navigation), one centred column of about 440px, and a single
 * line of footer links. The content is one centred block (wider for Sign
 * up); the Teal Flow ribbons (TealFlow) come out of the upper-left and
 * lower-right corners, beside the form, never under it; no illustration,
 * card or photograph. The design-lab notice is always shown,
 * quietly, below the form.
 */
export default function AuthShell({
  lang,
  otherLangHref,
  title,
  sub,
  children,
  size = "compact",
}: {
  lang: Lang;
  otherLangHref: string;
  title: string;
  sub?: ReactNode;
  children: ReactNode;
  /** compact: Login and recovery (~460px). wide: Sign up (~520px, room for the two name fields). */
  size?: "compact" | "wide";
}) {
  const c = getLabContent(lang);
  const k = authStrings(lang).ui;

  return (
    <div className={`${page.page} ${hanken.variable} ${plexArabicA3.variable} ${styles.shell}`} lang={lang} dir={c.dir}>
      <header className={styles.header}>
        <a href={c.href("/")} className={styles.logo}>
          <Image src={ribbonLogo} alt="ZentexAI" className={styles.logoImage} sizes="160px" quality={90} priority />
        </a>
        <nav className={styles.headerLinks} aria-label={lang === "ar" ? "روابط الصفحة" : "Page links"}>
          <a href={otherLangHref} lang={lang === "ar" ? "en" : "ar"} className={styles.headerLink}>
            {k.language}
          </a>
          <a href={c.href("/")} className={styles.headerLink}>
            {k.back}
          </a>
        </nav>
      </header>

      <main className={`${styles.main} ${size === "wide" ? styles.mainWide : ""}`}>
        <TealFlow id="tf-start" corner="start" />
        <TealFlow id="tf-end" corner="end" />
        <div className={`${styles.column} ${size === "wide" ? styles.columnWide : ""}`}>
          <h1 className={styles.title}>{title}</h1>
          {sub && <p className={styles.sub}>{sub}</p>}
          {children}
          <p className={styles.previewNote}>{k.preview}</p>
        </div>
      </main>

      <footer className={styles.footer}>
        <span dir="ltr">© 2026 ZentexAI</span>
        <a href={c.href("/privacy")}>{k.footer.privacy}</a>
        <a href={c.href("/terms")}>{k.footer.terms}</a>
      </footer>
    </div>
  );
}
