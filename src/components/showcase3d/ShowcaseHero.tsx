"use client";

import { useEffect, useRef, useState } from "react";
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
  academy: "Illustrative example, not real student data: a PMP course panel with six modules, a lesson playing on a laptop, a PMP exam simulator showing question 45 of 180, and a certificate of completion earned at the end, with a small card announcing an AI Agents Course as coming soon.",
};

export default function ShowcaseHero({ initial, onFailed }: { initial: ShowcaseServiceId; onFailed: () => void }) {
  const host = useRef<HTMLDivElement | null>(null);
  const handle = useRef<ShowcaseHandle | null>(null);
  const [active, setActive] = useState<ShowcaseServiceId>(initial);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let cancelled = false;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    import("./mountShowcase")
      .then(({ default: mount }) => mount(el, initial, { parallax: !reduce, reducedMotion: reduce }, onFailed))
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
  }, [initial, onFailed]);

  function select(id: ShowcaseServiceId) {
    setActive(id);
    handle.current?.setScene(id);
  }

  return (
    <section aria-label="AI Agents showcase" className="relative overflow-hidden" style={{ minHeight: "clamp(640px, calc(100svh - 73px), 900px)" }}>
      <div ref={host} role="img" aria-label={STAGE_LABELS[active]} data-showcase-host className="pointer-events-none absolute inset-0" />

      <div className="absolute inset-x-0 bottom-7 z-10 flex justify-center px-4">
        <div
          role="tablist"
          aria-label="Service"
          className="flex gap-1 rounded-full border border-white/10 bg-black/35 p-1 backdrop-blur-sm"
        >
          {SHOWCASE_SERVICES.map((s) => {
            const selected = s.id === active;
            return (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-disabled={!s.ready}
                tabIndex={selected ? 0 : -1}
                onClick={() => s.ready && select(s.id)}
                className={`min-h-[2.75rem] rounded-full px-5 text-small font-semibold transition-colors ${
                  selected ? "bg-accent text-accent-on" : s.ready ? "text-ink-2 hover:bg-white/10" : "cursor-not-allowed text-ink-3 opacity-55"
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
