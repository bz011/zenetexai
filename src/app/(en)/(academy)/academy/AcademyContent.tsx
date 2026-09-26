"use client";

import Link from "@/components/LocaleLink";
import LessonPlayerShowcase from "@/components/academy/LessonPlayerShowcase";
import Section from "@/components/ui/Section";
import SectionHeader from "@/components/ui/SectionHeader";
import { useLang } from "@/lib/LanguageContext";

const PROGRAM_HREF: Record<string, string> = {
  "pmp-mastery": "/courses/pmp-mastery-program",
  "pmp-simulator": "/courses/pmp-exam-simulator",
  "future-programs": "/contact",
};

export default function AcademyContent() {
  const { t } = useLang();
  const ac = t.academy;
  const s = t.shared;

  return (
    <div>
      {/* Hero: copy + the real lesson player. Copy is visible at first paint (no entrance animation). */}
      <section aria-labelledby="academy-title">
        <div className="container-page grid items-center gap-10 pb-14 pt-10 md:pb-20 md:pt-14 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14">
          <div>
            <p className="label">{ac.hero_eyebrow}</p>
            <h1 id="academy-title" className="mt-4 text-display text-ink">{ac.hero_h1}</h1>
            <p className="mt-6 max-w-lg text-lead text-ink-2">{ac.hero_sub}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/courses" className="btn-primary">{ac.hero_btn1}</Link>
              <Link href="#programs" className="btn-secondary">{ac.hero_btn2}</Link>
            </div>
          </div>
          <LessonPlayerShowcase />
        </div>
      </section>

      {/* Why the Academy: statements separated by hairlines, not boxes */}
      <Section bordered tight aria-label={ac.hero_h1}>
        <ul className="grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {ac.features.map((f) => (
            <li key={f.title} className="border-t border-line-strong pt-4">
              <h2 className="text-h4 text-ink">{f.title}</h2>
              <p className="mt-2 text-small text-ink-2">{f.desc}</p>
            </li>
          ))}
        </ul>
      </Section>

      {/* Programs: an index, each row with its status */}
      <Section id="programs" bordered aria-labelledby="programs-title">
        <SectionHeader eyebrow={ac.programs_eyebrow} title={ac.programs_h2} id="programs-title" />
        <ul className="divide-y divide-line border-y border-line">
          {ac.programs.map((program) => {
            const isAvailable = program.status === s.available || program.status === "Available";
            const href = PROGRAM_HREF[program.id] ?? "/contact";
            return (
              <li key={program.id}>
                <div className="grid gap-x-8 gap-y-2 py-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)_auto] md:items-start">
                  <div>
                    <p className="text-caption font-semibold uppercase tracking-[0.1em] text-ink-3">{program.tag}</p>
                    <h3 className={`mt-1 text-h3 ${isAvailable ? "text-ink" : "text-ink-2"}`}>{program.title}</h3>
                    <span className={`badge mt-2 ${isAvailable ? "badge-positive" : ""}`}>{program.status}</span>
                  </div>
                  <div>
                    <p className="text-body text-ink-2">{program.desc}</p>
                    {program.duration && <p className="mt-2 text-caption text-ink-3">{program.duration}</p>}
                  </div>
                  <div className="md:pt-1">
                    <Link href={href} className="btn-ghost">
                      {isAvailable ? s.learn_more : s.contact_us}
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </Section>

      {/* Closing action */}
      <Section bordered tight raised>
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-h3 text-ink">{ac.bottom_h2}</h2>
          <p className="mt-3 text-body text-ink-2">{ac.bottom_p}</p>
          <div className="mt-6">
            <Link href="/contact" className="btn-primary">{ac.bottom_btn}</Link>
          </div>
        </div>
      </Section>
    </div>
  );
}
