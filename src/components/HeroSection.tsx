"use client";

import LocaleLink from "@/components/LocaleLink";
import { useLang } from "@/lib/LanguageContext";
import HeroStage from "@/components/hero/HeroStage";
import { BrainNetworkDefs, BrainNetworkUse } from "@/components/hero/BrainNetworkSvg";

export default function HeroSection() {
  const { t } = useLang();
  const h = t.hero;

  return (
    <section className="relative overflow-hidden px-6 pb-14 pt-20 md:pb-20 md:pt-32 lg:flex lg:min-h-[calc(100svh-4rem)] lg:items-center lg:pb-16 lg:pt-24">
      <BrainNetworkDefs />

      {/* ── Backgrounds ─────────────────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0">
        {/* Primary glow — large, centered */}
        <div className="absolute left-1/2 top-[300px] h-[700px] w-[1000px] -translate-x-1/2 -translate-y-1/2 lg:top-[45%] rounded-full bg-indigo-600/[0.11] blur-[140px]" />
        {/* Secondary violet accent — offset upward */}
        <div className="absolute left-1/2 top-[120px] h-[350px] w-[560px] -translate-x-1/2 lg:top-[20%] rounded-full bg-violet-600/[0.07] blur-[110px]" />
        {/* Subtle warm accent — bottom-right edge */}
        <div className="absolute bottom-0 right-0 h-[280px] w-[400px] rounded-full bg-indigo-500/[0.05] blur-[100px]" />
      </div>

      {/* Grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.022]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      {/* Mobile / tablet: the static network sits softly behind the headline. */}
      <BrainNetworkUse className="pointer-events-none absolute left-1/2 top-16 h-[420px] w-[420px] -translate-x-1/2 opacity-[0.24] lg:hidden" />

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div className="container-page relative grid items-center gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-6" style={{ maxWidth: 1360 }}>
        <div className="mx-auto max-w-[720px] text-center lg:mx-0 lg:text-start">

          {/* Badge */}
          <div className="animate-fade-up mb-6 inline-flex lg:mb-8 items-center gap-2.5 rounded-full border border-indigo-500/[0.22] bg-indigo-500/[0.07] px-4 py-1.5">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-400" />
            <span className="label text-caption text-indigo-300/90">{h.badge}</span>
          </div>

          {/* Headline */}
          <h1 className="animate-fade-up delay-100 text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[52px] min-[1360px]:text-[60px]">
            {h.headline1}
            <br />
            <span className="gradient-text">{h.headline2}</span>
          </h1>

          {/* Subheading */}
          <p className="animate-fade-up delay-200 mx-auto mt-7 max-w-[540px] text-lead leading-[1.75] text-slate-400 lg:mx-0">
            {h.sub}
          </p>

          {/* CTAs */}
          <div className="animate-fade-up delay-300 mt-8 flex lg:mt-10 flex-wrap justify-center gap-3 lg:justify-start">
            <LocaleLink href="/contact" className="btn-primary px-8 py-3.5 text-small">
              {h.cta_primary}
            </LocaleLink>
            <LocaleLink href="/services" className="btn-secondary px-8 py-3.5 text-small">
              {h.cta_secondary}
            </LocaleLink>
          </div>

          {/* Region note */}
          <p className="animate-fade-up delay-400 mt-6 text-small lg:mt-9 text-slate-400">
            {h.region_note}
          </p>
        </div>

        <HeroStage />
      </div>

      {/* ── Bottom fade ──────────────────────────────────────────────────── */}
      <div className="pointer-events-none absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-[#060B18] to-transparent" />
    </section>
  );
}
