"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/LanguageContext";
import { useAuth } from "@/features/auth/hooks/useAuth";
import Logo from "@/components/brand/Logo";

export default function Header() {
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
    { href: "/services", label: t.nav.services },
    { href: "/academy", label: t.nav.academy },
    { href: "/resources", label: t.nav.resources },
    { href: "/about", label: t.nav.about },
    { href: "/contact", label: t.nav.contact },
  ];

  return (
    <header className="fixed top-0 inset-x-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 border-b border-white/[0.06]" style={{ backgroundColor: "rgba(6,11,24,0.85)", backdropFilter: "blur(16px)" }} />

      <div className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Logo variant="horizontal" />
        </Link>

        {/* Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3.5 py-2 text-[13px] font-medium text-slate-400 transition-colors hover:bg-white/[0.05] hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2.5">
          {/* Language switcher */}
          <button
            onClick={() => setLang(lang === "en" ? "ar" : "en")}
            className="flex h-8 items-center gap-1 rounded-lg border border-white/[0.1] px-2.5 text-[11px] font-semibold transition-colors hover:border-white/[0.2] hover:bg-white/[0.05]"
            aria-label="Switch language"
          >
            <span className={lang === "en" ? "text-white" : "text-slate-500"}>EN</span>
            <span className="text-slate-700">/</span>
            <span className={lang === "ar" ? "text-white" : "text-slate-500"}>AR</span>
          </button>

          {!isLoading && isAuthenticated ? (
            <div className="hidden items-center gap-2 md:flex">
              <Link href="/dashboard" className="btn-primary px-4 py-2 text-[13px]">
                {t.nav.dashboard}
              </Link>
              <button onClick={handleLogout} className="btn-ghost px-3.5 py-2 text-[13px]">
                {t.nav.logout}
              </button>
            </div>
          ) : (
            <div className="hidden md:block">
              <Link href="/login" className="btn-primary px-4 py-2 text-[13px]">
                {t.nav.login}
              </Link>
            </div>
          )}

          {/* Mobile menu toggle - the nav above and the auth actions here are
              both md:hidden/md:flex desktop-only; below md there was
              previously no way at all to reach Services/Academy/Resources/
              About/Contact, or Dashboard/Logout, from the header. */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.1] text-slate-300 transition-colors hover:border-white/[0.2] hover:bg-white/[0.05] md:hidden"
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
        <div className="absolute inset-x-0 top-full border-b border-white/[0.06] bg-[#060b18] md:hidden">
          <nav className="flex flex-col px-6 py-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3.5 py-3 text-[14px] font-medium text-slate-300 transition-colors hover:bg-white/[0.05] hover:text-white"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 flex items-center gap-2 border-t border-white/[0.06] pt-3">
              {!isLoading && isAuthenticated ? (
                <>
                  <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="btn-primary flex-1 px-4 py-2.5 text-center text-[13px]">
                    {t.nav.dashboard}
                  </Link>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      handleLogout();
                    }}
                    className="btn-ghost flex-1 px-3.5 py-2.5 text-[13px]"
                  >
                    {t.nav.logout}
                  </button>
                </>
              ) : (
                <Link href="/login" onClick={() => setMenuOpen(false)} className="btn-primary w-full px-4 py-2.5 text-center text-[13px]">
                  {t.nav.login}
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
