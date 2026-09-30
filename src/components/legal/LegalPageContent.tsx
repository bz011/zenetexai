"use client";

import { useLang } from "@/lib/LanguageContext";
import type { LegalDoc } from "@/lib/legalCopy";

/**
 * Shared renderer for the three legal pages (Privacy, Terms, Refund) - one
 * component instead of three near-identical ones, since all three are
 * "heading + intro + numbered sections of paragraphs/bullets" in shape.
 */
export default function LegalPageContent({ copy }: { copy: { en: LegalDoc; ar: LegalDoc } }) {
  const { lang, isRTL } = useLang();
  const doc = copy[lang];

  return (
    <div lang={lang} dir={isRTL ? "rtl" : "ltr"} className="min-h-screen px-6 py-28">
      <div className="container-page mx-auto max-w-3xl">
        <h1 className="text-h1 text-ink">{doc.title}</h1>
        <p className="mt-2 text-caption text-ink-3">{doc.updated}</p>

        <div className="mt-8 space-y-4">
          {doc.intro.map((p, i) => (
            <p key={i} className="text-[15px] leading-relaxed text-ink-2">
              {p}
            </p>
          ))}
        </div>

        <div className="mt-12 space-y-10">
          {doc.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-h4 text-ink">{section.heading}</h2>
              <div className="mt-3 space-y-3">
                {section.body.map((item, i) =>
                  item.startsWith("- ") ? (
                    <p key={i} className="ms-4 text-[15px] leading-relaxed text-ink-2">
                      {item}
                    </p>
                  ) : (
                    <p key={i} className="text-[15px] leading-relaxed text-ink-2">
                      {item}
                    </p>
                  )
                )}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
