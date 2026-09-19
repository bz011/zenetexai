"use client";

import Link from "@/components/LocaleLink";
import { useLang } from "@/lib/LanguageContext";
import RelatedLinkRow from "@/components/RelatedLinkRow";

function FlowList({ steps }: { steps: string[] }) {
  return (
    <ol className="mx-auto max-w-md space-y-0">
      {steps.map((step, i) => (
        <li key={step} className="relative pb-6 ps-10 last:pb-0">
          {i < steps.length - 1 && (
            <span className="absolute start-[15px] top-7 h-full w-px bg-white/[0.08]" aria-hidden="true" />
          )}
          <span className="absolute start-0 top-0 flex h-8 w-8 items-center justify-center rounded-full border border-indigo-500/30 bg-indigo-500/10 text-[12px] font-semibold text-indigo-400">
            {i + 1}
          </span>
          <p className="pt-1 text-[14px] leading-relaxed text-slate-300">{step}</p>
        </li>
      ))}
    </ol>
  );
}

export default function WhatsappAutomationContent() {
  const { t } = useLang();
  const w = t.whatsappAutomation;

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/[0.06] px-6 pb-24 pt-36">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-600/[0.1] blur-[120px]" />
        <div className="container-page relative text-center">
          <span className="label">{w.hero_eyebrow}</span>
          <h1 className="mx-auto mt-3 max-w-3xl text-4xl font-bold text-white md:text-5xl lg:text-6xl">{w.hero_h1}</h1>
          <p className="mx-auto mt-5 max-w-xl text-[16px] leading-relaxed text-slate-400">{w.hero_sub}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/contact" className="btn-primary">{w.hero_cta1}</Link>
            <Link href="#automate" className="btn-secondary">{w.hero_cta2}</Link>
          </div>
        </div>
      </section>

      {/* Beyond a Simple Chatbot */}
      <section className="px-6 py-24">
        <div className="container-page">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-bold text-white md:text-3xl">{w.compare_h2}</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="card p-8">
              <span className="label text-[10px]">{w.compare_chatbot_label}</span>
              <p className="mt-3 text-[14px] leading-relaxed text-slate-400">{w.compare_chatbot_desc}</p>
            </div>
            <div className="card p-8 border-emerald-500/30">
              <span className="label text-[10px] text-emerald-400">{w.compare_agent_label}</span>
              <p className="mt-3 text-[14px] leading-relaxed text-slate-300">{w.compare_agent_desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* What Can Be Automated */}
      <section id="automate" className="border-t border-white/[0.06] bg-white/[0.015] px-6 py-24">
        <div className="container-page">
          <div className="mb-12 max-w-lg">
            <span className="label">{w.automate_eyebrow}</span>
            <h2 className="mt-3 text-2xl font-bold text-white md:text-3xl">{w.automate_h2}</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-slate-400">{w.automate_sub}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {w.automate_cards.map((card) => (
              <div key={card.title} className="card card-hover p-6">
                <h3 className="text-[15px] font-semibold text-white">{card.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-slate-400">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Example Workflow */}
      <section className="px-6 py-24">
        <div className="container-page">
          <div className="mb-12 text-center">
            <span className="label">{w.workflow_eyebrow}</span>
            <h2 className="mx-auto mt-3 max-w-2xl text-2xl font-bold text-white md:text-3xl">{w.workflow_h2}</h2>
            <p className="mx-auto mt-3 max-w-lg text-[15px] leading-relaxed text-slate-400">{w.workflow_sub}</p>
          </div>
          <FlowList steps={w.workflow_steps} />
        </div>
      </section>

      {/* CRM Integration */}
      <section className="border-t border-white/[0.06] bg-white/[0.015] px-6 py-24">
        <div className="container-page max-w-2xl">
          <span className="label">{w.crm_eyebrow}</span>
          <h2 className="mt-3 text-2xl font-bold text-white md:text-3xl">{w.crm_h2}</h2>
          <p className="mt-4 text-[14px] leading-relaxed text-slate-400">{w.crm_p1}</p>
          <p className="mt-3 text-[14px] leading-relaxed text-slate-400">{w.crm_p2}</p>
          <p className="mt-3 text-[14px] leading-relaxed text-slate-400">{w.crm_p3}</p>
          <p className="mt-4 rounded-xl border border-white/[0.07] bg-white/[0.03] p-4 text-[13px] leading-relaxed text-slate-500">{w.crm_note}</p>
        </div>
      </section>

      {/* Appointment Booking */}
      <section className="px-6 py-24">
        <div className="container-page">
          <div className="mb-12 text-center">
            <span className="label">{w.booking_eyebrow}</span>
            <h2 className="mt-3 text-2xl font-bold text-white md:text-3xl">{w.booking_h2}</h2>
            <p className="mx-auto mt-3 max-w-lg text-[15px] leading-relaxed text-slate-400">{w.booking_sub}</p>
          </div>
          <FlowList steps={w.booking_steps} />
        </div>
      </section>

      {/* Arabic + English */}
      <section className="border-t border-white/[0.06] bg-white/[0.015] px-6 py-16">
        <div className="container-page max-w-2xl text-center">
          <h2 className="text-xl font-bold text-white md:text-2xl">{w.lang_h2}</h2>
          <p className="mt-3 text-[14px] leading-relaxed text-slate-400">{w.lang_p}</p>
        </div>
      </section>

      {/* WhatsApp Business Platform */}
      <section className="px-6 py-16">
        <div className="container-page max-w-2xl text-center">
          <h2 className="text-xl font-bold text-white md:text-2xl">{w.platform_h2}</h2>
          <p className="mt-3 text-[14px] leading-relaxed text-slate-400">{w.platform_p}</p>
        </div>
      </section>

      {/* Security & Control */}
      <section className="border-t border-white/[0.06] bg-white/[0.015] px-6 py-24">
        <div className="container-page">
          <div className="mb-12 max-w-lg">
            <span className="label">{w.security_eyebrow}</span>
            <h2 className="mt-3 text-2xl font-bold text-white md:text-3xl">{w.security_h2}</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-slate-400">{w.security_sub}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {w.security_points.map((point) => (
              <div key={point.title} className="flex items-start gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] p-5">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                <div>
                  <h3 className="text-[14px] font-semibold text-white">{point.title}</h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-slate-400">{point.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* UAE Use Cases */}
      <section className="px-6 py-24">
        <div className="container-page">
          <div className="mb-12 max-w-xl">
            <span className="label">{w.usecases_eyebrow}</span>
            <h2 className="mt-3 text-2xl font-bold text-white md:text-3xl">{w.usecases_h2}</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-slate-400">{w.usecases_sub}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {w.usecases.map((uc) => (
              <div key={uc.title} className="card card-hover p-6">
                <h3 className="text-[15px] font-semibold text-white">{uc.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-slate-400">{uc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Implementation Process */}
      <section className="border-t border-white/[0.06] bg-white/[0.015] px-6 py-24">
        <div className="container-page">
          <div className="mb-8 text-center">
            <span className="label">{w.process_eyebrow}</span>
            <h2 className="mt-3 text-2xl font-bold text-white md:text-3xl">{w.process_h2}</h2>
            <p className="mx-auto mt-3 max-w-xl text-[14px] leading-relaxed text-slate-500">{w.process_sub}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7">
            {w.process.map((p) => (
              <div key={p.step} className="card p-5">
                <div className="mb-2.5 text-2xl font-black text-emerald-500/30">{p.step}</div>
                <h3 className="text-[14px] font-semibold text-white">{p.title}</h3>
                <p className="mt-1.5 text-[12px] leading-relaxed text-slate-400">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-24">
        <div className="container-page max-w-3xl">
          <div className="mb-12 text-center">
            <span className="label">{w.faq_eyebrow}</span>
            <h2 className="mt-3 text-2xl font-bold text-white md:text-3xl">{w.faq_h2}</h2>
          </div>
          <div className="space-y-4">
            {w.faq.map((item) => (
              <div key={item.q} className="card p-6">
                <h3 className="text-[15px] font-semibold text-white">{item.q}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-slate-400">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Internal links to related content */}
      <section className="border-t border-white/[0.06] px-6 py-16">
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
      <section className="border-t border-white/[0.06] px-6 py-24 text-center">
        <div className="container-page">
          <div className="mx-auto max-w-xl">
            <h2 className="text-2xl font-bold text-white md:text-3xl">{w.cta_h2}</h2>
            <p className="mx-auto mt-3 max-w-md text-[15px] text-slate-400">{w.cta_sub}</p>
            <div className="mt-7 flex justify-center">
              <Link href="/contact" className="btn-primary">{w.cta_btn}</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
