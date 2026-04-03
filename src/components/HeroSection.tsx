"use client";

import Link from "next/link";
import { useLang } from "@/lib/LanguageContext";

export default function HeroSection() {
  const { t } = useLang();
  const h = t.hero;

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pb-24 pt-32 text-center">

      {/* ── Backgrounds ─────────────────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0">
        {/* Primary glow — large, centered */}
        <div className="absolute left-1/2 top-[45%] h-[700px] w-[1000px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/[0.11] blur-[140px]" />
        {/* Secondary violet accent — offset upward */}
        <div className="absolute left-1/2 top-[20%] h-[350px] w-[560px] -translate-x-1/2 rounded-full bg-violet-600/[0.07] blur-[110px]" />
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

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div className="relative mx-auto max-w-[720px]">

        {/* Badge */}
        <div className="animate-fade-up mb-8 inline-flex items-center gap-2.5 rounded-full border border-indigo-500/[0.22] bg-indigo-500/[0.07] px-4 py-1.5">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-400" />
          <span className="label text-[10px] text-indigo-300/90">{h.badge}</span>
        </div>

        {/* Headline */}
        <h1 className="animate-fade-up delay-100 text-5xl font-bold leading-[1.08] tracking-tight text-white md:text-6xl lg:text-[76px]">
          {h.headline1}
          <br />
          <span className="gradient-text">{h.headline2}</span>
        </h1>

        {/* Subheading */}
        <p className="animate-fade-up delay-200 mx-auto mt-7 max-w-[540px] text-[17px] leading-[1.75] text-slate-400">
          {h.sub}
        </p>

        {/* CTAs */}
        <div className="animate-fade-up delay-300 mt-10 flex flex-wrap justify-center gap-3">
          <Link href="/contact" className="btn-primary px-8 py-3.5 text-[14px]">
            {h.cta_primary}
          </Link>
          <Link href="/services" className="btn-secondary px-8 py-3.5 text-[14px]">
            {h.cta_secondary}
          </Link>
        </div>

        {/* Region note */}
        <p className="animate-fade-up delay-400 mt-9 text-[12px] text-slate-600">
          {h.region_note}
        </p>
      </div>

      {/* ── Bottom fade ──────────────────────────────────────────────────── */}
      <div className="pointer-events-none absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-[#060B18] to-transparent" />
    </section>
  );
}
