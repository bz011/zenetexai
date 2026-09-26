"use client";

import Link from "@/components/LocaleLink";
import { useLang } from "@/lib/LanguageContext";
import RelatedLinkRow from "@/components/RelatedLinkRow";
import PageHero from "@/components/ui/PageHero";

function FlowList({ steps }: { steps: string[] }) {
  return (
    <ol className="mx-auto max-w-md space-y-0">
      {steps.map((step, i) => (
        <li key={step} className="relative pb-6 ps-10 last:pb-0">
          {i < steps.length - 1 && (
            <span className="absolute start-[15px] top-7 h-full w-px bg-surface-2" aria-hidden="true" />
          )}
          <span className="absolute start-0 top-0 flex h-8 w-8 items-center justify-center rounded-full border border-accent/40 bg-accent/10 text-small font-semibold text-accent-fg">
            {i + 1}
          </span>
          <p className="pt-1 text-body leading-relaxed text-ink-2">{step}</p>
        </li>
      ))}
    </ol>
  );
}

export default function WhatsappAutomationContent() {
  const { t } = useLang();
  const w = t.whatsappAutomation;

  return (
    <div className="min-h-screen ux-page">
      {/* Hero */}
      <PageHero eyebrow={w.hero_eyebrow} title={w.hero_h1} sub={w.hero_sub} actions={<><Link href="/contact" className="btn-primary">{w.hero_cta1}</Link><Link href="#automate" className="btn-secondary">{w.hero_cta2}</Link></>} />

      {/* Beyond a Simple Chatbot */}
      <section className="px-6 py-16 md:py-24">
        <div className="container-page">
          <div className="mb-12 text-center">
            <h2 className="text-h2 text-ink">{w.compare_h2}</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="card p-8">
              <span className="label text-caption">{w.compare_chatbot_label}</span>
              <p className="mt-3 text-body leading-relaxed text-ink-2">{w.compare_chatbot_desc}</p>
            </div>
            <div className="card p-8 border-positive/40">
              <span className="label text-caption text-positive">{w.compare_agent_label}</span>
              <p className="mt-3 text-body leading-relaxed text-ink-2">{w.compare_agent_desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* What Can Be Automated */}
      <section id="automate" className="border-t border-line bg-surface-1/50 px-6 py-16 md:py-24">
        <div className="container-page">
          <div className="mb-10 max-w-2xl">
            <span className="label">{w.automate_eyebrow}</span>
            <h2 className="mt-3 text-h2 text-ink">{w.automate_h2}</h2>
            <p className="mt-3 text-body leading-relaxed text-ink-2">{w.automate_sub}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {w.automate_cards.map((card) => (
              <div key={card.title} className="card card-hover p-6">
                <h3 className="text-body font-semibold text-ink">{card.title}</h3>
                <p className="mt-2 text-small leading-relaxed text-ink-2">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Example Workflow */}
      <section className="px-6 py-16 md:py-24">
        <div className="container-page">
          <div className="mb-12 text-center">
            <span className="label">{w.workflow_eyebrow}</span>
            <h2 className="mx-auto mt-3 max-w-2xl text-h2 text-ink">{w.workflow_h2}</h2>
            <p className="mx-auto mt-3 max-w-lg text-body leading-relaxed text-ink-2">{w.workflow_sub}</p>
          </div>
          <FlowList steps={w.workflow_steps} />
        </div>
      </section>

      {/* CRM Integration */}
      <section className="border-t border-line bg-surface-1/50 px-6 py-16 md:py-24">
        <div className="container-page max-w-2xl">
          <span className="label">{w.crm_eyebrow}</span>
          <h2 className="mt-3 text-h2 text-ink">{w.crm_h2}</h2>
          <p className="mt-4 text-body leading-relaxed text-ink-2">{w.crm_p1}</p>
          <p className="mt-3 text-body leading-relaxed text-ink-2">{w.crm_p2}</p>
          <p className="mt-3 text-body leading-relaxed text-ink-2">{w.crm_p3}</p>
          <p className="mt-4 rounded-card border border-line bg-surface-1 p-4 text-small leading-relaxed text-ink-2">{w.crm_note}</p>
        </div>
      </section>

      {/* Appointment Booking */}
      <section className="px-6 py-16 md:py-24">
        <div className="container-page">
          <div className="mb-12 text-center">
            <span className="label">{w.booking_eyebrow}</span>
            <h2 className="mt-3 text-h2 text-ink">{w.booking_h2}</h2>
            <p className="mx-auto mt-3 max-w-lg text-body leading-relaxed text-ink-2">{w.booking_sub}</p>
          </div>
          <FlowList steps={w.booking_steps} />
        </div>
      </section>

      {/* Arabic + English */}
      <section className="border-t border-line bg-surface-1/50 px-6 py-12 md:py-16">
        <div className="container-page max-w-2xl text-center">
          <h2 className="text-xl font-bold text-ink md:text-2xl">{w.lang_h2}</h2>
          <p className="mt-3 text-body leading-relaxed text-ink-2">{w.lang_p}</p>
        </div>
      </section>

      {/* WhatsApp Business Platform */}
      <section className="px-6 py-12 md:py-16">
        <div className="container-page max-w-2xl text-center">
          <h2 className="text-xl font-bold text-ink md:text-2xl">{w.platform_h2}</h2>
          <p className="mt-3 text-body leading-relaxed text-ink-2">{w.platform_p}</p>
        </div>
      </section>

      {/* Security & Control */}
      <section className="border-t border-line bg-surface-1/50 px-6 py-16 md:py-24">
        <div className="container-page">
          <div className="mb-10 max-w-2xl">
            <span className="label">{w.security_eyebrow}</span>
            <h2 className="mt-3 text-h2 text-ink">{w.security_h2}</h2>
            <p className="mt-3 text-body leading-relaxed text-ink-2">{w.security_sub}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {w.security_points.map((point) => (
              <div key={point.title} className="flex items-start gap-3 rounded-card border border-line bg-surface-1 p-5">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-positive" />
                <div>
                  <h3 className="text-body font-semibold text-ink">{point.title}</h3>
                  <p className="mt-1 text-small leading-relaxed text-ink-2">{point.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* UAE Use Cases */}
      <section className="px-6 py-16 md:py-24">
        <div className="container-page">
          <div className="mb-12 max-w-xl">
            <span className="label">{w.usecases_eyebrow}</span>
            <h2 className="mt-3 text-h2 text-ink">{w.usecases_h2}</h2>
            <p className="mt-3 text-body leading-relaxed text-ink-2">{w.usecases_sub}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {w.usecases.map((uc) => (
              <div key={uc.title} className="card card-hover p-6">
                <h3 className="text-body font-semibold text-ink">{uc.title}</h3>
                <p className="mt-2 text-small leading-relaxed text-ink-2">{uc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Implementation Process */}
      <section className="border-t border-line bg-surface-1/50 px-6 py-16 md:py-24">
        <div className="container-page">
          <div className="mb-8 text-center">
            <span className="label">{w.process_eyebrow}</span>
            <h2 className="mt-3 text-h2 text-ink">{w.process_h2}</h2>
            <p className="mx-auto mt-3 max-w-xl text-body leading-relaxed text-ink-2">{w.process_sub}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7">
            {w.process.map((p) => (
              <div key={p.step} className="card p-5">
                <div className="mb-2.5 text-2xl font-black text-emerald-500/30">{p.step}</div>
                <h3 className="text-body font-semibold text-ink">{p.title}</h3>
                <p className="mt-1.5 text-small leading-relaxed text-ink-2">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-16 md:py-24">
        <div className="container-page max-w-3xl">
          <div className="mb-12 text-center">
            <span className="label">{w.faq_eyebrow}</span>
            <h2 className="mt-3 text-h2 text-ink">{w.faq_h2}</h2>
          </div>
          <div className="space-y-4">
            {w.faq.map((item) => (
              <div key={item.q} className="card p-6">
                <h3 className="text-body font-semibold text-ink">{item.q}</h3>
                <p className="mt-2 text-body leading-relaxed text-ink-2">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Internal links to related content */}
      <section className="border-t border-line px-6 py-12 md:py-16">
        <div className="container-page">
          <RelatedLinkRow items={[
              { href: "/services/ai-agents-automation-uae", en: "AI Agents & Automation UAE", ar: "وكلاء الذكاء الاصطناعي والأتمتة في الإمارات" },
              { href: "/services/data-analytics-uae", en: "Data Analytics Services UAE", ar: "خدمات تحليل البيانات في الإمارات" },
              { href: "/blog/whatsapp-automation-uae-businesses", en: "WhatsApp Automation for UAE Businesses" },
              { href: "/blog/ai-agents-for-business-uae", en: "AI Agents for Business in the UAE" },
              { href: "/blog/ai-automation-clinics-service-businesses", en: "AI Automation for Clinics and Service Businesses" },
            ]} />
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-line px-6 py-16 md:py-24 text-center">
        <div className="container-page">
          <div className="mx-auto max-w-xl">
            <h2 className="text-h2 text-ink">{w.cta_h2}</h2>
            <p className="mx-auto mt-3 max-w-md text-body text-ink-2">{w.cta_sub}</p>
            <div className="mt-7 flex justify-center">
              <Link href="/contact" className="btn-primary">{w.cta_btn}</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
