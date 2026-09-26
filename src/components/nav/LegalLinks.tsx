"use client";

import Link from "@/components/LocaleLink";
import { useLang } from "@/lib/LanguageContext";
import { chromeCopy } from "@/lib/chromeCopy";
import { LEGAL_LINKS } from "@/lib/legalLinks";

/** Renders the configured legal links; renders NOTHING while none are configured (no placeholders, no dead links). */
export default function LegalLinks({ className = "" }: { className?: string }) {
  const { lang } = useLang();
  if (LEGAL_LINKS.length === 0) return null;
  return (
    <nav aria-label={chromeCopy[lang].legalNavigation} className={className}>
      <ul className="flex flex-wrap gap-x-5 gap-y-2">
        {LEGAL_LINKS.map((l) => (
          <li key={l.id}>
            <Link href={l.href} className="text-caption text-ink-3 underline-offset-4 hover:text-ink hover:underline">
              {l.label[lang]}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
