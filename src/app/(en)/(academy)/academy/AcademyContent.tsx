"use client";

import Link from "@/components/LocaleLink";
import { useLang } from "@/lib/LanguageContext";
import AcademyHeroVisual from "@/components/academy/AcademyHeroVisual";

const PROGRAM_HREF: Record<string, string> = {
  "pmp-mastery": "/courses/pmp-mastery-program",
  "pmp-simulator": "/courses/pmp-exam-simulator",
  "future-programs": "/contact",
};

/** Colors the literal "ZentexAI" inside the (real, translated) heading like the logo wordmark - no new copy. */
function renderAcademyHeadline(text: string) {
  const i = text.indexOf("ZentexAI");
  if (i === -1) return text;
  return (
    <>
      {text.slice(0, i)}
      {text.slice(i, i + 6)}
      <span className="text-indigo-600">{text.slice(i + 6, i + 8)}</span>
      {text.slice(i + 8)}
    </>
  );
}

export default function AcademyContent() {
  const { t } = useLang();
  const ac = t.academy;
  const s = t.shared;

  return (
    <div className="min-h-screen ux-page">
      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-14 pt-16 md:pb-20 md:pt-24 lg:pb-28 lg:pt-28">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 h-[560px] w-[720px] -translate-y-1/4 rounded-full bg-violet-600/[0.1] blur-[120px] [inset-inline-end:-8%] rtl:[inset-inline-end:auto] rtl:[inset-inline-start:-8%]"
        />
        <div className="container-page relative grid items-center gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:gap-14">
          <div className="mx-auto max-w-xl text-center lg:mx-0 lg:text-start">
            <span className="label">{ac.hero_eyebrow}</span>
            <h1 className="mt-4 text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-[56px]">
              {renderAcademyHeadline(ac.hero_h1)}
            </h1>
            <p className="mx-auto mt-5 max-w-md text-lead leading-relaxed text-slate-400 lg:mx-0">{ac.hero_sub}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
              <Link href="/courses" className="btn-primary px-6 py-3 text-[14px]">{ac.hero_btn1}</Link>
              <Link href="#programs" className="btn-secondary px-6 py-3 text-[14px]">{ac.hero_btn2}</Link>
            </div>
          </div>

          <AcademyHeroVisual caption={ac.programs[0].title} />
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-white/[0.06] px-6 py-14 md:py-20">
        <div className="container-page">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {ac.features.map((f) => (
              <div key={f.title} className="card p-6">
                <div className="mb-3 h-px w-8 bg-gradient-to-r from-indigo-500 to-violet-500" />
                <h3 className="text-body font-semibold text-white">{f.title}</h3>
                <p className="mt-1.5 text-small leading-relaxed text-slate-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Programs */}
      <section id="programs" className="px-6 py-16 md:py-24">
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
                    <span className="label text-caption">{program.tag}</span>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-caption font-semibold ${
                        isAvailable ? "bg-emerald-500/[0.12] text-emerald-400" : "bg-white/[0.05] text-slate-400"
                      }`}
                    >
                      {program.status}
                    </span>
                  </div>

                  <h3 className="mt-3 text-body font-semibold text-white">{program.title}</h3>
                  <p className="mt-2 flex-1 text-small leading-relaxed text-slate-400">{program.desc}</p>

                  <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-4">
                    <span className="text-small text-slate-400">{program.duration ?? ""}</span>
                    {isAvailable && (
                      <Link href={PROGRAM_HREF[program.id] ?? "/contact"} className="btn-ghost text-small">
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
      <section className="border-t border-white/[0.06] bg-white/[0.015] px-6 py-14 md:py-20 text-center">
        <div className="container-page">
          <h2 className="text-2xl font-bold text-white">{ac.bottom_h2}</h2>
          <p className="mx-auto mt-3 max-w-md text-body text-slate-400">{ac.bottom_p}</p>
          <div className="mt-7">
            <Link href="/contact" className="btn-primary">{ac.bottom_btn}</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
