"use client";

import Link from "@/components/LocaleLink";
import { useLang } from "@/lib/LanguageContext";
import { getActiveBlueprint } from "@/features/mock-exam/config/examBlueprint";
import { fillCopy, simulatorFactsFromBlueprint, simulatorPageCopy } from "@/lib/simulatorPageCopy";
import { formatMoney } from "@/features/commerce/utils/money";
import type { ProductWithPricing } from "@/features/commerce/types/commerce";

function useSimulatorCopy() {
  const { lang, t } = useLang();
  const facts = simulatorFactsFromBlueprint(getActiveBlueprint());
  return { lang, t, copy: simulatorPageCopy[lang], facts };
}

/** Benefit-led header + verified facts strip. Structure facts come from the active exam blueprint; price/term from the product's own price data. */
export function SimulatorHero({ product }: { product: ProductWithPricing }) {
  const { t, copy, facts } = useSimulatorCopy();
  const price = product.price;
  const isFreeNow = !!price && price.isPromotionActive && price.effectiveAmountMinorUnits === 0;
  const months = price?.accessDurationDays ? Math.round(price.accessDurationDays / 30) : null;

  const accessValue = price ? (isFreeNow ? t.commerce.card.free_badge : formatMoney(price.effectiveAmountMinorUnits, price.currency)) : "—";
  const accessNote = months ? fillCopy(copy.facts_access_note, { months }) : copy.facts_access_note_no_term;

  const cards = [
    { label: copy.facts_questions_label, value: String(facts.questions), note: copy.facts_questions_note },
    { label: copy.facts_time_label, value: fillCopy(copy.facts_time_value, facts as never), note: fillCopy(copy.facts_time_note, facts as never) },
    { label: copy.facts_exams_label, value: copy.facts_exams_value, note: copy.facts_exams_note },
    { label: copy.facts_practice_label, value: copy.facts_practice_value, note: copy.facts_practice_note },
    { label: copy.facts_access_label, value: accessValue, note: price ? accessNote : "" },
  ];

  return (
    <div>
      <span className="label">{copy.hero_eyebrow}</span>
      <h1 className="mt-3 text-3xl font-bold text-white md:text-4xl">{copy.hero_h1}</h1>
      <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-slate-400">{copy.hero_sub}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="#purchase" className="btn-primary">{copy.cta_primary}</Link>
        <Link href="#how-it-works" className="btn-secondary">{copy.cta_secondary}</Link>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {cards.map((c, i) => (
          <div key={c.label} className={`card p-4 ${i === cards.length - 1 && cards.length % 2 === 1 ? "sm:col-span-2" : ""}`}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{c.label}</p>
            <p className="mt-1 text-xl font-bold text-white">{c.value}</p>
            {c.note && <p className="mt-1 text-[12px] leading-relaxed text-slate-400">{c.note}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Mock exam vs Practice Mode, feature list, FAQ and disclaimer. */
export function SimulatorDetails() {
  const { copy, facts } = useSimulatorCopy();
  const f = (s: string) => fillCopy(s, facts as never);

  return (
    <div className="space-y-10">
      <section id="how-it-works">
        <span className="label">{copy.compare_eyebrow}</span>
        <h2 className="mt-2 text-xl font-bold text-white">{copy.compare_h2}</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-slate-400">{copy.compare_sub}</p>
        <div className="mt-5 grid gap-4">
          {[
            { tag: copy.mock_tag, title: copy.mock_title, intro: copy.mock_intro, points: copy.mock_points },
            { tag: copy.practice_tag, title: copy.practice_title, intro: copy.practice_intro, points: copy.practice_points },
          ].map((b) => (
            <div key={b.title} className="card p-5">
              <span className="label text-[10px]">{b.tag}</span>
              <h3 className="mt-2 text-[16px] font-semibold text-white">{b.title}</h3>
              <p className="mt-1 text-[13px] text-slate-400">{b.intro}</p>
              <ul className="mt-3 space-y-2">
                {b.points.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-[13px] leading-relaxed text-slate-300">
                    <span className="mt-0.5 text-emerald-400">✓</span> <span>{f(p)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-white">{copy.features_h2}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {copy.features.map((item) => (
            <div key={item.title} className="card p-4">
              <h3 className="text-[14px] font-semibold text-white">{item.title}</h3>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-slate-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-white">{copy.faq_h2}</h2>
        <div className="mt-4 space-y-3">
          {copy.faq.map((item) => (
            <div key={item.q} className="card p-5">
              <h3 className="text-[14px] font-semibold text-white">{f(item.q)}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-slate-400">{f(item.a)}</p>
            </div>
          ))}
        </div>
        <p className="mt-5 text-[11px] leading-relaxed text-slate-600">{copy.disclaimer}</p>
      </section>
    </div>
  );
}
