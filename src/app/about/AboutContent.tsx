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
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <span className="label">{ab.mission_eyebrow}</span>
              <h2 className="mt-3 text-3xl font-bold text-white md:text-4xl">
                {ab.mission_h2_line1}
                <br />
                <span className="gradient-text">{ab.mission_h2_line2}</span>
              </h2>
              <p className="mt-5 text-[15px] leading-relaxed text-slate-400">{ab.mission_p1}</p>
              <p className="mt-4 text-[15px] leading-relaxed text-slate-400">{ab.mission_p2}</p>
            </div>

            <div className="space-y-3">
              {ab.pillars.map((p) => (
                <div key={p.label} className="card flex items-center gap-4 p-5">
                  <div className="h-2 w-2 shrink-0 rounded-full bg-indigo-500" />
                  <div>
                    <div className="text-[14px] font-semibold text-white">{p.label}</div>
                    <div className="text-[13px] text-slate-400">{p.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="border-t border-white/[0.06] bg-white/[0.015] px-6 py-24">
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

      {/* Team */}
      <section className="border-t border-white/[0.06] px-6 py-24 text-center">
        <div className="container-page">
          <span className="label">{ab.team_eyebrow}</span>
          <h2 className="mt-3 text-2xl font-bold text-white md:text-3xl">{ab.team_h2}</h2>
          <p className="mx-auto mt-4 max-w-md text-[15px] text-slate-400">{ab.team_p}</p>
          <div className="mx-auto mt-10 grid max-w-xl gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-5 text-center">
                <div className="mx-auto mb-3 h-14 w-14 rounded-full bg-white/[0.05]" />
                <div className="mx-auto h-3 w-24 rounded bg-white/[0.06]" />
                <div className="mx-auto mt-2 h-2.5 w-16 rounded bg-white/[0.04]" />
              </div>
            ))}
          </div>
          <div className="mt-10">
            <Link href="/contact" className="btn-primary">{ab.team_btn}</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
