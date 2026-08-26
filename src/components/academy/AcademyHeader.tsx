"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/LanguageContext";
import { useAuth } from "@/features/auth/hooks/useAuth";
import Logo from "@/components/brand/Logo";

/**
 * Dedicated light header for the ZentexAI Academy shell - NOT a reuse of
 * the dark corporate Header (see Header.tsx), so the Academy reads as its
 * own environment the moment a visitor lands on /academy, before login.
 * Same brand/logo identity (Logo tone="light"), learning-focused nav
 * instead of corporate marketing links.
 */
export default function AcademyHeader() {
  const { lang, setLang, t } = useLang();
  const { isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/login");
    router.refresh();
  }

  const navLinks = [
    { href: "/courses", label: t.academyNav.courses },
    { href: "/pmp/practice", label: t.academyNav.practice },
    { href: "/pmp/mock-exam", label: t.academyNav.mockExam },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
        <Link href="/academy" className="flex items-center gap-2">
          <Logo variant="horizontal" tone="light" />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3.5 py-2 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setLang(lang === "en" ? "ar" : "en")}
            className="flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2.5 text-[11px] font-semibold transition-colors hover:border-slate-300 hover:bg-slate-50"
            aria-label="Switch language"
          >
            <span className={lang === "en" ? "text-slate-900" : "text-slate-400"}>EN</span>
            <span className="text-slate-300">/</span>
            <span className={lang === "ar" ? "text-slate-900" : "text-slate-400"}>AR</span>
          </button>

          {!isLoading && isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link href="/dashboard" className="rounded-lg bg-indigo-600 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-indigo-700">
                {t.nav.dashboard}
              </Link>
              <button onClick={handleLogout} className="px-3.5 py-2 text-[13px] font-medium text-indigo-600 transition-colors hover:text-indigo-700">
                {t.nav.logout}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="px-3.5 py-2 text-[13px] font-medium text-indigo-600 transition-colors hover:text-indigo-700">
                {t.nav.login}
              </Link>
              <Link href="/enroll" className="rounded-lg bg-indigo-600 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-indigo-700">
                {t.academyNav.enroll}
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
