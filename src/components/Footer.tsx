"use client";

import Link from "@/components/LocaleLink";
import Logo from "@/components/brand/Logo";
import LegalLinks from "@/components/nav/LegalLinks";
import { useLang } from "@/lib/LanguageContext";
import { chromeCopy, footerCopy } from "@/lib/chromeCopy";
import { BRAND } from "@/lib/branding";

export default function Footer() {
  const { lang, t } = useLang();
  const f = footerCopy[lang];
  const c = chromeCopy[lang];

  const groups = [
    {
      heading: f.servicesHeading,
      links: [
        { href: "/services/ai-agents-automation-uae", label: f.services.agents },
        { href: "/services/whatsapp-automation-uae", label: f.services.whatsapp },
        { href: "/services/machine-learning-uae", label: f.services.ml },
        { href: "/services/data-analytics-uae", label: f.services.analytics },
        { href: "/services/power-bi-consulting-uae", label: f.services.powerbi },
      ],
    },
    {
      heading: f.academyHeading,
      links: [
        { href: "/academy", label: f.academy.overview },
        { href: "/courses/pmp-mastery-program", label: f.academy.mastery },
        { href: "/courses/pmp-exam-simulator", label: f.academy.simulator },
      ],
    },
    {
      heading: f.companyHeading,
      links: [
        { href: "/about", label: t.nav.about },
        { href: "/resources", label: t.nav.resources },
        { href: "/blog", label: t.nav.blog },
        { href: "/contact", label: t.nav.contact },
      ],
    },
  ];

  return (
    <footer className="border-t border-line">
      <div className="container-page py-12 md:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_3fr]">
          <div className="max-w-xs">
            <Link href="/" aria-label={c.homeLabel} className="inline-flex">
              <Logo variant="primary" />
            </Link>
            <p className="mt-4 text-small text-ink-3">{t.footer.tagline}</p>
          </div>

          <nav aria-label={c.footerNavigation} className="grid gap-8 sm:grid-cols-3">
            {groups.map((g) => (
              <div key={g.heading}>
                <h2 className="text-caption font-semibold uppercase tracking-[0.1em] text-ink-2">{g.heading}</h2>
                <ul className="mt-4 space-y-1">
                  {g.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="inline-flex min-h-[2rem] items-center text-small text-ink-3 transition-colors hover:text-ink">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {/* No public email shown yet - hidden until an official company address exists (BRAND.email). */}
        <div className="mt-12 flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-caption text-ink-3">
            &copy; {new Date().getFullYear()} {BRAND.legalName}. {t.footer.rights}
          </p>
          <LegalLinks />
        </div>
      </div>
    </footer>
  );
}
