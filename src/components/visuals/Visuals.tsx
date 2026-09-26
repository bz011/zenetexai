"use client";

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

