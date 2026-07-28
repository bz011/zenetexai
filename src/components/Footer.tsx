"use client";

import Link from "next/link";
import { useLang } from "@/lib/LanguageContext";
import Logo from "@/components/brand/Logo";
import { BRAND } from "@/lib/branding";

export default function Footer() {
  const { t } = useLang();

  const navLinks = [
    [t.nav.services, "/services"],
    [t.nav.academy, "/academy"],
    [t.nav.resources, "/resources"],
    [t.nav.about, "/about"],
    [t.nav.contact, "/contact"],
  ];

  return (
    <footer className="relative mt-px border-t border-white/[0.06]">
      {/* Subtle top glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />

      <div className="container-page py-14">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          {/* Brand */}
          <div className="max-w-xs">
            <Link href="/">
              <Logo variant="horizontal" />
            </Link>
            <p className="mt-2.5 text-[13px] leading-relaxed text-slate-500">
              {t.footer.tagline}
            </p>
          </div>

          {/* Nav */}
          <nav className="flex flex-wrap gap-x-8 gap-y-3">
            {navLinks.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="text-[13px] text-slate-500 transition-colors hover:text-slate-200"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Bottom bar */}
        {/* No public email shown yet - hidden per Sprint 7.6.1 until an
            official company address (info@zentexai.com) exists. Re-add a
            second <p> here with BRAND.email once it does. */}
        <div className="mt-10 flex items-center justify-center border-t border-white/[0.06] pt-8">
          <p className="text-[12px] text-slate-600">
            &copy; {new Date().getFullYear()} {BRAND.legalName}. {t.footer.rights}
          </p>
        </div>
      </div>
    </footer>
  );
}
