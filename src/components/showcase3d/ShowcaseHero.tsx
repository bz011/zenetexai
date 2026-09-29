"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import LocaleLink from "@/components/LocaleLink";
import { useLang } from "@/lib/LanguageContext";
import type { ShowcaseHandle } from "./mountShowcase";
import { SHOWCASE_SERVICES, type ShowcaseServiceId } from "./showcaseParam";

/**
 * The homepage hero, shown by default (see ShowcaseGate; ?showcase=0 forces
 * the pre-showcase 2D fallback instead). The showcase owns the full viewport
 * - no marketing copy competes with it on this stage. The pre-showcase hero's
 * real H1/paragraph/CTA are untouched and still exist in HomeContent.tsx as
 * the fallback children; ShowcaseGate swaps them out client-side, after load,
 * unless that opt-out flag or a mount failure sends it back to them. Whether
 * this stage should expose its own semantic H1 remains open - unchanged by
 * this pass, see docs/design-v2/CORE-LOOKDEV.md context.
 *
 * The "illustrative example, not a real conversation" disclosure is preserved
 * as the stage's accessible name (below) rather than as visible text; it
 * should surface visibly again at some point (e.g. as a caption once real
 * copy returns).
 *
 * Runs in both languages: every visible/accessible string comes from
 * `t.showcase` (the site's existing Translations, via useLang()) rather than
 * being hardcoded here, and each service's CTA is a LocaleLink so an Arabic
 * visitor lands on that service's real Arabic page.
 */

/** Where each service's call to action goes: each of these is an existing, public page (LocaleLink sends Arabic visitors to its Arabic URL where one exists). */
const CTA_HREF: Record<ShowcaseServiceId, string> = {
  agents: "/services/ai-agents-automation-uae",
  data: "/services/data-analytics-uae",
  ml: "/services/machine-learning-uae",
  academy: "/academy",
};

/** Fade the call to action out, swap it, fade it in: ms. */
const CTA_SWAP_MS = 170;

export default function ShowcaseHero({ initial, onFailed }: { initial: ShowcaseServiceId; onFailed: () => void }) {
  const { lang, isRTL, t } = useLang();
  const copy = t.showcase;
  const host = useRef<HTMLDivElement | null>(null);
  const handle = useRef<ShowcaseHandle | null>(null);
  const activeRef = useRef<ShowcaseServiceId>(initial);
  const [active, setActive] = useState<ShowcaseServiceId>(initial);
  /** the service whose call to action is currently on screen (lags `active` by the fade) */
  const [ctaFor, setCtaFor] = useState<ShowcaseServiceId>(initial);
  const [ctaVisible, setCtaVisible] = useState(true);

  const tabs = useRef<Array<HTMLButtonElement | null>>([]);
  const list = useRef<HTMLDivElement | null>(null);
  const [indicator, setIndicator] = useState<{ x: number; w: number } | null>(null);

  const select = useCallback((id: ShowcaseServiceId) => {
    if (id === activeRef.current) return;
    activeRef.current = id;
    setActive(id);
    handle.current?.setScene(id);
  }, []);

  const step = useCallback(
    (dir: 1 | -1) => {
      const ready = SHOWCASE_SERVICES.filter((s) => s.ready);
      const i = ready.findIndex((s) => s.id === activeRef.current);
      const next = ready[(i + dir + ready.length) % ready.length];
      select(next.id);
    },
    [select],
  );

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let cancelled = false;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // desktop pointer response only with a real pointer (not touch) and when motion is allowed
    const fine = window.matchMedia("(pointer: fine)").matches && window.matchMedia("(hover: hover)").matches;
    import("./mountShowcase")
      .then(({ default: mount }) =>
        mount(el, initial, { parallax: fine && !reduce, reducedMotion: reduce, onSwipe: reduce ? undefined : (d) => step(d), lang, copy }, onFailed),
      )
      .then((h) => {
        if (cancelled) h.dispose();
        else handle.current = h;
      })
      .catch(onFailed);
    return () => {
      cancelled = true;
      handle.current?.dispose();
      handle.current = null;
    };
    // `copy`/`lang` intentionally excluded: on this page, switching language always navigates between "/" and
    // "/ar" (see LanguageContext.tsx - the homepage has a real Arabic URL), which remounts this component fresh
    // with the new language already in place. Depending on them here would tear down and rebuild every scene on
    // any other unrelated re-render, losing whatever the animation was doing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial, onFailed, step]);

  // the call to action follows the selected service: fade out, swap, fade in
  useEffect(() => {
    if (active === ctaFor) return;
    setCtaVisible(false);
    const timer = window.setTimeout(() => {
      setCtaFor(active);
      setCtaVisible(true);
    }, CTA_SWAP_MS);
    return () => window.clearTimeout(timer);
  }, [active, ctaFor]);

  // the active indicator slides between tabs
  const measure = useCallback(() => {
    const i = SHOWCASE_SERVICES.findIndex((s) => s.id === active);
    const b = tabs.current[i];
    if (b) setIndicator({ x: b.offsetLeft, w: b.offsetWidth });
  }, [active]);
  useLayoutEffect(measure, [measure]);
  useEffect(() => {
    const el = list.current;
    if (!el) return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    void document.fonts?.ready.then(measure);
    return () => ro.disconnect();
  }, [measure]);

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const ready = SHOWCASE_SERVICES.filter((s) => s.ready);
    const i = ready.findIndex((s) => s.id === active);
    let next = -1;
    // Arrow keys move by reading direction, not by physical left/right, so they still feel like
    // "next tab" / "previous tab" once the row visually mirrors under RTL.
    const forward = isRTL ? "ArrowLeft" : "ArrowRight";
    const backward = isRTL ? "ArrowRight" : "ArrowLeft";
    if (e.key === forward) next = (i + 1) % ready.length;
    else if (e.key === backward) next = (i - 1 + ready.length) % ready.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = ready.length - 1;
    if (next < 0) return;
    e.preventDefault();
    const id = ready[next].id;
    select(id);
    tabs.current[SHOWCASE_SERVICES.findIndex((s) => s.id === id)]?.focus();
  }

  const label = (id: ShowcaseServiceId): string => copy.selector[id];
  const shortLabel = (id: ShowcaseServiceId): string => copy.selector[`${id}Short` as const];
  const stageLabel = copy.stage[active];
  const ctaLabel = copy.cta[ctaFor];
  const ctaHref = CTA_HREF[ctaFor];

  return (
    <section
      aria-label="Services showcase"
      className="relative overflow-hidden"
      // horizontal swipes are ours (switch service); vertical panning stays with the page
      style={{ minHeight: "clamp(560px, calc(100svh - 73px), 900px)", touchAction: "pan-y" }}
    >
      <div ref={host} role="img" aria-label={stageLabel} data-showcase-host className="pointer-events-none absolute inset-0" />

      {/*
        The site-wide WhatsApp button (fixed bottom-5 right-5 in LTR, bottom-5 left-5 in RTL - see
        WhatsAppButton.tsx - 48px, z-40) sits in the corner this bar's trailing edge approaches. Below
        the "sm" breakpoint this bar isn't wide enough to clear it on its own, so it gets extra padding
        on that side only, pulling the centred content in just enough that the last tab never sits
        under the widget, in either language.
      */}
      <div
        className="absolute inset-x-0 z-10 flex flex-col items-center gap-3 px-3 pr-16 rtl:pr-3 rtl:pl-16 sm:px-4"
        style={{ bottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
      >
        <LocaleLink
          href={ctaHref}
          aria-hidden={ctaVisible ? undefined : true}
          tabIndex={ctaVisible ? 0 : -1}
          className={`group inline-flex min-h-[2.75rem] items-center gap-2 rounded-full border border-white/15 bg-black/40 px-5 text-small font-semibold text-ink backdrop-blur-sm transition-[opacity,background-color,border-color,transform] duration-150 hover:border-white/30 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-black/60 ${
            ctaVisible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-1 opacity-0"
          }`}
        >
          {isRTL && (
            <span aria-hidden className="transition-transform duration-150 group-hover:-translate-x-0.5">
              ←
            </span>
          )}
          {ctaLabel}
          {!isRTL && (
            <span aria-hidden className="transition-transform duration-150 group-hover:translate-x-0.5">
              →
            </span>
          )}
        </LocaleLink>

        <div
          ref={list}
          role="tablist"
          aria-label={copy.selector.agents /* unused as visible text; kept non-empty for the accessibility tree */}
          onKeyDown={onKeyDown}
          className="relative flex max-w-full gap-0.5 rounded-full border border-white/10 bg-black/40 p-1 backdrop-blur-sm sm:gap-1"
        >
          {indicator && (
            // `offsetLeft` is always a physical (left-edge) pixel value, regardless of direction - under RTL the
            // tab row itself mirrors visually (flexbox is direction-aware), so the same left-anchored transform
            // that positions the indicator in English already lands on the right tab in Arabic with no changes.
            <span
              aria-hidden
              className="pointer-events-none absolute bottom-1 left-0 top-1 rounded-full bg-accent transition-[transform,width] duration-300 ease-out motion-reduce:transition-none"
              style={{ width: indicator.w, transform: `translateX(${indicator.x}px)` }}
            />
          )}
          {SHOWCASE_SERVICES.map((s, i) => {
            const selected = s.id === active;
            return (
              <button
                key={s.id}
                ref={(el) => {
                  tabs.current[i] = el;
                }}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-label={label(s.id)}
                aria-disabled={!s.ready}
                tabIndex={selected ? 0 : -1}
                onClick={() => s.ready && select(s.id)}
                className={`relative z-10 min-h-[2.75rem] whitespace-nowrap rounded-full px-3 text-small font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-black/60 sm:px-5 ${
                  selected ? "text-accent-on" : s.ready ? "text-ink-2 hover:bg-white/10 hover:text-ink" : "cursor-not-allowed text-ink-3 opacity-55"
                }`}
              >
                <span className="sm:hidden">{shortLabel(s.id)}</span>
                <span className="hidden sm:inline">{label(s.id)}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
