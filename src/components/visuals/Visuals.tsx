"use client";

import type { ReactNode } from "react";
import { useLang } from "@/lib/LanguageContext";
import { visualCopy, type FlowCopy } from "@/lib/visualCopy";
import { fillCopy, simulatorFactsFromBlueprint } from "@/lib/simulatorPageCopy";
import { getActiveBlueprint } from "@/features/mock-exam/config/examBlueprint";

/*
 * Lightweight explanatory diagrams. Pure HTML/CSS/inline SVG: no raster
 * images to download, no layout shift, real (translatable, crawlable) text,
 * no animation. Colours use the same semantic classes as the rest of the
 * site so the light Academy theme re-colours them automatically; white text
 * on the indigo badges uses text-[#fff] because that theme remaps text-white.
 * Direction-aware: connectors use logical properties and flip in RTL.
 */

function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Badge({ n }: { n: number }) {
  return (
    <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-caption font-bold text-[#fff]">
      {n}
    </span>
  );
}

function VisualHeader({ eyebrow, heading, sub }: { eyebrow: string; heading: string; sub: string }) {
  return (
    <div className="mb-8 max-w-2xl">
      <span className="label">{eyebrow}</span>
      <h2 className="mt-3 text-2xl font-bold text-white md:text-3xl">{heading}</h2>
      <p className="mt-3 text-body leading-relaxed text-slate-400">{sub}</p>
    </div>
  );
}

function VisualSection({ children }: { children: ReactNode }) {
  return (
    <section className="border-b border-white/[0.06] px-6 py-12 md:py-16">
      <div className="container-page">{children}</div>
    </section>
  );
}

/** Linear step diagram: vertical on mobile, horizontal (direction-aware) from md up. */
function FlowSteps({ copy, values, stack = false }: { copy: FlowCopy; values?: Record<string, string | number>; stack?: boolean }) {
  const f = (s: string) => (values ? fillCopy(s, values) : s);
  return (
    <figure role="group" aria-label={copy.label}>
      <ol className={stack ? "flex flex-col" : "flex flex-col md:flex-row md:items-stretch"}>
        {copy.steps.flatMap((s, i) => {
          const items = [
            <li key={s.title} className="card flex flex-1 flex-col gap-2 p-5">
              <div className="flex items-center gap-3">
                <Badge n={i + 1} />
                <h3 className="text-body font-semibold text-white">{s.title}</h3>
              </div>
              <p className="text-small leading-relaxed text-slate-400">{f(s.desc)}</p>
            </li>,
          ];
          if (i < copy.steps.length - 1) {
            items.push(
              <li key={`a${i}`} aria-hidden="true" className={`flex items-center justify-center py-1 text-slate-400 ${stack ? "" : "md:px-1.5 md:py-0"}`}>
                <Arrow className={stack ? "rotate-90" : "rotate-90 md:rotate-0 md:rtl:rotate-180"} />
              </li>
            );
          }
          return items;
        })}
      </ol>
      {copy.note && <figcaption className="mt-4 max-w-3xl text-small leading-relaxed text-slate-400">{copy.note}</figcaption>}
    </figure>
  );
}

/** Which flow to show. */
export type FlowKind = "mlFlow" | "analyticsFlow";

export function FlowVisual({ kind }: { kind: FlowKind }) {
  const { lang } = useLang();
  const copy = visualCopy[lang][kind];
  return (
    <VisualSection>
      <VisualHeader eyebrow={copy.eyebrow} heading={copy.heading} sub={copy.sub} />
      <FlowSteps copy={copy} />
    </VisualSection>
  );
}

/** Simulator preparation loop; placed inside the simulator product page column. */
export function SimulatorLoopVisual() {
  const { lang } = useLang();
  const copy = visualCopy[lang].simulatorLoop;
  const facts = simulatorFactsFromBlueprint(getActiveBlueprint());
  return (
    <div className="mt-6">
      <h3 className="text-lead font-semibold text-white">{copy.heading}</h3>
      <p className="mb-5 mt-1 text-small leading-relaxed text-slate-400">{copy.sub}</p>
      <FlowSteps copy={copy} values={facts as never} stack />
    </div>
  );
}

export function AgentContextDiagram() {
  const { lang } = useLang();
  const c = visualCopy[lang].agent;
  return (
    <VisualSection>
      <VisualHeader eyebrow={c.eyebrow} heading={c.heading} sub={c.sub} />
      <figure role="group" aria-label={c.label}>
        <div className="flex flex-col md:flex-row md:items-stretch">
          <div className="card flex-1 p-5 md:max-w-[26%]">
            <h3 className="text-small font-semibold uppercase tracking-wide text-slate-400">{c.inputs_title}</h3>
            <ul className="mt-3 space-y-2.5">
              {c.inputs.map((t) => (
                <li key={t} className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-small leading-relaxed text-white">{t}</li>
              ))}
            </ul>
          </div>

          <div aria-hidden="true" className="flex items-center justify-center py-1 text-slate-400 md:px-1.5 md:py-0">
            <Arrow className="rotate-90 md:rotate-0 md:rtl:rotate-180" />
          </div>

          <div className="card flex-[1.6] border-indigo-500/40 p-5">
            <h3 className="text-small font-semibold uppercase tracking-wide text-indigo-400">{c.agent_title}</h3>
            <ol className="mt-3 grid gap-2.5 sm:grid-cols-2">
              {c.steps.map((s, i) => (
                <li key={s.title} className="flex items-start gap-3 rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2.5">
                  <Badge n={i + 1} />
                  <div>
                    <p className="text-body font-semibold leading-snug text-white">{s.title}</p>
                    <p className="mt-0.5 text-small leading-relaxed text-slate-400">{s.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div aria-hidden="true" className="flex items-center justify-center py-1 text-slate-400 md:px-1.5 md:py-0">
            <Arrow className="rotate-90 md:rotate-0 md:rtl:rotate-180" />
          </div>

          <div className="card flex-1 p-5 md:max-w-[28%]">
            <h3 className="text-small font-semibold uppercase tracking-wide text-slate-400">{c.systems_title}</h3>
            <ul className="mt-3 space-y-2.5">
              {c.systems.map((t) => (
                <li key={t} className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-small leading-relaxed text-white">{t}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="card flex items-start gap-3 p-5">
            <span aria-hidden="true" className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
            <div>
              <h3 className="text-body font-semibold text-white">{c.human_title}</h3>
              <p className="mt-1 text-small leading-relaxed text-slate-400">{c.human}</p>
            </div>
          </div>
          <div className="card flex items-start gap-3 p-5">
            <span aria-hidden="true" className="mt-1 h-2 w-2 shrink-0 rounded-full bg-indigo-400" />
            <p className="text-small leading-relaxed text-slate-400">{c.audit}</p>
          </div>
        </div>
      </figure>
    </VisualSection>
  );
}

/** Dashboard layout sketch: abstract shapes only, explicitly labelled as containing no real data. */
export function DashboardSketch() {
  const { lang } = useLang();
  const c = visualCopy[lang].dashboardSketch;
  const panel = "rounded-xl border border-white/[0.07] bg-white/[0.03] p-4";
  return (
    <VisualSection>
      <VisualHeader eyebrow={c.eyebrow} heading={c.heading} sub={c.sub} />
      <figure role="group" aria-label={c.label} className="card p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <span className="rounded-full border border-white/[0.14] px-3 py-1 text-caption font-semibold text-slate-400">{c.chip}</span>
          <span className="rounded-lg border border-dashed border-white/[0.14] px-3 py-1 text-caption text-slate-400">{c.filters}</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className={panel}>
              <p className="text-caption text-slate-400">{c.metric}</p>
              <div className="mt-2 h-5 w-2/5 rounded bg-white/[0.12]" />
              <div className="mt-2 h-2 w-3/5 rounded bg-white/[0.07]" />
            </div>
          ))}
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-[1.6fr_1fr]">
          <div className={panel}>
            <p className="text-caption text-slate-400">{c.trend}</p>
            <svg aria-hidden="true" viewBox="0 0 320 110" preserveAspectRatio="none" className="mt-3 h-28 w-full text-indigo-400" style={{ direction: "ltr" }}>
              <line x1="0" y1="105" x2="320" y2="105" stroke="currentColor" strokeOpacity="0.25" />
              <line x1="0" y1="55" x2="320" y2="55" stroke="currentColor" strokeOpacity="0.12" strokeDasharray="4 4" />
              <polyline points="0,80 50,62 100,70 150,40 200,48 250,22 320,30" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
            </svg>
          </div>
          <div className={panel}>
            <p className="text-caption text-slate-400">{c.breakdown}</p>
            <div className="mt-3 space-y-2.5">
              {["85%", "62%", "48%", "30%"].map((w) => (
                <div key={w} className="h-3.5 rounded bg-indigo-500/40" style={{ width: w }} />
              ))}
            </div>
          </div>
        </div>
      </figure>
    </VisualSection>
  );
}
