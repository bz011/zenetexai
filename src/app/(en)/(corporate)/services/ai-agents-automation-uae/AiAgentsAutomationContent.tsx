"use client";

import Link from "@/components/LocaleLink";
import { useLang } from "@/lib/LanguageContext";
import RelatedLinkRow from "@/components/RelatedLinkRow";
import AgentFlowSection from "@/components/flow/AgentFlowSection";
import PageHero from "@/components/ui/PageHero";

export default function AiAgentsAutomationContent() {
  const { t } = useLang();
  const a = t.aiAgentsAutomation;

  return (
    <div className="min-h-screen ux-page">
      {/* Hero */}
      <PageHero eyebrow={a.hero_eyebrow} title={a.hero_h1} sub={a.hero_sub} actions={<><Link href="/contact" className="btn-primary">{a.hero_cta1}</Link><Link href="#use-cases" className="btn-secondary">{a.hero_cta2}</Link></>} />

      <AgentFlowSection />

      {/* AI Agent vs Chatbot */}
      <section className="px-6 py-16 md:py-24">
        <div className="container-page">
          <div className="mb-12 text-center">
            <h2 className="text-h2 text-ink">{a.compare_h2}</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="card p-8">
              <span className="label text-caption">{a.compare_chatbot_label}</span>
              <p className="mt-3 text-body leading-relaxed text-ink-2">{a.compare_chatbot_desc}</p>
            </div>
            <div className="card p-8 border-accent/40">
              <span className="label text-caption text-accent-fg">{a.compare_agent_label}</span>
              <p className="mt-3 text-body leading-relaxed text-ink-2">{a.compare_agent_desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* What ZentexAI Can Automate */}
      <section className="border-t border-line bg-surface-1/50 px-6 py-16 md:py-24">
        <div className="container-page">
          <div className="mb-10 max-w-2xl">
            <span className="label">{a.automate_eyebrow}</span>
            <h2 className="mt-3 text-h2 text-ink">{a.automate_h2}</h2>
            <p className="mt-3 text-body leading-relaxed text-ink-2">{a.automate_sub}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {a.automate_cards.map((card) => (
              <div key={card.title} className="card card-hover p-6">
                <h3 className="text-body font-semibold text-ink">{card.title}</h3>
                <p className="mt-2 text-small leading-relaxed text-ink-2">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 py-16 md:py-24">
        <div className="container-page">
          <div className="mb-12 text-center">
            <span className="label">{a.how_eyebrow}</span>
            <h2 className="mx-auto mt-3 max-w-2xl text-h2 text-ink">{a.how_h2}</h2>
            <p className="mx-auto mt-3 max-w-lg text-body leading-relaxed text-ink-2">{a.how_sub}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {a.how_steps.map((step) => (
              <div key={step.step} className="card p-6">
                <div className="mb-3 text-3xl font-black text-accent-fg">{step.step}</div>
                <h3 className="text-body font-semibold text-ink">{step.title}</h3>
                <p className="mt-1.5 text-small leading-relaxed text-ink-2">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security & Control */}
      <section className="border-t border-line bg-surface-1/50 px-6 py-16 md:py-24">
        <div className="container-page">
          <div className="mb-10 max-w-2xl">
            <span className="label">{a.security_eyebrow}</span>
            <h2 className="mt-3 text-h2 text-ink">{a.security_h2}</h2>
            <p className="mt-3 text-body leading-relaxed text-ink-2">{a.security_sub}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {a.security_points.map((point) => (
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

      {/* UAE Business Use Cases */}
      <section id="use-cases" className="px-6 py-16 md:py-24">
        <div className="container-page">
          <div className="mb-12 max-w-xl">
            <span className="label">{a.usecases_eyebrow}</span>
            <h2 className="mt-3 text-h2 text-ink">{a.usecases_h2}</h2>
            <p className="mt-3 text-body leading-relaxed text-ink-2">{a.usecases_sub}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {a.usecases.map((uc) => (
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
          <div className="mb-12 text-center">
            <span className="label">{a.process_eyebrow}</span>
            <h2 className="mt-3 text-h2 text-ink">{a.process_h2}</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {a.process.map((p) => (
              <div key={p.step} className="card p-6">
                <div className="mb-3 text-3xl font-black text-accent-fg">{p.step}</div>
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
            <span className="label">{a.faq_eyebrow}</span>
            <h2 className="mt-3 text-h2 text-ink">{a.faq_h2}</h2>
          </div>
          <div className="space-y-4">
            {a.faq.map((item) => (
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
              { href: "/services/whatsapp-automation-uae", en: "WhatsApp Automation & AI Agents UAE", ar: "أتمتة واتساب ووكلاء الذكاء الاصطناعي في الإمارات" },
              { href: "/services/machine-learning-uae", en: "Machine Learning Services UAE", ar: "خدمات تعلّم الآلة في الإمارات" },
              { href: "/services/data-analytics-uae", en: "Data Analytics Services UAE", ar: "خدمات تحليل البيانات في الإمارات" },
              { href: "/services/power-bi-consulting-uae", en: "Power BI Consulting UAE", ar: "استشارات Power BI في الإمارات" },
              { href: "/blog/ai-agents-for-business-uae", en: "AI Agents for Business in the UAE" },
              { href: "/blog/whatsapp-automation-uae-businesses", en: "WhatsApp Automation for UAE Businesses" },
              { href: "/blog/ai-automation-clinics-service-businesses", en: "AI Automation for Clinics and Service Businesses" },
              { href: "/blog/is-your-business-ready-for-ai-automation", en: "Is Your Business Ready for AI Automation?" },
            ]} />
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-line px-6 py-16 md:py-24 text-center">
        <div className="container-page">
          <div className="mx-auto max-w-xl">
            <h2 className="text-h2 text-ink">{a.cta_h2}</h2>
            <p className="mx-auto mt-3 max-w-md text-body text-ink-2">{a.cta_sub}</p>
            <div className="mt-7 flex justify-center">
              <Link href="/contact" className="btn-primary">{a.cta_btn}</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
