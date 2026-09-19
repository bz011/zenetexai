"use client";

import Link from "next/link";
import { useLang } from "@/lib/LanguageContext";

export default function MachineLearningContent() {
  const { t } = useLang();
  const m = t.machineLearning;

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/[0.06] px-6 pb-24 pt-36">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/[0.1] blur-[120px]" />
        <div className="container-page relative text-center">
          <span className="label">{m.hero_eyebrow}</span>
          <h1 className="mx-auto mt-3 max-w-3xl text-4xl font-bold text-white md:text-5xl lg:text-6xl">{m.hero_h1}</h1>
          <p className="mx-auto mt-5 max-w-xl text-[16px] leading-relaxed text-slate-400">{m.hero_sub}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/contact" className="btn-primary">{m.hero_cta1}</Link>
            <Link href="#use-cases" className="btn-secondary">{m.hero_cta2}</Link>
          </div>
        </div>
      </section>

      {/* Fit First */}
      <section className="px-6 py-24">
        <div className="container-page">
          <div className="mb-12 max-w-lg">
            <span className="label">{m.fit_eyebrow}</span>
            <h2 className="mt-3 text-2xl font-bold text-white md:text-3xl">{m.fit_h2}</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-slate-400">{m.fit_sub}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {m.fit_points.map((point) => (
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

      {/* Potential Use Cases */}
      <section id="use-cases" className="border-t border-white/[0.06] bg-white/[0.015] px-6 py-24">
        <div className="container-page">
          <div className="mb-12 max-w-lg">
            <span className="label">{m.usecases_eyebrow}</span>
            <h2 className="mt-3 text-2xl font-bold text-white md:text-3xl">{m.usecases_h2}</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-slate-400">{m.usecases_sub}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {m.usecases.map((uc) => (
              <div key={uc.title} className="card card-hover p-6">
                <h3 className="text-[15px] font-semibold text-white">{uc.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-slate-400">{uc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How We Work */}
      <section className="px-6 py-24">
        <div className="container-page">
          <div className="mb-12 text-center">
            <span className="label">{m.process_eyebrow}</span>
            <h2 className="mx-auto mt-3 max-w-2xl text-2xl font-bold text-white md:text-3xl">{m.process_h2}</h2>
            <p className="mx-auto mt-3 max-w-lg text-[15px] leading-relaxed text-slate-400">{m.process_sub}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {m.process.map((p) => (
              <div key={p.step} className="card p-5">
                <div className="mb-2.5 text-2xl font-black text-violet-500/30">{p.step}</div>
                <h3 className="text-[14px] font-semibold text-white">{p.title}</h3>
                <p className="mt-1.5 text-[12px] leading-relaxed text-slate-400">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Machine Learning vs. AI Agents & Automation */}
      <section className="border-t border-white/[0.06] bg-white/[0.015] px-6 py-24">
        <div className="container-page">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-bold text-white md:text-3xl">{m.compare_h2}</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="card p-8">
              <span className="label text-[10px]">{m.compare_ml_label}</span>
              <p className="mt-3 text-[14px] leading-relaxed text-slate-300">{m.compare_ml_desc}</p>
            </div>
            <div className="card p-8">
              <span className="label text-[10px]">{m.compare_agents_label}</span>
              <p className="mt-3 text-[14px] leading-relaxed text-slate-400">{m.compare_agents_desc}</p>
            </div>
          </div>
          <div className="mt-6 text-center">
            <Link href="/services/ai-agents-automation-uae" className="text-[13px] font-medium text-indigo-400 transition-colors hover:text-indigo-300">
              {m.compare_link_label} →
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-24">
        <div className="container-page max-w-3xl">
          <div className="mb-12 text-center">
            <span className="label">{m.faq_eyebrow}</span>
            <h2 className="mt-3 text-2xl font-bold text-white md:text-3xl">{m.faq_h2}</h2>
          </div>
          <div className="space-y-4">
            {m.faq.map((item) => (
              <div key={item.q} className="card p-6">
                <h3 className="text-[15px] font-semibold text-white">{item.q}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-slate-400">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Related services and reading */}
      <section className="border-t border-white/[0.06] px-6 py-16">
        <div className="container-page">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-center">
            <Link href="/services/data-analytics-uae" className="text-[13px] text-slate-500 transition-colors hover:text-slate-200">
              Data Analytics Services UAE
            </Link>
            <Link href="/services/power-bi-consulting-uae" className="text-[13px] text-slate-500 transition-colors hover:text-slate-200">
              Power BI Consulting UAE
            </Link>
            <Link href="/services/ai-agents-automation-uae" className="text-[13px] text-slate-500 transition-colors hover:text-slate-200">
              AI Agents &amp; Automation UAE
            </Link>
            <Link href="/blog" className="text-[13px] text-slate-500 transition-colors hover:text-slate-200">
              ZentexAI Blog
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-white/[0.06] px-6 py-24 text-center">
        <div className="container-page">
          <div className="mx-auto max-w-xl">
            <h2 className="text-2xl font-bold text-white md:text-3xl">{m.cta_h2}</h2>
            <p className="mx-auto mt-3 max-w-md text-[15px] text-slate-400">{m.cta_sub}</p>
            <div className="mt-7 flex justify-center">
              <Link href="/contact" className="btn-primary">{m.cta_btn}</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
