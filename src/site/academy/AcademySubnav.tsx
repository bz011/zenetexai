"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "@/components/LocaleLink";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useLang } from "@/lib/LanguageContext";
import { toEnglishPath } from "@/lib/i18nRoutes";
import { getSimulatorNavAccess, type AcademyNavState, type SimulatorNavAccess } from "@/features/commerce/services/navAccessService";
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
 * No flicker (audit F3): `initial` is resolved on the server for this request
 * (Academy layout -> getAcademyNavState), so the first HTML already shows the
 * right links and account actions. Until the browser has loaded its own
 * session, that server answer is used; afterwards the live session decides
 * (e.g. after logging out). Simulator access is only ever used for the user it
 * was resolved for, and re-checked when the signed-in user changes, so it can
 * never be stale or another user's.
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

export default function AcademySubnav({ initial }: { initial: AcademyNavState }) {
  const { lang, t } = useLang();
  const k = copy[lang];
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const current = toEnglishPath(usePathname() ?? "/");

  // The server's answer for this request until the browser's session is known.
  const userId = isLoading ? initial.userId : isAuthenticated ? user?.id ?? null : null;
  const authed = userId !== null;
  const [access, setAccess] = useState<{ userId: string; value: SimulatorNavAccess } | null>(
    initial.userId ? { userId: initial.userId, value: { practice: initial.practice, mockExam: initial.mockExam } } : null
  );

  useEffect(() => {
    if (!userId || access?.userId === userId) return;
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
    // `access` is deliberately not a dependency: it only changes as a result of this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
