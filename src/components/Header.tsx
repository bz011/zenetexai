"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/LanguageContext";
import { useAuth } from "@/features/auth/hooks/useAuth";
import Logo from "@/components/brand/Logo";

export default function Header() {
  const { lang, setLang, t } = useLang();
  const { isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();

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
            <div className="flex items-center gap-2">
              <Link href="/dashboard" className="btn-primary px-4 py-2 text-[13px]">
                {t.nav.dashboard}
              </Link>
              <button onClick={handleLogout} className="btn-ghost px-3.5 py-2 text-[13px]">
                {t.nav.logout}
              </button>
            </div>
          ) : (
            <Link href="/login" className="btn-primary px-4 py-2 text-[13px]">
              {t.nav.login}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
