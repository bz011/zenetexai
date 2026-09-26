"use client";

import Link from "next/link";
import { useLang } from "@/lib/LanguageContext";
import PageHero from "@/components/ui/PageHero";

export default function AboutContent() {
  const { t } = useLang();
  const ab = t.about;

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <PageHero eyebrow={ab.hero_eyebrow} title={ab.hero_h1} sub={ab.hero_sub} />

      {/* Mission */}
      <section className="px-6 py-24">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <span className="label">{ab.mission_eyebrow}</span>
            <h2 className="mt-3 text-h2 text-ink">
              {ab.mission_h2_line1}
              <br />
              <span className="gradient-text">{ab.mission_h2_line2}</span>
            </h2>
            <p className="mt-5 text-[15px] leading-relaxed text-ink-2">{ab.mission_p1}</p>
            <p className="mt-4 text-[15px] leading-relaxed text-ink-2">{ab.mission_p2}</p>
          </div>
        </div>
      </section>

      {/* Vision */}
      <section className="border-t border-line bg-surface-1/50 px-6 py-24">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <span className="label">{ab.vision_eyebrow}</span>
            <h2 className="mt-3 text-h2 text-ink">{ab.vision_h2}</h2>
            <p className="mt-5 text-[15px] leading-relaxed text-ink-2">{ab.vision_p}</p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="px-6 py-24">
        <div className="container-page">
          <div className="mb-10 text-center">
            <span className="label">{ab.values_eyebrow}</span>
            <h2 className="mt-3 text-h2 text-ink">{ab.values_h2}</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {ab.values.map((v) => (
              <div key={v.title} className="card p-7 text-center">
                <div className="mx-auto mb-4 h-px w-10 bg-accent" />
                <h3 className="text-[15px] font-semibold text-accent-fg">{v.title}</h3>
                <p className="mt-2.5 text-[13px] leading-relaxed text-ink-2">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Founder */}
      <section className="border-t border-line bg-surface-1/50 px-6 py-24">
        <div className="container-page">
          <div className="mb-10 text-center">
            <span className="label">{ab.founder_eyebrow}</span>
            <h2 className="mt-3 text-h2 text-ink">{ab.founder_h2}</h2>
          </div>

          <div className="mx-auto max-w-2xl">
            <div className="card p-8 md:p-10">
              <div className="flex flex-col items-center gap-6 text-center md:flex-row md:items-start md:text-start">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-accent text-h3 text-ink">
                  {ab.founder.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-[18px] font-semibold text-ink">{ab.founder.name}</h3>
                  <div className="mt-2 flex flex-wrap justify-center gap-2 md:justify-start">
                    {ab.founder.titles.map((title) => (
                      <span key={title} className="rounded-full border border-line bg-surface-1 px-2.5 py-1 text-[11px] text-ink-2">
                        {title}
                      </span>
                    ))}
                  </div>
                  <p className="mt-4 text-[14px] leading-relaxed text-ink-2">{ab.founder.bio}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-line px-6 py-24 text-center">
        <div className="container-page">
          <span className="label">{ab.cta_h2}</span>
          <p className="mx-auto mt-4 max-w-md text-[15px] text-ink-2">{ab.cta_p}</p>
          <div className="mt-8">
            <Link href="/contact" className="btn-primary">{ab.cta_btn}</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
