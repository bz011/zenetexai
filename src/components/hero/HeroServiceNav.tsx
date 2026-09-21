"use client";

import type { ReactElement } from "react";
import LocaleLink from "@/components/LocaleLink";
import { useLang } from "@/lib/LanguageContext";
import { HERO_NAV_IDS, heroCopy, type HeroCardId } from "@/lib/heroCopy";

const ICONS: Partial<Record<HeroCardId, ReactElement>> = {
  pmp: <path d="M3 9l9-4 9 4-9 4-9-4zm4 2.5V16c0 1.2 2.2 2.5 5 2.5s5-1.3 5-2.5v-4.5M21 9v5" />,
  simulator: <path d="M12 7v5l3 2M12 3a9 9 0 100 18 9 9 0 000-18zM9 1h6" />,
  data: <path d="M4 20V10m6 10V4m6 16v-7m4 7H2" />,
};

/** A slim bar under the hero with the destinations the rest of the homepage does not already link to. */
export default function HeroServiceNav() {
  const { lang } = useLang();
  const copy = heroCopy[lang];
  const items = copy.cards.filter((c) => HERO_NAV_IDS.includes(c.id));
  return (
    <nav aria-label={copy.cardsLabel} className="relative mt-8 lg:mt-2">
      <ul className="grid gap-3 md:grid-cols-3 md:gap-0 md:rounded-2xl md:border md:border-white/[0.08] md:bg-slate-950/40 md:backdrop-blur-md md:[&>li+li]:border-s md:[&>li+li]:border-white/[0.08]">
        {items.map((card) => (
          <li key={card.id}>
            <LocaleLink
              href={card.href}
              className="group flex h-full items-center gap-3.5 rounded-2xl border border-white/[0.08] bg-slate-950/40 p-4 transition-colors hover:bg-sky-400/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 md:rounded-none md:border-0 md:bg-transparent md:px-6 md:py-5 md:first:rounded-s-2xl md:last:rounded-e-2xl"
            >
              <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400/30 to-indigo-500/20 text-sky-100 ring-1 ring-sky-300/25">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{ICONS[card.id]}</svg>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-small font-semibold leading-snug text-white">{card.title}</span>
                <span className="mt-0.5 block text-small leading-snug text-slate-400">{card.desc}</span>
              </span>
              <svg aria-hidden="true" viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-sky-200/80 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5 motion-reduce:transition-none">
                <path d="M4 10h11m-4-4l4 4-4 4" />
              </svg>
            </LocaleLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
