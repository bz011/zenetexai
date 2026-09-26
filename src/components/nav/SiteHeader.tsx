"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "@/components/LocaleLink";
import Logo from "@/components/brand/Logo";
import LanguageSwitch from "@/components/nav/LanguageSwitch";
import MenuToggle from "@/components/nav/MenuToggle";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useLang } from "@/lib/LanguageContext";
import { chromeCopy } from "@/lib/chromeCopy";
import { toEnglishPath } from "@/lib/i18nRoutes";

export interface NavItem {
  href: string;
  label: string;
}

interface SiteHeaderProps {
  navLinks: NavItem[];
  /** "dark" ink for the corporate site, "light" ink for the Academy. Colours themselves come from tokens. */
  logoTone: "dark" | "light";
  position: "fixed" | "sticky";
  /** Breakpoint at which the inline navigation replaces the menu button. The corporate nav needs `lg` (it does not fit at 768). */
  navFrom: "md" | "lg";
  /** Logged-out actions: corporate shows Login; the Academy shows Login + Enroll. */
  anonymousActions: "login" | "login-enroll";
  enrollHref?: string;
  enrollLabel?: string;
}

const SHOW_NAV: Record<"md" | "lg", { nav: string; actions: string; toggleHide: string }> = {
  md: { nav: "hidden md:flex", actions: "hidden md:flex", toggleHide: "md:hidden" },
  lg: { nav: "hidden lg:flex", actions: "hidden lg:flex", toggleHide: "lg:hidden" },
};

/**
 * The one site header, used by both shells. Colours come from semantic tokens,
 * so the corporate (dark) and Academy (light) headers are the same component
 * with different token values - there is no per-theme markup to keep in sync.
 */
export default function SiteHeader({ navLinks, logoTone, position, navFrom, anonymousActions, enrollHref = "/courses", enrollLabel = "" }: SiteHeaderProps) {
  const { lang, t } = useLang();
  const c = chromeCopy[lang];
  const { isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleWrap = useRef<HTMLDivElement>(null);
  const show = SHOW_NAV[navFrom];
  const currentPath = toEnglishPath(pathname ?? "/");

  async function handleLogout() {
    await logout();
    router.push("/login");
    router.refresh();
  }

  useEffect(() => {
    if (!menuOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMenuOpen(false);
        toggleWrap.current?.querySelector("button")?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const authed = !isLoading && isAuthenticated;
  const linkBase = "rounded-inner px-3 py-2 text-[13px] font-medium transition-colors hover:bg-surface-2 hover:text-ink";
  const isCurrent = (href: string) => (href === "/" ? currentPath === "/" : currentPath === href || currentPath.startsWith(`${href}/`));

  return (
    <header className={`${position} inset-x-0 top-0 z-50 border-b border-line bg-surface-0/90 backdrop-blur-md`}>
      <div className="container-page flex items-center justify-between gap-4 py-3.5">
        <Link href="/" className="flex items-center gap-2" aria-label={c.homeLabel}>
          <Logo variant="horizontal" tone={logoTone} />
        </Link>

        <nav aria-label={c.mainNavigation} className={`${show.nav} items-center gap-1`}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isCurrent(link.href) ? "page" : undefined}
              className={`${linkBase} ${isCurrent(link.href) ? "text-ink" : "text-ink-2"}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitch />

          <div className={`${show.actions} items-center gap-2`}>
            {authed ? (
              <>
                <Link href="/dashboard" className="btn-primary btn-sm">{t.nav.dashboard}</Link>
                <button type="button" onClick={handleLogout} className="btn-ghost px-3">{t.nav.logout}</button>
              </>
            ) : anonymousActions === "login-enroll" ? (
              <>
                <Link href="/login" className="btn-ghost px-3">{t.nav.login}</Link>
                <Link href={enrollHref} className="btn-primary btn-sm">{enrollLabel}</Link>
              </>
            ) : (
              <Link href="/login" className="btn-primary btn-sm">{t.nav.login}</Link>
            )}
          </div>

          <div ref={toggleWrap}>
            <MenuToggle open={menuOpen} onToggle={() => setMenuOpen((v) => !v)} controls="mobile-nav" hideFrom={show.toggleHide} />
          </div>
        </div>
      </div>

      {/* Menu panel: overlays content instead of shifting it (no layout shift). */}
      {menuOpen && (
        <div id="mobile-nav" className={`absolute inset-x-0 top-full border-b border-line bg-surface-0 shadow-elev ${show.toggleHide}`}>
          <nav aria-label={c.mobileNavigation} className="container-page flex flex-col py-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                aria-current={isCurrent(link.href) ? "page" : undefined}
                className={`flex min-h-[3rem] items-center rounded-inner px-3 text-[15px] font-medium transition-colors hover:bg-surface-2 hover:text-ink ${isCurrent(link.href) ? "text-ink" : "text-ink-2"}`}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 flex items-center gap-2 border-t border-line pt-3">
              {authed ? (
                <>
                  <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="btn-primary flex-1">{t.nav.dashboard}</Link>
                  <button type="button" onClick={() => { setMenuOpen(false); handleLogout(); }} className="btn-secondary flex-1">{t.nav.logout}</button>
                </>
              ) : anonymousActions === "login-enroll" ? (
                <>
                  <Link href="/login" onClick={() => setMenuOpen(false)} className="btn-secondary flex-1">{t.nav.login}</Link>
                  <Link href={enrollHref} onClick={() => setMenuOpen(false)} className="btn-primary flex-1">{enrollLabel}</Link>
                </>
              ) : (
                <Link href="/login" onClick={() => setMenuOpen(false)} className="btn-primary w-full">{t.nav.login}</Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
