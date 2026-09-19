"use client";

import Link from "@/components/LocaleLink";
import { useLang } from "@/lib/LanguageContext";
import type { ServiceLandingCopy } from "@/lib/serviceLandingCopy";

type Key = "dataAnalytics" | "powerBi";

export default function ServiceLandingContent({ copyKey }: { copyKey: Key }) {
  const { t } = useLang();
  const c: ServiceLandingCopy = t[copyKey];

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden border-b border-white/[0.06] px-6 pb-24 pt-36">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/[0.1] blur-[120px]" />
        <div className="container-page relative text-center">
          <span className="label">{c.hero_eyebrow}</span>
          <h1 className="mx-auto mt-3 max-w-3xl text-4xl font-bold text-white md:text-5xl lg:text-6xl">{c.hero_h1}</h1>
          <p className="mx-auto mt-5 max-w-xl text-[16px] leading-relaxed text-slate-400">{c.hero_sub}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/contact" className="btn-primary">{c.hero_cta1}</Link>
            <Link href="#deliverables" className="btn-secondary">{c.hero_cta2}</Link>
          </div>
        </div>
      </section>

      <section className="px-6 py-24">
        <div className="container-page">
          <div className="mb-12 max-w-lg">
            <span className="label">{c.audience_eyebrow}</span>
            <h2 className="mt-3 text-2xl font-bold text-white md:text-3xl">{c.audience_h2}</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-slate-400">{c.audience_sub}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {c.audience.map((a) => (
              <div key={a.title} className="flex items-start gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] p-5">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                <div>
                  <h3 className="text-[14px] font-semibold text-white">{a.title}</h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-slate-400">{a.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="deliverables" className="border-t border-white/[0.06] bg-white/[0.015] px-6 py-24">
        <div className="container-page">
          <div className="mb-12 max-w-lg">
            <span className="label">{c.deliverables_eyebrow}</span>
            <h2 className="mt-3 text-2xl font-bold text-white md:text-3xl">{c.deliverables_h2}</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-slate-400">{c.deliverables_sub}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {c.deliverables.map((d) => (
              <div key={d.title} className="card card-hover p-6">
                <h3 className="text-[15px] font-semibold text-white">{d.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-slate-400">{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-24">
        <div className="container-page">
          <div className="mb-12 max-w-lg">
            <span className="label">{c.usecases_eyebrow}</span>
            <h2 className="mt-3 text-2xl font-bold text-white md:text-3xl">{c.usecases_h2}</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-slate-400">{c.usecases_sub}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {c.usecases.map((u) => (
              <div key={u.title} className="card p-6">
                <h3 className="text-[15px] font-semibold text-white">{u.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-slate-400">{u.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/[0.06] bg-white/[0.015] px-6 py-24">
        <div className="container-page">
          <div className="mb-12 text-center">
            <span className="label">{c.process_eyebrow}</span>
            <h2 className="mx-auto mt-3 max-w-2xl text-2xl font-bold text-white md:text-3xl">{c.process_h2}</h2>
            <p className="mx-auto mt-3 max-w-lg text-[15px] leading-relaxed text-slate-400">{c.process_sub}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {c.process.map((p) => (
              <div key={p.step} className="card p-5">
                <div className="mb-2.5 text-2xl font-black text-violet-500/30">{p.step}</div>
                <h3 className="text-[14px] font-semibold text-white">{p.title}</h3>
                <p className="mt-1.5 text-[12px] leading-relaxed text-slate-400">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-24">
        <div className="container-page max-w-3xl">
          <div className="mb-12 text-center">
            <span className="label">{c.faq_eyebrow}</span>
            <h2 className="mt-3 text-2xl font-bold text-white md:text-3xl">{c.faq_h2}</h2>
          </div>
          <div className="space-y-4">
            {c.faq.map((item) => (
              <div key={item.q} className="card p-6">
                <h3 className="text-[15px] font-semibold text-white">{item.q}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-slate-400">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/[0.06] bg-white/[0.015] px-6 py-20">
        <div className="container-page">
          <div className="mb-8 text-center">
            <span className="label">{c.related_eyebrow}</span>
            <h2 className="mt-3 text-xl font-bold text-white">{c.related_h2}</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {c.related.map((r) => (
              <Link key={r.href} href={r.href} className="card card-hover block p-5">
                <h3 className="text-[14px] font-semibold text-white">{r.title}</h3>
                <p className="mt-1.5 text-[12px] leading-relaxed text-slate-400">{r.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/[0.06] px-6 py-24 text-center">
        <div className="container-page">
          <div className="mx-auto max-w-xl">
            <h2 className="text-2xl font-bold text-white md:text-3xl">{c.cta_h2}</h2>
            <p className="mx-auto mt-3 max-w-md text-[15px] text-slate-400">{c.cta_sub}</p>
            <div className="mt-7 flex justify-center">
              <Link href="/contact" className="btn-primary">{c.cta_btn}</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
