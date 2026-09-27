"use client";

import { useEffect, useRef } from "react";
import { CORE_INPUTS, CORE_OUTPUTS, type CoreParams } from "./coreParam";

/**
 * Look-dev host for the Intelligence Core. Fills the right side of the hero and
 * bleeds to the viewport edge (no card, no border). The labels are HTML; the
 * mount positions them from the scene. Only rendered when the URL selects a
 * variant (?core=A|B|C) - see components/flow/HeroVisual.tsx.
 */
export default function CoreStage({ params, onFailed }: { params: CoreParams; onFailed: () => void }) {
  const host = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let cancelled = false;
    let dispose: (() => void) | null = null;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    import("./mountCore")
      .then(({ default: mount }) => {
        if (cancelled) return;
        try {
          const h = mount(el, params.variant, params.view, { parallax: !reduce }, onFailed);
          dispose = h.dispose;
        } catch {
          onFailed();
        }
      })
      .catch(onFailed);
    return () => {
      cancelled = true;
      dispose?.();
    };
  }, [params.variant, params.view, onFailed]);

  const label = "pointer-events-none absolute left-0 top-0 opacity-0 will-change-transform";
  const text = "font-mono text-[11px] uppercase tracking-[0.14em] text-ink-2 whitespace-nowrap";

  return (
    <div
      ref={host}
      data-core-host
      className="pointer-events-none absolute inset-y-[-3rem] -start-6 z-0 hidden lg:block"
      style={{ insetInlineEnd: "calc(-1 * max(var(--gutter), (100vw - var(--content-max)) / 2 + var(--gutter)))" }}
    >
      {CORE_INPUTS.map((t, i) => (
        <div key={t} data-anchor={`in-${i}`} className={label}>
          <span className={`${text} -translate-x-full -translate-y-1/2 inline-flex items-center gap-2 pe-1`}>
            {t}
            <span aria-hidden="true" className="inline-block h-px w-3 bg-ink-3" />
          </span>
        </div>
      ))}
      {CORE_OUTPUTS.map((t, i) => (
        <div key={t} data-anchor={`out-${i}`} className={label}>
          <span className={`${text} -translate-y-1/2 inline-flex items-center gap-2 ps-1`}>
            <span aria-hidden="true" className="inline-block h-px w-3 bg-ink-3" />
            {t}
          </span>
        </div>
      ))}
    </div>
  );
}
