"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "@/components/LocaleLink";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useLang } from "@/lib/LanguageContext";
import { toEnglishPath } from "@/lib/i18nRoutes";
import { getSimulatorNavAccess, type SimulatorNavAccess } from "@/features/commerce/services/navAccessService";
import styles from "./subnav.module.css";

/**
 * The Academy's own navigation, directly under the one site header on every
 * Academy page (SiteChrome section="academy"). It replaces the separate
 * Academy header: Overview and Courses for everyone; Practice and Mock Exam
 * only for signed-in learners who can open them (owner decision, 2026-11-17:
 * signed-out visitors were sent to Log in by those links). Access comes from
 * getSimulatorNavAccess, the same capability rule the Practice and Mock Exam
 * pages enforce; hiding a link never changes who may open its URL, and the
 * pages keep their own server-side checks.
 * Account actions, as the Academy header had them:
 *  - signed out: Log in, and Enroll (to /courses);
 *  - signed in: Dashboard, and Log out (then /login, as before).
 * While the session is loading, no restricted link is shown and the account
 * actions keep their space but stay invisible, so nothing flashes or jumps;
 * Practice / Mock Exam are appended after Courses once confirmed, so the
 * links before them never move.
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
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const current = toEnglishPath(usePathname() ?? "/");

  const authed = !isLoading && isAuthenticated;
  const userId = authed ? user?.id ?? null : null;
  const [access, setAccess] = useState<{ userId: string; value: SimulatorNavAccess } | null>(null);

  useEffect(() => {
    if (!userId) return;
    let live = true;
    getSimulatorNavAccess()
      .then((value) => {
        if (live) setAccess({ userId, value });
      })
      .catch(() => {
        if (live) setAccess({ userId, value: { practice: false, mockExam: false } });
      });
    return () => {
      live = false;
    };
  }, [userId]);

  // Only ever the current user's answer; nothing while signed out or unknown.
  const allowed = userId && access?.userId === userId ? access.value : null;
  const links = [
    { href: "/academy", label: k.overview },
    { href: "/courses", label: t.academyNav.courses },
    ...(allowed?.practice ? [{ href: "/pmp/practice", label: t.academyNav.practice }] : []),
    ...(allowed?.mockExam ? [{ href: "/pmp/mock-exam", label: t.academyNav.mockExam }] : []),
  ];
  const isCurrent = (href: string) => current === href || current.startsWith(`${href}/`);

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
        <div className={styles.actions} aria-hidden={isLoading || undefined} data-loading={isLoading || undefined}>
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
