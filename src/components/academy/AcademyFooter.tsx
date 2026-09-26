"use client";

import Link from "@/components/LocaleLink";
import Logo from "@/components/brand/Logo";
import LegalLinks from "@/components/nav/LegalLinks";
import { useLang } from "@/lib/LanguageContext";
import { chromeCopy } from "@/lib/chromeCopy";
import { BRAND } from "@/lib/branding";

/**
 * Restrained Academy footer - deliberately NOT the full corporate marketing
 * footer. Brand, two links back to the main site, legal slot, copyright.
 */
export default function AcademyFooter() {
  const { lang, t } = useLang();
  const c = chromeCopy[lang];

  return (
    <footer className="border-t border-line">
      <div className="container-page flex flex-col items-center gap-5 py-10 text-center sm:flex-row sm:justify-between sm:text-start">
        <Link href="/" aria-label={c.homeLabel} className="flex items-center gap-2">
          <Logo variant="horizontal" tone="light" />
        </Link>

        <nav aria-label={c.footerNavigation} className="flex flex-wrap items-center justify-center gap-x-6">
          <Link href="/" className="inline-flex min-h-[2.75rem] items-center text-small text-ink-3 transition-colors hover:text-ink">
            {BRAND.name}.com
          </Link>
          <Link href="/contact" className="inline-flex min-h-[2.75rem] items-center text-small text-ink-3 transition-colors hover:text-ink">
            {t.nav.contact}
          </Link>
        </nav>

        <div className="flex flex-col items-center gap-2 sm:items-end">
          <p className="text-caption text-ink-3">
            &copy; {new Date().getFullYear()} {BRAND.legalName}. {t.footer.rights}
          </p>
          <LegalLinks />
        </div>
      </div>
    </footer>
  );
}
