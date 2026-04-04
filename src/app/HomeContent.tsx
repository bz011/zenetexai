"use client";

import Link from "next/link";
import { useLang } from "@/lib/LanguageContext";
import HeroSection from "@/components/HeroSection";
import CTASection from "@/components/CTASection";

export default function HomeContent() {
  const { t } = useLang();
  const h = t.home;
  const s = t.shared;

  return (
    <>
      <HeroSection />

      {/* ── Pillars strip ───────────────────────────────────────────────── */}
      <section className="border-y border-white/[0.06] bg-white/[0.015]">
        <div className="container-page py-12">
          <div className="grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-4">
            {h.pillars.map((p, i) => (
              <div
                key={p.label}
                className="animate-fade-up text-center"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="text-[15px] font-bold text-white">{p.label}</div>
                <div className="mt-1.5 text-[12px] leading-relaxed text-slate-500">{p.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI Services ─────────────────────────────────────────────────── */}
      <section className="py-36">
        <div className="container-page">
          <div className="animate-fade-up mb-16 max-w-lg">
            <span className="label">{h.services_eyebrow}</span>
            <h2 className="mt-3 text-3xl font-bold text-white md:text-4xl">{h.services_h2}</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-slate-400">{h.services_sub}</p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {h.services.map((sv, i) => (
              <div
                key={sv.title}
                className="animate-fade-up card card-hover group relative overflow-hidden p-8"
                style={{ animationDelay: `${100 + i * 80}ms` }}
              >
                {/* Subtle inner glow on hover */}
                <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{ background: "radial-gradient(ellipse at 30% 20%, rgba(99,102,241,0.07) 0%, transparent 60%)" }} />

                <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl border border-indigo-500/25 bg-indigo-500/[0.12] text-xl text-indigo-300 transition-all duration-200 group-hover:border-indigo-400/50 group-hover:bg-indigo-500/[0.22] group-hover:text-indigo-200">
                  {sv.icon}
                </div>
                <span className="label text-[10px]">{sv.tag}</span>
                <h3 className="mt-2.5 text-[16px] font-semibold leading-snug text-white transition-colors group-hover:text-indigo-200">
                  {sv.title}
                </h3>
                <p className="mt-2.5 text-[14px] leading-relaxed text-slate-400">{sv.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-6">
            <Link href="/services" className="btn-ghost">{h.services_link1}</Link>
            <Link href="/contact" className="btn-ghost">{h.services_link2}</Link>
          </div>
        </div>
      </section>

      {/* ── Academy ─────────────────────────────────────────────────────── */}
      <section className="border-t border-white/[0.06] bg-white/[0.015] py-36">
        <div className="container-page">
          <div className="grid gap-20 lg:grid-cols-2 lg:items-center">

            {/* Left copy */}
            <div className="animate-fade-up">
              <span className="label">{h.academy_eyebrow}</span>
              <h2 className="mt-3 text-3xl font-bold text-white md:text-4xl">
                {h.academy_h2_line1}
                <br />
                <span className="gradient-text">{h.academy_h2_line2}</span>
              </h2>
              <p className="mt-5 text-[15px] leading-relaxed text-slate-400">{h.academy_p1}</p>
              <p className="mt-3.5 text-[15px] leading-relaxed text-slate-400">{h.academy_p2}</p>
              <div className="mt-9 flex gap-3">
                <Link href="/academy" className="btn-primary">{h.academy_btn1}</Link>
                <Link href="/contact" className="btn-secondary">{h.academy_btn2}</Link>
              </div>
            </div>

            {/* Right course list */}
            <div className="space-y-3">
              {h.academy_courses.map((course, i) => (
                <div
                  key={course.label}
                  className="animate-fade-up flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.03] px-5 py-4 transition-all duration-200 hover:border-white/[0.14] hover:-translate-y-px hover:bg-white/[0.055]"
                  style={{ animationDelay: `${i * 70}ms` }}
                >
                  <span className="text-[14px] font-medium text-white">{course.label}</span>
                  <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                    course.status === s.available || course.status === "Available"
                      ? "bg-emerald-500/[0.12] text-emerald-400"
                      : "bg-white/[0.05] text-slate-500"
                  }`}>
                    {course.status}
                  </span>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ── Tools ───────────────────────────────────────────────────────── */}
      <section className="border-t border-white/[0.06] py-36">
        <div className="container-page">
          <div className="animate-fade-up mb-16 text-center">
            <span className="label">{h.tools_eyebrow}</span>
            <h2 className="mt-3 text-3xl font-bold text-white md:text-4xl">{h.tools_h2}</h2>
            <p className="mx-auto mt-4 max-w-lg text-[15px] text-slate-400">{h.tools_sub}</p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {h.tools.map((tool, i) => (
              <div
                key={tool.title}
                className="animate-fade-up card group relative overflow-hidden p-8 transition-all duration-200 hover:-translate-y-1 hover:border-white/[0.14] hover:shadow-[0_8px_30px_rgba(0,0,0,0.35)]"
                style={{ animationDelay: `${100 + i * 80}ms` }}
              >
                {/* Icon placeholder — colour accent on hover */}
                <div className="mb-6 h-11 w-11 rounded-xl border border-indigo-500/20 bg-indigo-500/[0.08] transition-all duration-200 group-hover:border-indigo-500/35 group-hover:bg-indigo-500/[0.15]" />
                <span className="label text-[10px]">{tool.category}</span>
                <h3 className="mt-2.5 text-[15px] font-semibold leading-snug text-white">{tool.title}</h3>
                <p className="mt-2.5 text-[13px] leading-relaxed text-slate-400">{tool.desc}</p>
                <div className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.04] px-3 py-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  <span className="text-[11px] text-slate-500">{s.in_development}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link href="/tools" className="btn-ghost">{h.tools_link}</Link>
          </div>
        </div>
      </section>

      {/* ── Why ZENTEXAI ───────────────────────────────────────────────── */}
      <section className="border-t border-white/[0.06] bg-white/[0.015] py-36">
        <div className="container-page">
          <div className="animate-fade-up mb-16 text-center">
            <span className="label">{h.why_eyebrow}</span>
            <h2 className="mt-3 text-3xl font-bold text-white md:text-4xl">{h.why_h2}</h2>
            <p className="mx-auto mt-4 max-w-lg text-[15px] text-slate-400">{h.why_sub}</p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {h.benefits.map((b, i) => (
              <div
                key={b.title}
                className="animate-fade-up card card-hover p-7"
                style={{ animationDelay: `${100 + i * 60}ms` }}
              >
                <div className="mb-5 h-px w-12 bg-gradient-to-r from-indigo-500 to-violet-500" />
                <h3 className="text-[15px] font-semibold text-white">{b.title}</h3>
                <p className="mt-2.5 text-[13px] leading-relaxed text-slate-400">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CTASection />
    </>
  );
}
