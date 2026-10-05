"use client";

import LocaleLink from "@/components/LocaleLink";
import { useLang } from "@/lib/LanguageContext";
import { SHOWCASE_CTA_HREF, SHOWCASE_SERVICES } from "./showcaseParam";

/**
 * Static, lightweight replacement for the interactive 3D showcase on mobile
 * portrait widths (below SHOWCASE_MIN_WIDTH - see showcaseParam.ts). Product
 * decision: the 3D camera framing was technically correct on real phones
 * (fitDistance/contentBounds in mountShowcase.ts/kit.ts) but still didn't
 * meet the bar visually at narrow widths, and the fix is no longer "make the
 * 3D scene fit" - it's "don't show 3D on mobile at all." This component is a
 * sibling of HeroVisual in HomeContent.tsx (hidden md:block on HeroVisual,
 * md:hidden here), not a fallback rendered by ShowcaseGate - so on mobile the
 * Three.js/showcase3d/scenes module tree and the GLB model are never
 * requested in the first place, not loaded-then-hidden.
 *
 * Same four categories, same copy source (t.showcase - already used by the
 * desktop 3D stage, so wording can't drift), same CTA destinations
 * (SHOWCASE_CTA_HREF, shared with ShowcaseHero.tsx). Each card is a plain
 * link: no custom ARIA, keyboard handling, or touch gesture code needed -
 * it's already fully keyboard- and touch-operable by construction.
 */
export default function MobileShowcase() {
  const { t, isRTL } = useLang();
  const copy = t.showcase;
  const ready = SHOWCASE_SERVICES.filter((s) => s.ready);

  return (
    <ul className="grid grid-cols-2 gap-3" aria-label={copy.selector.agents}>
      {ready.map((s) => (
        <li key={s.id}>
          <LocaleLink
            href={SHOWCASE_CTA_HREF[s.id]}
            className="group block rounded-card border border-line bg-surface-1 p-4 transition-colors hover:border-line-strong hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0"
          >
            <p className="text-small font-semibold text-ink">{copy.selector[s.id]}</p>
            <p className="mt-1 text-caption leading-relaxed text-ink-3">{copy.description[s.id]}</p>
            <span className="mt-2 inline-flex items-center gap-1 text-caption font-semibold text-accent-fg">
              {copy.selector[`${s.id}Short` as const]}
              <svg
                aria-hidden="true"
                width="14"
                height="14"
                viewBox="0 0 20 20"
                fill="none"
                className={`transition-transform duration-150 group-hover:translate-x-0.5 ${isRTL ? "rotate-180 group-hover:-translate-x-0.5" : ""}`}
              >
                <path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </LocaleLink>
        </li>
      ))}
    </ul>
  );
}
