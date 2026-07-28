"use client";

import Link from "next/link";
import { useLang } from "@/lib/LanguageContext";

const PROGRAM_HREF: Record<string, string> = {
  "pmp-mastery": "/enroll",
  "pmp-simulator": "/pmp/practice",
  "future-programs": "/contact",
};

export default function AcademyContent() {
  const { t } = useLang();
  const ac = t.academy;
  const s = t.shared;

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/[0.06] px-6 pb-24 pt-36">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/[0.1] blur-[120px]" />
        <div className="container-page relative text-center">
          <span className="label">{ac.hero_eyebrow}</span>
          <h1 className="mt-3 text-4xl font-bold text-white md:text-5xl lg:text-6xl">{ac.hero_h1}</h1>
          <p className="mx-auto mt-5 max-w-lg text-[16px] leading-relaxed text-slate-400">{ac.hero_sub}</p>
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/enroll" className="btn-primary">{ac.hero_btn1}</Link>
            <Link href="#programs" className="btn-secondary">{ac.hero_btn2}</Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-b border-white/[0.06] px-6 py-16">
        <div className="container-page">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ac.features.map((f) => (
              <div key={f.title} className="card p-5">
                <div className="mb-3 h-px w-8 bg-gradient-to-r from-indigo-500 to-violet-500" />
                <h3 className="text-[14px] font-semibold text-white">{f.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-slate-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Programs */}
      <section id="programs" className="px-6 py-24">
        <div className="container-page">
          <div className="mb-10">
            <span className="label">{ac.programs_eyebrow}</span>
            <h2 className="mt-2 text-2xl font-bold text-white md:text-3xl">{ac.programs_h2}</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {ac.programs.map((program) => {
              const isAvailable = program.status === s.available || program.status === "Available";
              return (
                <div
                  key={program.id}
                  className={`card card-hover flex flex-col p-6 ${isAvailable ? "" : "opacity-70"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="label text-[10px]">{program.tag}</span>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        isAvailable ? "bg-emerald-500/[0.12] text-emerald-400" : "bg-white/[0.05] text-slate-500"
                      }`}
                    >
                      {program.status}
                    </span>
                  </div>

                  <h3 className="mt-3 text-[15px] font-semibold text-white">{program.title}</h3>
                  <p className="mt-2 flex-1 text-[13px] leading-relaxed text-slate-400">{program.desc}</p>

                  <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-4">
                    <span className="text-[12px] text-slate-500">{program.duration ?? ""}</span>
                    {isAvailable && (
                      <Link href={PROGRAM_HREF[program.id] ?? "/contact"} className="btn-ghost text-[12px]">
                        {s.learn_more}
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-white/[0.06] bg-white/[0.015] px-6 py-20 text-center">
        <div className="container-page">
          <h2 className="text-2xl font-bold text-white">{ac.bottom_h2}</h2>
          <p className="mx-auto mt-3 max-w-md text-[15px] text-slate-400">{ac.bottom_p}</p>
          <div className="mt-7">
            <Link href="/contact" className="btn-primary">{ac.bottom_btn}</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
