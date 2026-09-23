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
      {/* Hero: centered headline/CTAs on top, one large real product screenshot below -
          a single flowing composition rather than two disconnected side-by-side halves,
          and already the right shape for mobile (it just scales, nothing to recompose). */}
      <section className="px-6 pb-14 pt-14 md:pb-16 md:pt-20 lg:pt-24">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <span className="label">{ac.hero_eyebrow}</span>
            <h1 className="mt-4 text-3xl font-bold leading-[1.15] tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
              {renderAcademyHeadline(ac.hero_h1)}
            </h1>
            <p className="mx-auto mt-4 max-w-lg text-lead leading-relaxed text-slate-400">{ac.hero_sub}</p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link href="/courses" className="btn-primary px-6 py-3 text-[14px]">{ac.hero_btn1}</Link>
              <Link href="#programs" className="btn-secondary px-6 py-3 text-[14px]">{ac.hero_btn2}</Link>
            </div>
          </div>

          <div className="mt-10 md:mt-12 lg:mt-14">
            <AcademyHeroVisual />
          </div>
        </div>
      </section>

      {/* Features: plain text blurbs (no card boxes) - a supporting strip under the hero, not a second wave of generic cards. */}
      <section className="border-t border-slate-200 px-6 py-12 md:py-16">
        <div className="container-page">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {ac.features.map((f) => (
              <div key={f.title}>
                <div className="h-px w-8 bg-gradient-to-r from-indigo-500 to-violet-500" />
                <h3 className="mt-3 text-body font-semibold text-slate-900">{f.title}</h3>
                <p className="mt-1.5 text-small leading-relaxed text-slate-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Programs: the real hierarchy - the flagship PMP Mastery Program gets a
          slight visual emphasis (accent ring), the Simulator and future programs
          read as secondary, plain cards. No new copy, just intentional weight. */}
      <section id="programs" className="border-t border-slate-200 bg-slate-50 px-6 py-16 md:py-24">
        <div className="container-page">
          <div className="mb-10 text-center">
            <span className="label">{ac.programs_eyebrow}</span>
            <h2 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">{ac.programs_h2}</h2>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {ac.programs.map((program) => {
              const isAvailable = program.status === s.available || program.status === "Available";
              const isFlagship = program.id === "pmp-mastery";
              return (
                <div
                  key={program.id}
                  className={`card flex flex-col p-6 ${isAvailable ? "card-hover" : "opacity-70"} ${
                    isFlagship ? "ring-1 ring-indigo-200 shadow-[0_20px_40px_-24px_rgba(79,70,229,0.35)]" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="label text-caption">{program.tag}</span>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-caption font-semibold ${
                        isAvailable ? "bg-emerald-500/[0.12] text-emerald-600" : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {program.status}
                    </span>
                  </div>

                  <h3 className="mt-3 text-body font-semibold text-slate-900">{program.title}</h3>
                  <p className="mt-2 flex-1 text-small leading-relaxed text-slate-400">{program.desc}</p>

                  <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-4">
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
      <section className="border-t border-slate-200 px-6 py-14 md:py-20 text-center">
        <div className="container-page">
          <h2 className="text-2xl font-bold text-slate-900">{ac.bottom_h2}</h2>
          <p className="mx-auto mt-3 max-w-md text-body text-slate-400">{ac.bottom_p}</p>
          <div className="mt-7">
            <Link href="/contact" className="btn-primary">{ac.bottom_btn}</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
