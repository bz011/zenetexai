"use client";

import Link from "next/link";
import { useLang } from "@/lib/LanguageContext";

export default function ServicesContent() {
  const { t } = useLang();
  const sv = t.services;
  const s = t.shared;

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/[0.06] px-6 pb-24 pt-36">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/[0.1] blur-[120px]" />
        <div className="container-page relative text-center">
          <span className="label">{sv.hero_eyebrow}</span>
          <h1 className="mt-3 text-4xl font-bold text-white md:text-5xl lg:text-6xl">{sv.hero_h1}</h1>
          <p className="mx-auto mt-5 max-w-lg text-[16px] leading-relaxed text-slate-400">{sv.hero_sub}</p>
        </div>
      </section>

      {/* Cards */}
      <section className="px-6 py-24">
        <div className="container-page">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sv.cards.map((card) => (
              <div key={card.title} className="card card-hover group p-7">
                <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/[0.08] text-lg text-indigo-400">
                  {card.icon}
                </div>
                <span className="label text-[10px]">{card.tag}</span>
                <h3 className="mt-2 text-[16px] font-semibold text-white group-hover:text-indigo-300 transition-colors">
                  {card.title}
                </h3>
                <p className="mt-2.5 text-[13px] leading-relaxed text-slate-400">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="border-t border-white/[0.06] bg-white/[0.015] px-6 py-24">
        <div className="container-page">
          <div className="mb-12 text-center">
            <span className="label">{sv.process_eyebrow}</span>
            <h2 className="mt-3 text-2xl font-bold text-white md:text-3xl">{sv.process_h2}</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {sv.process.map((p) => (
              <div key={p.step} className="card p-6">
                <div className="mb-3 text-3xl font-black text-indigo-500/30">{p.step}</div>
                <h3 className="text-[15px] font-semibold text-white">{p.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-slate-400">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/[0.06] px-6 py-24 text-center">
        <div className="container-page">
          <div className="mx-auto max-w-xl">
            <h2 className="text-2xl font-bold text-white md:text-3xl">{sv.cta_h2}</h2>
            <p className="mx-auto mt-3 max-w-md text-[15px] text-slate-400">{sv.cta_p}</p>
            <div className="mt-7 flex justify-center gap-3">
              <Link href="/contact" className="btn-primary">{sv.cta_btn1}</Link>
              <Link href="/about" className="btn-secondary">{sv.cta_btn2}</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
