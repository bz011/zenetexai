"use client";

import { useRef } from "react";
import { FX, useFlowPlayback } from "@/components/flow/useFlowPlayback";
import Section from "@/components/ui/Section";
import SectionHeader from "@/components/ui/SectionHeader";
import { useLang } from "@/lib/LanguageContext";
import { mechanismCopy, type MechanismKind } from "@/lib/mechanismCopy";

/**
 * A service's mechanism in the site's flow -> gate -> decision language:
 * numbered stages joined by a rail, with the control (gate) that must be passed
 * between them named in words. Vertical on small screens, horizontal from lg.
 * All text is semantic HTML (an ordered list); the rail, nodes and gate marks
 * are SVG/CSS graphics animated once by the shared flow playback.
 */
export default function MechanismFlow({ kind }: { kind: MechanismKind }) {
  const { lang } = useLang();
  const c = mechanismCopy[lang][kind];
  const ref = useRef<HTMLElement | null>(null);
  useFlowPlayback(ref);
  const last = c.stages.length - 1;

  return (
    <figure ref={ref} role="group" aria-label={c.label}>
      <ol className="grid gap-0 lg:grid-cols-5 lg:gap-x-0">
        {c.stages.map((stage, i) => {
          const gate = i > 0 ? c.gates[i - 1] : null;
          return (
            <li key={stage.title} className="relative ps-10 pb-7 lg:ps-0 lg:pb-0 lg:pe-6">
              {/* mobile: vertical rail */}
              <svg aria-hidden="true" className="absolute inset-y-0 start-0 h-full w-7 overflow-visible lg:hidden" viewBox="0 0 28 100" preserveAspectRatio="none">
                <rect x="13" y={i === 0 ? 10 : 0} width="2" height={i === last ? 10 : i === 0 ? 90 : 100} className="fill-line-strong" />
                <rect
                  data-fx="rail"
                  data-row={i}
                  x="13"
                  y={i === 0 ? 10 : 0}
                  width="2"
                  height={i === last ? 10 : i === 0 ? 90 : 100}
                  className="fill-accent"
                  style={{ transform: FX.rail.idle.transform, transformBox: "fill-box", transformOrigin: "50% 0%" }}
                />
                {gate && <rect data-fx="gate" data-row={i} x="6" y="0" width="16" height="2" className="fill-accent-2" style={{ opacity: 0 }} />}
              </svg>
              <span aria-hidden="true" className="absolute start-[7px] top-[4px] flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-line-strong bg-surface-1 lg:hidden">
                <span data-fx="dot" data-row={i} className="h-1.5 w-1.5 rounded-full bg-accent" style={{ transform: FX.dot.idle.transform }} />
              </span>

              {/* desktop: horizontal rail */}
              <div aria-hidden="true" className="relative hidden h-4 lg:block">
                <span className="absolute start-0 top-1/2 flex h-3.5 w-3.5 -translate-y-1/2 items-center justify-center rounded-full border-2 border-line-strong bg-surface-1">
                  <span data-fx="dot" data-row={i} className="h-1.5 w-1.5 rounded-full bg-accent" style={{ transform: FX.dot.idle.transform }} />
                </span>
                {i < last && (
                  <>
                    <span className="absolute start-4 end-0 top-1/2 h-0.5 -translate-y-1/2 bg-line-strong" />
                    <span
                      data-fx="railX"
                      data-row={i}
                      className="absolute start-4 end-0 top-1/2 h-0.5 -translate-y-1/2 origin-left bg-accent rtl:origin-right"
                      style={{ transform: FX.railX.idle.transform }}
                    />
                  </>
                )}
                {gate && <span data-fx="gate" data-row={i} className="absolute -start-3 top-1/2 h-3 w-0.5 -translate-y-1/2 bg-accent-2" style={{ opacity: 0 }} />}
              </div>

              {gate && <p className="text-caption font-medium text-accent-2-fg lg:mt-3">{gate}</p>}
              <h3 className={`text-small font-semibold text-ink ${gate ? "mt-1" : "lg:mt-3"}`}>
                <span className="text-ink-3">{i + 1}</span> {stage.title}
              </h3>
              <p className="mt-1 text-small text-ink-2">{stage.desc}</p>
            </li>
          );
        })}
      </ol>
      {c.note && <figcaption className="mt-6 text-caption text-ink-3">{c.note}</figcaption>}
    </figure>
  );
}

/** Section wrapper: header + the mechanism, in the shared section rhythm. */
export function MechanismSection({ kind }: { kind: MechanismKind }) {
  const { lang } = useLang();
  const c = mechanismCopy[lang][kind];
  return (
    <Section bordered aria-label={c.heading}>
      <SectionHeader eyebrow={c.eyebrow} title={c.heading} description={c.sub} />
      <MechanismFlow kind={kind} />
    </Section>
  );
}
