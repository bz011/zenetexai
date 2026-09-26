"use client";

import { useLang } from "@/lib/LanguageContext";
import ContactForm from "@/components/ContactForm";
import Section from "@/components/ui/Section";
import SectionHeader from "@/components/ui/SectionHeader";

/** Contact section. id="contact" is the in-page anchor Arabic pages link to (see localizeHref in lib/i18nRoutes.ts). */
export default function CTASection() {
  const { t } = useLang();
  const c = t.cta;

  return (
    <Section id="contact" bordered aria-labelledby="contact-heading">
      <div className="mx-auto max-w-2xl">
        <SectionHeader align="center" eyebrow={c.badge} title={c.headline} description={c.sub} id="contact-heading" />
        <div className="card p-6 md:p-8">
          <ContactForm />
        </div>
      </div>
    </Section>
  );
}
