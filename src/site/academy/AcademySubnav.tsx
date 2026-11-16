"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "@/components/LocaleLink";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useLang } from "@/lib/LanguageContext";
import { toEnglishPath } from "@/lib/i18nRoutes";
import styles from "./subnav.module.css";

/**
 * The Academy's own navigation, directly under the one site header on every
 * Academy page (SiteChrome section="academy"). It replaces the separate
 * Academy header: the same destinations (Courses, Practice, Mock Exam, from
 * translations.academyNav) plus an Academy overview link, and the account
 * actions the Academy header carried, unchanged in behaviour:
 *  - signed out: Log in, and Enroll (to /courses);
 *  - signed in: Dashboard, and Log out (then /login, as before).
 * While the session is still loading the signed-out actions show, exactly as
 * the Academy header did.
 *
 * Sticky under the header from 641px up, at exactly --academy-header-h
 * (57px, globals.css), so the lesson player's own sticky bar keeps its
 * offset. On phones it wraps onto two rows and scrolls away with the page
 * (--academy-header-h is 0 there, see subnav.module.css).
 */
const copy = {
  en: { label: "ZentexAI Academy", overview: "Overview" },
  ar: { label: "أكاديمية ZentexAI", overview: "نظرة عامة" },
} as const;

export default function AcademySubnav() {
  const { lang, t } = useLang();
  const k = copy[lang];
  const { isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const current = toEnglishPath(usePathname() ?? "/");

  const links = [
    { href: "/academy", label: k.overview },
    { href: "/courses", label: t.academyNav.courses },
    { href: "/pmp/practice", label: t.academyNav.practice },
    { href: "/pmp/mock-exam", label: t.academyNav.mockExam },
  ];
  const isCurrent = (href: string) => current === href || current.startsWith(`${href}/`);
  const authed = !isLoading && isAuthenticated;

  async function handleLogout() {
    await logout();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className={styles.bar}>
      <nav aria-label={k.label} className={styles.inner}>
        <ul className={styles.links}>
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} aria-current={isCurrent(l.href) ? "page" : undefined} className={styles.link}>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className={styles.actions}>
          {authed ? (
            <>
              <Link href="/dashboard" aria-current={isCurrent("/dashboard") ? "page" : undefined} className={styles.primary}>
                {t.nav.dashboard}
              </Link>
              <button type="button" onClick={handleLogout} className={styles.secondary}>
                {t.nav.logout}
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className={styles.secondary}>{t.nav.login}</Link>
              <Link href="/courses" className={styles.primary}>{t.academyNav.enroll}</Link>
            </>
          )}
        </div>
      </nav>
    </div>
  );
}
