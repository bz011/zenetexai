"use client";

import Link from "next/link";
import { useLang } from "@/lib/LanguageContext";

export default function AiAgentsAutomationContent() {
  const { t } = useLang();
  const a = t.aiAgentsAutomation;

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/[0.06] px-6 pb-24 pt-36">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/[0.1] blur-[120px]" />
        <div className="container-page relative text-center">
          <span className="label">{a.hero_eyebrow}</span>
          <h1 className="mx-auto mt-3 max-w-3xl text-4xl font-bold text-white md:text-5xl lg:text-6xl">{a.hero_h1}</h1>
          <p className="mx-auto mt-5 max-w-xl text-[16px] leading-relaxed text-slate-400">{a.hero_sub}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/contact" className="btn-primary">{a.hero_cta1}</Link>
            <Link href="#use-cases" className="btn-secondary">{a.hero_cta2}</Link>
          </div>
        </div>
      </section>

      {/* AI Agent vs Chatbot */}
      <section className="px-6 py-24">
        <div className="container-page">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-bold text-white md:text-3xl">{a.compare_h2}</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="card p-8">
              <span className="label text-[10px]">{a.compare_chatbot_label}</span>
              <p className="mt-3 text-[14px] leading-relaxed text-slate-400">{a.compare_chatbot_desc}</p>
            </div>
            <div className="card p-8 border-indigo-500/30">
              <span className="label text-[10px] text-indigo-400">{a.compare_agent_label}</span>
              <p className="mt-3 text-[14px] leading-relaxed text-slate-300">{a.compare_agent_desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* What ZentexAI Can Automate */}
      <section className="border-t border-white/[0.06] bg-white/[0.015] px-6 py-24">
        <div className="container-page">
          <div className="mb-12 max-w-lg">
            <span className="label">{a.automate_eyebrow}</span>
            <h2 className="mt-3 text-2xl font-bold text-white md:text-3xl">{a.automate_h2}</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-slate-400">{a.automate_sub}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {a.automate_cards.map((card) => (
              <div key={card.title} className="card card-hover p-6">
                <h3 className="text-[15px] font-semibold text-white">{card.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-slate-400">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 py-24">
        <div className="container-page">
          <div className="mb-12 text-center">
            <span className="label">{a.how_eyebrow}</span>
            <h2 className="mx-auto mt-3 max-w-2xl text-2xl font-bold text-white md:text-3xl">{a.how_h2}</h2>
            <p className="mx-auto mt-3 max-w-lg text-[15px] leading-relaxed text-slate-400">{a.how_sub}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {a.how_steps.map((step) => (
              <div key={step.step} className="card p-6">
                <div className="mb-3 text-3xl font-black text-indigo-500/30">{step.step}</div>
                <h3 className="text-[15px] font-semibold text-white">{step.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-slate-400">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security & Control */}
      <section className="border-t border-white/[0.06] bg-white/[0.015] px-6 py-24">
        <div className="container-page">
          <div className="mb-12 max-w-lg">
            <span className="label">{a.security_eyebrow}</span>
            <h2 className="mt-3 text-2xl font-bold text-white md:text-3xl">{a.security_h2}</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-slate-400">{a.security_sub}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {a.security_points.map((point) => (
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

      {/* UAE Business Use Cases */}
      <section id="use-cases" className="px-6 py-24">
        <div className="container-page">
          <div className="mb-12 max-w-xl">
            <span className="label">{a.usecases_eyebrow}</span>
            <h2 className="mt-3 text-2xl font-bold text-white md:text-3xl">{a.usecases_h2}</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-slate-400">{a.usecases_sub}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {a.usecases.map((uc) => (
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
          <div className="mb-12 text-center">
            <span className="label">{a.process_eyebrow}</span>
            <h2 className="mt-3 text-2xl font-bold text-white md:text-3xl">{a.process_h2}</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {a.process.map((p) => (
              <div key={p.step} className="card p-6">
                <div className="mb-3 text-3xl font-black text-indigo-500/30">{p.step}</div>
                <h3 className="text-[15px] font-semibold text-white">{p.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-slate-400">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-24">
        <div className="container-page max-w-3xl">
          <div className="mb-12 text-center">
            <span className="label">{a.faq_eyebrow}</span>
            <h2 className="mt-3 text-2xl font-bold text-white md:text-3xl">{a.faq_h2}</h2>
          </div>
          <div className="space-y-4">
            {a.faq.map((item) => (
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
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-center">
            <Link href="/blog/ai-agents-for-business-uae" className="text-[13px] text-slate-500 transition-colors hover:text-slate-200">
              AI Agents for Business in the UAE
            </Link>
            <Link href="/blog/whatsapp-automation-uae-businesses" className="text-[13px] text-slate-500 transition-colors hover:text-slate-200">
              WhatsApp Automation for UAE Businesses
            </Link>
            <Link href="/blog/ai-automation-clinics-service-businesses" className="text-[13px] text-slate-500 transition-colors hover:text-slate-200">
              AI Automation for Clinics and Service Businesses
            </Link>
            <Link href="/blog/is-your-business-ready-for-ai-automation" className="text-[13px] text-slate-500 transition-colors hover:text-slate-200">
              Is Your Business Ready for AI Automation?
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-white/[0.06] px-6 py-24 text-center">
        <div className="container-page">
          <div className="mx-auto max-w-xl">
            <h2 className="text-2xl font-bold text-white md:text-3xl">{a.cta_h2}</h2>
            <p className="mx-auto mt-3 max-w-md text-[15px] text-slate-400">{a.cta_sub}</p>
            <div className="mt-7 flex justify-center">
              <Link href="/contact" className="btn-primary">{a.cta_btn}</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
