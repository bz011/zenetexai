"use client";

import { useState } from "react";
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
  const [menuOpen, setMenuOpen] = useState(false);

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
        <Link href="/" className="flex items-center gap-2">
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
            <div className="hidden items-center gap-2 md:flex">
              <Link href="/dashboard" className="btn-primary px-4 py-2 text-[13px]">
                {t.nav.dashboard}
              </Link>
              <button onClick={handleLogout} className="px-3.5 py-2 text-[13px] font-medium text-indigo-600 transition-colors hover:text-indigo-700">
                {t.nav.logout}
              </button>
            </div>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Link href="/login" className="px-3.5 py-2 text-[13px] font-medium text-indigo-600 transition-colors hover:text-indigo-700">
                {t.nav.login}
              </Link>
              <Link href="/courses" className="btn-primary px-4 py-2 text-[13px]">
                {t.academyNav.enroll}
              </Link>
            </div>
          )}

          {/* Mobile menu toggle - see Header.tsx for the same fix/rationale:
              the nav above and the auth actions here are both desktop-only
              (md:flex), and there was previously no mobile alternative. */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 md:hidden"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu panel - positioned absolute below the header so it
          overlays content instead of shifting it (no layout shift). */}
      {menuOpen && (
        <div className="absolute inset-x-0 top-full border-b border-slate-200 bg-white md:hidden">
          <nav className="flex flex-col px-6 py-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3.5 py-3 text-[14px] font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 flex items-center gap-2 border-t border-slate-200 pt-3">
              {!isLoading && isAuthenticated ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="btn-primary flex-1 px-4 py-2.5 text-center text-[13px]"
                  >
                    {t.nav.dashboard}
                  </Link>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      handleLogout();
                    }}
                    className="flex-1 px-3.5 py-2.5 text-[13px] font-medium text-indigo-600 transition-colors hover:text-indigo-700"
                  >
                    {t.nav.logout}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                    className="flex-1 px-3.5 py-2.5 text-center text-[13px] font-medium text-indigo-600 transition-colors hover:text-indigo-700"
                  >
                    {t.nav.login}
                  </Link>
                  <Link
                    href="/courses"
                    onClick={() => setMenuOpen(false)}
                    className="btn-primary flex-1 px-4 py-2.5 text-center text-[13px]"
                  >
                    {t.academyNav.enroll}
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
