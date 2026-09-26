"use client";

import { forwardRef, useCallback, useRef } from "react";
import { FX, useFlowPlayback } from "@/components/flow/useFlowPlayback";
import { useLang } from "@/lib/LanguageContext";
import { visualCopy } from "@/lib/visualCopy";
import { flowCopy } from "@/lib/flowCopy";

/**
 * The ZentexAI governed flow: work enters, passes controlled stages (gates),
 * reaches approved systems, a human-handoff branch exists for anything outside
 * permissions, and every step lands in an audit trail.
 *
 * LEVEL A of the homepage visual: semantic HTML (an ordered list you can read,
 * search and hear) + inline SVG rails/gates + Motion. It is also the mobile,
 * reduced-motion and no-WebGL rendering of the same concept. All meaningful
 * text is HTML and visible from the first paint; motion only changes graphics
 * (rails, markers, ticks) from idle to done, once, when the diagram is on
 * screen. Copy comes from visualCopy.agent (the AI Agents page's own wording).
 *
 * Motion is used through `motion/mini` (WAAPI, ~3 KB gzip) rather than the full
 * React animation runtime (~40 KB) - the diagram needs a timeline, not springs
 * or gestures, and the homepage's JavaScript budget matters more.
 */

type RowKind = "input" | "gate" | "stage" | "systems";
interface RowSpec {
  kind: RowKind;
  key: string;
}

// Row order, top to bottom. Gates sit on the rail between rows.
const ROWS: RowSpec[] = [
  { kind: "input", key: "input" },
  { kind: "gate", key: "knowledge" },
  { kind: "stage", key: "0" },
  { kind: "stage", key: "1" },
  { kind: "gate", key: "permission" },
  { kind: "stage", key: "2" },
  { kind: "stage", key: "3" },
  { kind: "gate", key: "result" },
  { kind: "systems", key: "systems" },
];

function Rail({ first, last, gate, row }: { first: boolean; last: boolean; gate: boolean; row: number }) {
  // Spans the whole row and stretches vertically only (viewBox is 28px wide,
  // the same as its column), so lines stay crisp at any row height.
  const top = first ? 10 : 0;
  const bottom = last ? 10 : 100;
  return (
    <svg aria-hidden="true" className="flow-2d absolute inset-y-0 start-0 h-full w-7 overflow-visible" viewBox="0 0 28 100" preserveAspectRatio="none">
      <rect x="13" y={top} width="2" height={bottom - top} className="fill-line-strong" />
      <rect
        data-fx="rail"
        data-row={row}
        x="13"
        y={top}
        width="2"
        height={bottom - top}
        className="fill-accent"
        style={{ transform: FX.rail.idle.transform, transformBox: "fill-box", transformOrigin: "50% 0%" }}
      />
      {gate && (
        <>
          <rect x="6" y="49" width="16" height="2" className="fill-line-strong" />
          <rect data-fx="gate" data-row={row} x="6" y="49" width="16" height="2" className="fill-accent-2" style={{ opacity: 0 }} />
        </>
      )}
    </svg>
  );
}

function Node({ row }: { row: number }) {
  return (
    <span aria-hidden="true" className="flow-2d absolute start-[7px] top-[4px] flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-line-strong bg-surface-1">
      <span data-fx="dot" data-row={row} className="h-1.5 w-1.5 rounded-full bg-accent" style={{ transform: FX.dot.idle.transform }} />
    </span>
  );
}

const GovernedFlow = forwardRef<HTMLElement, { showReplay?: boolean; className?: string }>(function GovernedFlow({ showReplay = false, className = "" }, forwardedRef) {
  const { lang } = useLang();
  const c = visualCopy[lang].agent;
  const f = flowCopy[lang];
  const ref = useRef<HTMLElement | null>(null);
  const setRef = useCallback(
    (node: HTMLElement | null) => {
      ref.current = node;
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    },
    [forwardedRef]
  );
  const { play } = useFlowPlayback(ref);

  return (
    <figure ref={setRef} role="group" aria-label={c.label} className={`mechanism relative p-5 md:p-6 ${className}`}>
      <div className="relative z-[1] flex items-center justify-between gap-4">
        <h2 className="label">{f.title}</h2>
        {showReplay && (
          <button type="button" onClick={play} className="hidden text-caption font-medium text-ink-3 underline-offset-4 hover:text-ink hover:underline motion-safe:inline">
            {f.replay}
          </button>
        )}
      </div>

      <ol className="relative z-[1] mt-4">
        {ROWS.map((row, i) => {
          const isGate = row.kind === "gate";
          const last = i === ROWS.length - 1;
          return (
            <li key={row.key} data-flow-row={i} data-kind={row.kind} data-role={row.kind === "stage" && row.key === "1" ? "decide" : undefined} className={`relative ps-10 ${isGate ? "py-1.5" : last ? "pb-0" : "pb-3"}`}>
              <Rail first={i === 0} last={last} gate={isGate} row={i} />
              {!isGate && <Node row={i} />}

              {row.kind === "input" && (
                <>
                  <h3 className="text-small font-semibold text-ink">{c.inputs_title}</h3>
                  <p className="mt-1 text-small leading-snug text-ink-2">{c.inputs.join(" · ")}</p>
                </>
              )}

              {isGate && <p className="text-caption font-medium text-accent-2-fg">{f.gates[row.key as keyof typeof f.gates]}</p>}

              {row.kind === "stage" && (
                <>
                  <h3 className="text-small font-semibold text-ink">
                    <span className="text-ink-3">{Number(row.key) + 1}</span> {c.steps[Number(row.key)].title}
                  </h3>
                  <p className="mt-0.5 text-small leading-snug text-ink-2">{c.steps[Number(row.key)].desc}</p>
                  {row.key === "1" && (
                    <div data-flow="handoff" className="relative mt-2.5 rounded-inner border border-dashed border-line-strong px-3 py-2">
                      <span
                        aria-hidden="true"
                        data-fx="branch"
                        data-row={i}
                        className="pointer-events-none absolute inset-[-1px] rounded-inner border border-dashed border-accent-2"
                        style={{ opacity: 0 }}
                      />
                      <p className="text-caption font-semibold text-ink">{c.human_title}</p>
                      <p className="mt-0.5 text-caption text-ink-2">{c.human}</p>
                    </div>
                  )}
                </>
              )}

              {row.kind === "systems" && (
                <>
                  <h3 className="text-small font-semibold text-ink">{c.systems_title}</h3>
                  <p className="mt-1 text-small leading-snug text-ink-2">{c.systems.join(" · ")}</p>
                </>
              )}
            </li>
          );
        })}
      </ol>

      <div className="relative z-[1] mt-4 border-t border-line pt-3.5">
        <div className="flex items-center gap-3">
          <p className="text-caption font-semibold uppercase tracking-[0.1em] text-ink-2">{f.auditTitle}</p>
          <div aria-hidden="true" className="flex flex-1 items-center gap-1">
            {ROWS.map((row, i) => (
              <span
                key={row.key}
                data-fx="tick"
                data-row={i}
                className="h-3 max-w-[10px] flex-1 rounded-[1px] bg-accent-2"
                style={{ transform: FX.tick.idle.transform, opacity: FX.tick.idle.opacity, transformOrigin: "50% 100%" }}
              />
            ))}
          </div>
        </div>
        <p className="mt-2 text-caption text-ink-3">{c.audit}</p>
      </div>
    </figure>
  );
});

export default GovernedFlow;
