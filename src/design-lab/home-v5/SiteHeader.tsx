import Image from "next/image";
import { getLabContent, type Lang } from "@/design-lab/content";
import ribbonLogo from "../../../public/images/branding/zentexai-ribbon-logo-nav.png";
import { homeV5Copy } from "./copy";
import styles from "./hero.module.css";

type Props = {
  lang: Lang;
  /** Where the language switch goes: the same page in the other language. */
  languageHref: string;
  /** Production path of the current page; its nav link gets aria-current. */
  current?: string;
  /** The logo intro plays on the homepage only; other pages show it still. */
  logoIntro?: boolean;
};

/**
 * The approved homepage header (Ribbon logo, nav, language switch, contact,
 * mobile menu), shared by the v5 pages. Styles live in hero.module.css with
 * the page tokens; on the homepage the markup is exactly what it was.
 */
export default function SiteHeader({ lang, languageHref, current, logoIntro = true }: Props) {
  const c = getLabContent(lang);
  const k = homeV5Copy.hero[lang];
  const h = c.href;
  const language = { ...k.language, href: languageHref };
  const nav = [
    { label: c.nav.services, path: "/services" },
    { label: c.nav.academy, path: "/academy" },
    { label: c.nav.resources, path: "/resources" },
    { label: c.nav.blog, path: "/blog" },
    { label: c.nav.about, path: "/about" },
  ].map((n) => ({ ...n, href: h(n.path) }));
  const here = (path: string) => (path === current ? ("page" as const) : undefined);

  return (
    <header className={styles.header}>
      {/* Ribbon logo on trial (visual evaluation only). To revert, put back
          <LogoLockup id={1} height={28} /> (from "@/design-lab/logos/Logos")
          as the link's only child. */}
      <a href={h("/")} className={styles.logo}>
        {/* Two copies of the same image (one download): the wordmark layer
            carries the alt text, the Z layer above it is decorative. Each is
            clipped to its half; together they are the unaltered logo. */}
        <span className={logoIntro ? styles.logoMark : `${styles.logoMark} ${styles.logoStill}`}>
          <Image src={ribbonLogo} alt="ZentexAI" className={`${styles.logoImage} ${styles.logoWord}`} sizes="(max-width: 640px) 150px, 176px" quality={90} priority />
          <Image src={ribbonLogo} alt="" aria-hidden="true" className={`${styles.logoImage} ${styles.logoZ}`} sizes="(max-width: 640px) 150px, 176px" quality={90} priority />
          <span className={styles.logoGlint} aria-hidden="true" />
        </span>
      </a>
      <nav aria-label={k.menu} className={styles.nav}>
        {nav.map((n) => (
          <a key={n.href} href={n.href} aria-current={here(n.path)}>{n.label}</a>
        ))}
      </nav>
      <div className={styles.headerEnd}>
        <a href={language.href} lang={language.lang} hrefLang={language.lang} className={styles.lang}>{language.label}</a>
        <a href={h("/contact")} className={styles.headerCta}>{c.nav.contact}</a>
        <details className={styles.menu}>
          <summary aria-label={k.menu}>
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </summary>
          <ul>
            {nav.map((n) => (
              <li key={n.href}><a href={n.href} aria-current={here(n.path)}>{n.label}</a></li>
            ))}
            <li><a href={h("/contact")}>{c.nav.contact}</a></li>
            <li><a href={language.href} lang={language.lang}>{language.label}</a></li>
          </ul>
        </details>
      </div>
    </header>
  );
}
