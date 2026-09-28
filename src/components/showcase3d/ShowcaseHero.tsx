"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import LocaleLink from "@/components/LocaleLink";
import type { ShowcaseHandle } from "./mountShowcase";
import { SHOWCASE_SERVICES, type ShowcaseServiceId } from "./showcaseParam";

/**
 * LOOK-DEV ONLY (?showcase=1). ART-DIRECTION CHECKPOINT: the showcase owns the
 * full viewport - no marketing copy competes with it on this stage. The
 * default homepage's real H1/paragraph/CTA are untouched and still exist in
 * HomeContent.tsx; ShowcaseGate only swaps them out client-side, after load,
 * behind this explicit query flag. Final semantic H1 placement for a shipped
 * version is a separate decision - see docs/design-v2/CORE-LOOKDEV.md context.
 *
 * The "illustrative example, not a real conversation" disclosure is preserved
 * as the stage's accessible name (below) rather than as visible text, so this
 * checkpoint's screenshot is not competing with it either; a shipped version
 * should surface it visibly again (e.g. as a caption once real copy returns).
 */

const STAGE_LABELS: Record<ShowcaseServiceId, string> = {
  agents:
    "Illustration, not a real conversation: a customer asks an AI assistant on a phone to book an appointment; the assistant offers times, the customer picks 10:00 AM, and the booking is confirmed and dispatched as a calendar entry and two notifications.",
  data: "Illustrative example, not real customer data: scattered business sources (spreadsheets, databases, cloud apps, PDF documents, APIs) are extracted, cleaned, transformed and unified into one analytics dashboard, which produces business insights, interactive dashboards and automated reports.",
  ml: "Illustrative example, not real business data: a card of historical data (sales, users, transactions, market trends, external factors) feeds a machine learning model, which generates a prediction panel showing a future forecast with a confidence band and three results - demand forecast, churn risk and next month sales.",
  academy:
    "Illustrative example, not real student data: a PMP course panel with six modules, a lesson playing on a laptop, a PMP exam simulator showing question 45 of 180, and a certificate of completion earned at the end, with a small card announcing an AI Agents Course as coming soon.",
};

/** Where each service's call to action goes: each of these is an existing, public page. */
const SERVICE_CTA: Record<ShowcaseServiceId, { label: string; href: string; short: string }> = {
  agents: { label: "Explore AI Agents", href: "/services/ai-agents-automation-uae", short: "Agents" },
  data: { label: "Explore Data & Analytics", href: "/services/data-analytics-uae", short: "Data" },
  ml: { label: "Explore Machine Learning", href: "/services/machine-learning-uae", short: "ML" },
  academy: { label: "Explore Academy", href: "/academy", short: "Academy" },
};

/** Fade the call to action out, swap it, fade it in: ms. */
const CTA_SWAP_MS = 170;

export default function ShowcaseHero({ initial, onFailed }: { initial: ShowcaseServiceId; onFailed: () => void }) {
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
      .then(({ default: mount }) => mount(el, initial, { parallax: fine && !reduce, reducedMotion: reduce, onSwipe: reduce ? undefined : (d) => step(d) }, onFailed))
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
  }, [initial, onFailed, step]);

  // the call to action follows the selected service: fade out, swap, fade in
  useEffect(() => {
    if (active === ctaFor) return;
    setCtaVisible(false);
    const t = window.setTimeout(() => {
      setCtaFor(active);
      setCtaVisible(true);
    }, CTA_SWAP_MS);
    return () => window.clearTimeout(t);
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
    if (e.key === "ArrowRight") next = (i + 1) % ready.length;
    else if (e.key === "ArrowLeft") next = (i - 1 + ready.length) % ready.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = ready.length - 1;
    if (next < 0) return;
    e.preventDefault();
    const id = ready[next].id;
    select(id);
    tabs.current[SHOWCASE_SERVICES.findIndex((s) => s.id === id)]?.focus();
  }

  const cta = SERVICE_CTA[ctaFor];

  return (
    <section
      aria-label="Services showcase"
      className="relative overflow-hidden"
      // horizontal swipes are ours (switch service); vertical panning stays with the page
      style={{ minHeight: "clamp(560px, calc(100svh - 73px), 900px)", touchAction: "pan-y" }}
    >
      <div ref={host} role="img" aria-label={STAGE_LABELS[active]} data-showcase-host className="pointer-events-none absolute inset-0" />

      {/*
        The site-wide WhatsApp button (fixed bottom-5 right-5, 48px, z-40) sits in this same corner. Below the "sm"
        breakpoint this bar isn't wide enough to clear it on its own, so it gets extra right padding there only -
        pulling the centred content left just enough that the last tab never sits under the widget.
      */}
      <div
        className="absolute inset-x-0 z-10 flex flex-col items-center gap-3 px-3 pr-16 sm:px-4 sm:pr-4"
        style={{ bottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
      >
        <LocaleLink
          href={cta.href}
          aria-hidden={ctaVisible ? undefined : true}
          tabIndex={ctaVisible ? 0 : -1}
          className={`group inline-flex min-h-[2.75rem] items-center gap-2 rounded-full border border-white/15 bg-black/40 px-5 text-small font-semibold text-ink backdrop-blur-sm transition-[opacity,background-color,border-color,transform] duration-150 hover:border-white/30 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-black/60 ${
            ctaVisible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-1 opacity-0"
          }`}
        >
          {cta.label}
          <span aria-hidden className="transition-transform duration-150 group-hover:translate-x-0.5">
            →
          </span>
        </LocaleLink>

        <div
          ref={list}
          role="tablist"
          aria-label="Service"
          onKeyDown={onKeyDown}
          className="relative flex max-w-full gap-0.5 rounded-full border border-white/10 bg-black/40 p-1 backdrop-blur-sm sm:gap-1"
        >
          {indicator && (
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
                aria-label={s.label}
                aria-disabled={!s.ready}
                tabIndex={selected ? 0 : -1}
                onClick={() => s.ready && select(s.id)}
                className={`relative z-10 min-h-[2.75rem] whitespace-nowrap rounded-full px-3 text-small font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-black/60 sm:px-5 ${
                  selected ? "text-accent-on" : s.ready ? "text-ink-2 hover:bg-white/10 hover:text-ink" : "cursor-not-allowed text-ink-3 opacity-55"
                }`}
              >
                <span className="sm:hidden">{SERVICE_CTA[s.id].short}</span>
                <span className="hidden sm:inline">{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
