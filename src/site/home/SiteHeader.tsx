"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, type MouseEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLang } from "@/lib/LanguageContext";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { pathForLang, resolveRouteLocale } from "@/lib/i18nRoutes";
import translations from "@/lib/translations";
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
 *  - Account actions: Login when signed out; Dashboard and Log out when
 *    signed in (useAuth), on desktop and in the mobile menu.
 *  - aria-current on the section the visitor is in.
 *
 * The Ribbon logo plays its intro on the homepage only.
 */
const NAV = ["/services", "/academy", "/resources", "/blog", "/about"] as const;

export default function SiteHeader() {
  const { lang, setLang } = useLang();
  const { isAuthenticated, isLoading, logout } = useAuth();
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const menuRef = useRef<HTMLDetailsElement>(null);

  const c = getLabContent(lang);
  const k = homeV5Copy.hero[lang];
  const t = translations[lang];
  const other = lang === "en" ? "ar" : "en";
  const route = resolveRouteLocale(pathname);
  const languageHref = route.mirrored ? pathForLang(route.enPath, other) : pathname;
  const onHome = route.enPath === "/";
  const labels: Record<(typeof NAV)[number], string> = {
    "/services": c.nav.services,
    "/academy": c.nav.academy,
    "/resources": c.nav.resources,
    "/blog": c.nav.blog,
    "/about": c.nav.about,
  };
  const nav = NAV.map((path) => ({ path, label: labels[path], href: c.href(path) }));
  const here = (path: string) => (route.enPath === path || route.enPath.startsWith(`${path}/`) ? ("page" as const) : undefined);

  // The mobile menu closes after any navigation.
  useEffect(() => {
    if (menuRef.current) menuRef.current.open = false;
  }, [pathname]);

  function switchLanguage(e: MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    setLang(other);
  }

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  const account = isLoading ? null : isAuthenticated ? (
    <>
      <Link href="/dashboard" className={styles.lang}>{t.nav.dashboard}</Link>
      <button type="button" onClick={handleLogout} className={`${styles.lang} ${styles.textButton}`}>{t.nav.logout}</button>
    </>
  ) : (
    <Link href="/login" className={styles.lang}>{t.nav.login}</Link>
  );

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
          <Link key={n.path} href={n.href} aria-current={here(n.path)}>{n.label}</Link>
        ))}
      </nav>
      <div className={styles.headerEnd}>
        <a href={languageHref} lang={k.language.lang} hrefLang={k.language.lang} className={styles.lang} onClick={switchLanguage}>
          {k.language.label}
        </a>
        <span className={styles.account}>{account}</span>
        <Link href={c.href("/contact")} className={styles.headerCta}>{c.nav.contact}</Link>
        <details className={styles.menu} ref={menuRef}>
          <summary aria-label={k.menu}>
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </summary>
          <ul>
            {nav.map((n) => (
              <li key={n.path}><Link href={n.href} aria-current={here(n.path)}>{n.label}</Link></li>
            ))}
            <li><Link href={c.href("/contact")}>{c.nav.contact}</Link></li>
            <li><a href={languageHref} lang={k.language.lang} onClick={switchLanguage}>{k.language.label}</a></li>
            {!isLoading &&
              (isAuthenticated ? (
                <>
                  <li><Link href="/dashboard">{t.nav.dashboard}</Link></li>
                  <li><button type="button" onClick={handleLogout} className={styles.textButton}>{t.nav.logout}</button></li>
                </>
              ) : (
                <li><Link href="/login">{t.nav.login}</Link></li>
              ))}
          </ul>
        </details>
      </div>
    </header>
  );
}
