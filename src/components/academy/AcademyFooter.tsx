"use client";

import Link from "next/link";
import { useLang } from "@/lib/LanguageContext";
import Logo from "@/components/brand/Logo";
import { BRAND } from "@/lib/branding";

/**
 * Restrained Academy footer - deliberately NOT the full corporate marketing
 * footer (no service/resources nav grid). Just brand + a couple of links
 * back out to the corporate site, and the copyright line.
 */
export default function AcademyFooter() {
  const { t } = useLang();

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 py-10 text-center sm:flex-row sm:justify-between sm:text-left">
        <Link href="/academy" className="flex items-center gap-2">
          <Logo variant="horizontal" tone="light" />
        </Link>

        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <Link href="/" className="text-[13px] text-slate-500 transition-colors hover:text-slate-800">
            {BRAND.name}.com
          </Link>
          <Link href="/contact" className="text-[13px] text-slate-500 transition-colors hover:text-slate-800">
            {t.nav.contact}
          </Link>
        </nav>

        <p className="text-[12px] text-slate-400">
          &copy; {new Date().getFullYear()} {BRAND.legalName}. {t.footer.rights}
        </p>
      </div>
    </footer>
  );
}
