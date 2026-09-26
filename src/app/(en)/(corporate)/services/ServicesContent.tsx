"use client";

import Link from "@/components/LocaleLink";
import { useLang } from "@/lib/LanguageContext";
import RelatedLinkRow from "@/components/RelatedLinkRow";

export default function ServicesContent() {
  const { t } = useLang();
  const sv = t.services;

  return (
    <div className="min-h-screen ux-page">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/[0.06] px-6 pb-16 md:pb-24 pt-28 md:pt-36">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/[0.1] blur-[120px]" />
        <div className="container-page relative text-center">
          <span className="label">{sv.hero_eyebrow}</span>
          <h1 className="mt-3 text-4xl font-bold text-white md:text-5xl lg:text-6xl">{sv.hero_h1}</h1>
          <p className="mx-auto mt-5 max-w-lg text-lead leading-relaxed text-slate-400">{sv.hero_sub}</p>
        </div>
      </section>

      {/* Categories */}
      <section className="px-6 py-16 md:py-24">
        <div className="container-page space-y-6">
          {sv.categories.map((cat, i) => (
            <div key={cat.id} id={cat.id} className="card p-8 md:p-10">
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div className="md:max-w-sm">
                  <span className="label text-caption">{String(i + 1).padStart(2, "0")}</span>
                  <h2 className="mt-2 text-xl font-semibold text-white md:text-2xl">{cat.title}</h2>
                  <p className="mt-3 text-body leading-relaxed text-slate-400">{cat.desc}</p>
                  {cat.learnMoreHref && cat.learnMoreLabel && (
                    <Link href={cat.learnMoreHref} className="mt-3 block text-small font-medium text-indigo-400 transition-colors hover:text-indigo-300">
                      {cat.learnMoreLabel}
                    </Link>
                  )}
                  {cat.learnMoreHref2 && cat.learnMoreLabel2 && (
                    <Link href={cat.learnMoreHref2} className="mt-1.5 block text-small font-medium text-indigo-400 transition-colors hover:text-indigo-300">
                      {cat.learnMoreLabel2}
                    </Link>
                  )}
                </div>
                <div className="flex flex-1 flex-wrap content-start gap-2.5">
                  {cat.examples.map((ex) => (
                    <span
                      key={ex}
                      className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3.5 py-1.5 text-small text-slate-300"
                    >
                      {ex}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Process */}
      {/* Dedicated service pages */}
      <section className="border-t border-white/[0.06] px-6 py-10 md:py-14">
        <div className="container-page">
          <RelatedLinkRow variant="accent" items={[
              { href: "/services/ai-agents-automation-uae", en: "AI Agents & Automation UAE", ar: "وكلاء الذكاء الاصطناعي والأتمتة في الإمارات" },
              { href: "/services/whatsapp-automation-uae", en: "WhatsApp Automation UAE", ar: "أتمتة واتساب في الإمارات" },
              { href: "/services/machine-learning-uae", en: "Machine Learning Services UAE", ar: "خدمات تعلّم الآلة في الإمارات" },
              { href: "/services/data-analytics-uae", en: "Data Analytics Services UAE", ar: "خدمات تحليل البيانات في الإمارات" },
              { href: "/services/power-bi-consulting-uae", en: "Power BI Consulting UAE", ar: "استشارات Power BI في الإمارات" },
            ]} />
        </div>
      </section>

      <section className="border-t border-white/[0.06] bg-white/[0.015] px-6 py-16 md:py-24">
        <div className="container-page">
          <div className="mb-12 text-center">
            <span className="label">{sv.process_eyebrow}</span>
            <h2 className="mt-3 text-2xl font-bold text-white md:text-3xl">{sv.process_h2}</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {sv.process.map((p) => (
              <div key={p.step} className="card p-6">
                <div className="mb-3 text-3xl font-black text-indigo-500/30">{p.step}</div>
                <h3 className="text-body font-semibold text-white">{p.title}</h3>
                <p className="mt-1.5 text-small leading-relaxed text-slate-400">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/[0.06] px-6 py-16 md:py-24 text-center">
        <div className="container-page">
          <div className="mx-auto max-w-xl">
            <h2 className="text-2xl font-bold text-white md:text-3xl">{sv.cta_h2}</h2>
            <p className="mx-auto mt-3 max-w-md text-body text-slate-400">{sv.cta_p}</p>
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
