"use client";

import Link from "next/link";
import { useLang } from "@/lib/LanguageContext";

export default function AboutContent() {
  const { t } = useLang();
  const ab = t.about;

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/[0.06] px-6 pb-24 pt-36">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/[0.1] blur-[120px]" />
        <div className="container-page relative text-center">
          <span className="label">{ab.hero_eyebrow}</span>
          <h1 className="mt-3 text-4xl font-bold text-white md:text-5xl lg:text-6xl">{ab.hero_h1}</h1>
          <p className="mx-auto mt-5 max-w-lg text-[16px] leading-relaxed text-slate-400">{ab.hero_sub}</p>
        </div>
      </section>

      {/* Mission */}
      <section className="px-6 py-24">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <span className="label">{ab.mission_eyebrow}</span>
            <h2 className="mt-3 text-3xl font-bold text-white md:text-4xl">
              {ab.mission_h2_line1}
              <br />
              <span className="gradient-text">{ab.mission_h2_line2}</span>
            </h2>
            <p className="mt-5 text-[15px] leading-relaxed text-slate-400">{ab.mission_p1}</p>
            <p className="mt-4 text-[15px] leading-relaxed text-slate-400">{ab.mission_p2}</p>
          </div>
        </div>
      </section>

      {/* Vision */}
      <section className="border-t border-white/[0.06] bg-white/[0.015] px-6 py-24">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <span className="label">{ab.vision_eyebrow}</span>
            <h2 className="mt-3 text-2xl font-bold text-white md:text-3xl">{ab.vision_h2}</h2>
            <p className="mt-5 text-[15px] leading-relaxed text-slate-400">{ab.vision_p}</p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="px-6 py-24">
        <div className="container-page">
          <div className="mb-10 text-center">
            <span className="label">{ab.values_eyebrow}</span>
            <h2 className="mt-3 text-2xl font-bold text-white md:text-3xl">{ab.values_h2}</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {ab.values.map((v) => (
              <div key={v.title} className="card p-7 text-center">
                <div className="mx-auto mb-4 h-px w-10 bg-gradient-to-r from-indigo-500 to-violet-500" />
                <h3 className="text-[15px] font-semibold text-indigo-300">{v.title}</h3>
                <p className="mt-2.5 text-[13px] leading-relaxed text-slate-400">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Founder */}
      <section className="border-t border-white/[0.06] bg-white/[0.015] px-6 py-24">
        <div className="container-page">
          <div className="mb-10 text-center">
            <span className="label">{ab.founder_eyebrow}</span>
            <h2 className="mt-3 text-2xl font-bold text-white md:text-3xl">{ab.founder_h2}</h2>
          </div>

          <div className="mx-auto max-w-2xl">
            <div className="card p-8 md:p-10">
              <div className="flex flex-col items-center gap-6 text-center md:flex-row md:items-start md:text-start">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-2xl font-bold text-white">
                  {ab.founder.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-[18px] font-semibold text-white">{ab.founder.name}</h3>
                  <div className="mt-2 flex flex-wrap justify-center gap-2 md:justify-start">
                    {ab.founder.titles.map((title) => (
                      <span key={title} className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[11px] text-slate-400">
                        {title}
                      </span>
                    ))}
                  </div>
                  <p className="mt-4 text-[14px] leading-relaxed text-slate-400">{ab.founder.bio}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/[0.06] px-6 py-24 text-center">
        <div className="container-page">
          <span className="label">{ab.cta_h2}</span>
          <p className="mx-auto mt-4 max-w-md text-[15px] text-slate-400">{ab.cta_p}</p>
          <div className="mt-8">
            <Link href="/contact" className="btn-primary">{ab.cta_btn}</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
