"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, type MouseEvent } from "react";
import { usePathname } from "next/navigation";
import { useLang } from "@/lib/LanguageContext";
import { pathForLang, resolveRouteLocale } from "@/lib/i18nRoutes";
import { getLabContent } from "@/site/content";
import { LOGO_ASSET } from "@/site/brand/BrandLogo";
import { homeV5Copy } from "./copy";
import styles from "./hero.module.css";

/**
 * The site header (approved v5 design), used by every corporate page through
 * SiteChrome. Production behaviour kept from the previous header:
 *
 *  - Language comes from LanguageContext (the URL on mirrored /ar routes,
 *    the stored preference elsewhere). The switch is a real link to the
 *    other-language URL on mirrored routes and otherwise flips the stored
 *    preference in place, exactly like the old LanguageSwitch.
 *  - aria-current on the section the visitor is in (Home on the homepage).
 *
 * Navigation: Home | Services | Academy | Blog | About, then Contact as the
 * closing call to action, in the same order in the mobile menu. Academy is
 * set apart with a quiet teal outline. There are no account actions here:
 * Login, Dashboard and Log out live in the Academy's own navigation bar
 * (src/site/academy/AcademySubnav.tsx), directly under this header on every
 * Academy page, where learners use them. With section="academy" (set by
 * SiteChrome there), Academy is marked as the current section.
 *
 * The Ribbon logo plays its intro on the homepage only.
 */
const NAV = ["/", "/services", "/academy", "/blog", "/about"] as const;

export default function SiteHeader({ section }: { section?: "academy" } = {}) {
  const { lang, setLang } = useLang();
  const pathname = usePathname() ?? "/";
  const menuRef = useRef<HTMLDetailsElement>(null);

  const c = getLabContent(lang);
  const k = homeV5Copy.hero[lang];
  const other = lang === "en" ? "ar" : "en";
  const route = resolveRouteLocale(pathname);
  const languageHref = route.mirrored ? pathForLang(route.enPath, other) : pathname;
  const onHome = route.enPath === "/";
  const labels: Record<(typeof NAV)[number], string> = {
    "/": c.nav.home,
    "/services": c.nav.services,
    "/academy": c.nav.academy,
    "/blog": c.nav.blog,
    "/about": c.nav.about,
  };
  const nav = NAV.map((path) => ({ path, label: labels[path], href: c.href(path) }));
  const here = (path: string) => {
    if (path === "/" ? onHome : route.enPath === path || route.enPath.startsWith(`${path}/`)) return "page" as const;
    // Inside the Academy (courses, dashboard, practice, ...) Academy is the current section.
    if (path === "/academy" && section === "academy") return "true" as const;
    return undefined;
  };
  const linkClass = (path: string) => (path === "/academy" ? styles.navAcademy : undefined);

  // The mobile menu closes after any navigation.
  useEffect(() => {
    if (menuRef.current) menuRef.current.open = false;
  }, [pathname]);

  function switchLanguage(e: MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    setLang(other);
  }

  return (
    <header className={styles.header}>
      <Link href={c.href("/")} className={styles.logo}>
        {/* Two layers of the same artwork (one download): the wordmark layer
            carries the alt text, the Z layer above it is decorative. Each is
            clipped to its half; together they are the unaltered logo. */}
        <span className={onHome ? styles.logoMark : `${styles.logoMark} ${styles.logoStill}`}>
          <Image src={LOGO_ASSET.light} alt="ZentexAI" className={`${styles.logoImage} ${styles.logoWord}`} sizes="(max-width: 640px) 150px, 176px" quality={90} priority />
          <Image src={LOGO_ASSET.light} alt="" aria-hidden="true" className={`${styles.logoImage} ${styles.logoZ}`} sizes="(max-width: 640px) 150px, 176px" quality={90} priority />
          <span className={styles.logoGlint} aria-hidden="true" />
        </span>
      </Link>
      <nav aria-label={k.menu} className={styles.nav}>
        {nav.map((n) => (
          <Link key={n.path} href={n.href} aria-current={here(n.path)} className={linkClass(n.path)}>{n.label}</Link>
        ))}
      </nav>
      <div className={styles.headerEnd}>
        <a href={languageHref} lang={k.language.lang} hrefLang={k.language.lang} className={styles.lang} onClick={switchLanguage}>
          {k.language.label}
        </a>
        <Link href={c.href("/contact")} className={styles.headerCta}>{c.nav.contact}</Link>
        <details className={styles.menu} ref={menuRef}>
          <summary aria-label={k.menu}>
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </summary>
          <ul>
            {nav.map((n) => (
              <li key={n.path}><Link href={n.href} aria-current={here(n.path)} className={linkClass(n.path)}>{n.label}</Link></li>
            ))}
            <li><Link href={c.href("/contact")} aria-current={here("/contact")}>{c.nav.contact}</Link></li>
            <li className={styles.menuLang}><a href={languageHref} lang={k.language.lang} onClick={switchLanguage}>{k.language.label}</a></li>
          </ul>
        </details>
      </div>
    </header>
  );
}
