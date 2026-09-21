"use client";

import { useEffect, useRef, useState, type ReactElement } from "react";
import LocaleLink from "@/components/LocaleLink";
import { useLang } from "@/lib/LanguageContext";
import { HERO_CARD_LINKS, HERO_CARD_POSITIONS, heroCopy, type HeroCardId } from "@/lib/heroCopy";
import type { BrainSceneHandle } from "@/components/hero/brainScene";

const ICONS: Record<HeroCardId, ReactElement> = {
  pmp: <path d="M3 9l9-4 9 4-9 4-9-4zm4 2.5V16c0 1.2 2.2 2.5 5 2.5s5-1.3 5-2.5v-4.5M21 9v5" />,
  simulator: <path d="M12 7v5l3 2M12 3a9 9 0 100 18 9 9 0 000-18zM9 1h6" />,
  agents: <path d="M12 3v3M7 8h10a2 2 0 012 2v6a2 2 0 01-2 2H7a2 2 0 01-2-2v-6a2 2 0 012-2zm2.5 5h.01M14.5 13h.01M9 21h6" />,
  data: <path d="M4 20V10m6 10V4m6 16v-7m4 7H2" />,
  ml: <path d="M6 7a2 2 0 100-4 2 2 0 000 4zm12 0a2 2 0 100-4 2 2 0 000 4zM12 21a2 2 0 100-4 2 2 0 000 4zM6 7l6 10M18 7l-6 10M6 5h12" />,
};

function webglAvailable(): boolean {
  try {
    const c = document.createElement("canvas");
    const gl = (c.getContext("webgl2") || c.getContext("webgl")) as WebGLRenderingContext | null;
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

/**
 * The hero's right-hand stage: a static poster (always), an optional 3D scene
 * layered over it, and the service cards. The cards are ordinary links in the
 * server-rendered HTML; the 3D layer is progressive enhancement that only
 * loads on desktop-sized screens with WebGL and no reduced-motion preference.
 */
export default function HeroStage() {
  const { lang } = useLang();
  const copy = heroCopy[lang];
  const stageRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<BrainSceneHandle | null>(null);
  const [sceneReady, setSceneReady] = useState(false);
  const [active, setActive] = useState<HeroCardId | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const desktop = window.matchMedia("(min-width: 1024px)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let cancelled = false;
    let starting = false;
    let idleId: number | undefined;
    let usedIdle = false;
    const idle = window as unknown as {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    const stop = () => {
      handleRef.current?.dispose();
      handleRef.current = null;
      setSceneReady(false);
    };

    const start = () => {
      if (starting || handleRef.current || cancelled) return;
      if (!desktop.matches || reduce.matches || !webglAvailable()) return;
      starting = true;
      import("@/components/hero/brainScene")
        .then((m) => m.mountBrainScene(host, () => stop()))
        .then((handle) => {
          if (cancelled || !desktop.matches || reduce.matches) return handle.dispose();
          handleRef.current = handle;
          setSceneReady(true);
        })
        .catch(() => {
          /* WebGL failed: the static poster stays, nothing else to do. */
        })
        .finally(() => {
          starting = false;
        });
    };

    const schedule = () => {
      const run = () => start();
      usedIdle = typeof idle.requestIdleCallback === "function";
      idleId = usedIdle ? idle.requestIdleCallback!(run, { timeout: 1500 }) : window.setTimeout(run, 700);
    };

    const evaluate = () => {
      if (desktop.matches && !reduce.matches) schedule();
      else stop();
    };

    if (document.readyState === "complete") evaluate();
    else window.addEventListener("load", evaluate, { once: true });
    desktop.addEventListener("change", evaluate);
    reduce.addEventListener("change", evaluate);

    return () => {
      cancelled = true;
      window.removeEventListener("load", evaluate);
      desktop.removeEventListener("change", evaluate);
      reduce.removeEventListener("change", evaluate);
      if (idleId !== undefined) {
        if (usedIdle) idle.cancelIdleCallback?.(idleId);
        else window.clearTimeout(idleId);
      }
      handleRef.current?.dispose();
      handleRef.current = null;
    };
  }, []);

  const onPointerMove = (e: React.PointerEvent) => {
    const el = stageRef.current;
    if (!el || !handleRef.current || e.pointerType === "touch") return;
    const r = el.getBoundingClientRect();
    handleRef.current.setPointer(((e.clientX - r.left) / r.width - 0.5) * 2, ((e.clientY - r.top) / r.height - 0.5) * 2);
  };

  return (
    <div ref={stageRef} onPointerMove={onPointerMove} onPointerLeave={() => handleRef.current?.setPointer(0, 0)} className="relative w-full lg:aspect-[4/3]">
      {/* Poster: what every visitor sees first; kept for mobile, reduced motion and no-WebGL. */}
      <div className={`pointer-events-none absolute inset-0 hidden transition-opacity duration-700 lg:block ${sceneReady ? "opacity-0" : "opacity-100"}`}>
        {/* A frame captured from the 3D scene itself, so the fallback matches what the animation shows. Decorative. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/hero/brain-poster.webp" alt="" width={751} height={563} loading="lazy" decoding="async" aria-hidden="true" className="absolute inset-0 h-full w-full object-contain" />
      </div>
      <div ref={hostRef} className="pointer-events-none absolute inset-0 hidden lg:block" data-hero-3d-host />

      {/* Connectors from each card toward the brain (desktop only, decorative). */}
      <svg aria-hidden="true" focusable="false" viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 hidden h-full w-full rtl:-scale-x-100 lg:block">
        {(Object.keys(HERO_CARD_LINKS) as HeroCardId[]).map((id) => {
          const { from, to } = HERO_CARD_LINKS[id];
          const on = active === id;
          const cx = (from.x + to.x) / 2, cy = from.y + (to.y - from.y) * 0.15;
          return (
            <g key={id}>
              <path d={`M${from.x} ${from.y} Q${cx} ${cy} ${to.x} ${to.y}`} fill="none" stroke={on ? "rgba(125,211,252,0.85)" : "rgba(125,211,252,0.22)"} strokeWidth={on ? 1.5 : 1} vectorEffect="non-scaling-stroke" style={{ transition: "stroke 200ms" }} />
              <circle cx={to.x} cy={to.y} r="0.8" fill={on ? "#7dd3fc" : "rgba(125,211,252,0.5)"} />
            </g>
          );
        })}
      </svg>

      <ul aria-label={copy.cardsLabel} className="relative grid gap-3 sm:grid-cols-2 lg:absolute lg:inset-0 lg:block">
        {copy.cards.map((card) => {
          const pos = HERO_CARD_POSITIONS[card.id];
          return (
            <li
              key={card.id}
              className="last:sm:col-span-2 lg:absolute lg:w-[27%] lg:min-w-[11rem] lg:-translate-x-1/2 lg:-translate-y-1/2 lg:[inset-inline-start:var(--x)] lg:top-[var(--y)] lg:rtl:translate-x-1/2 lg:last:col-span-1"
              style={{ ["--x" as string]: `${pos.x}%`, ["--y" as string]: `${pos.y}%` }}
            >
              <LocaleLink
                href={card.href}
                onMouseEnter={() => setActive(card.id)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(card.id)}
                onBlur={() => setActive(null)}
                className="group relative flex h-full items-start gap-2.5 rounded-2xl border border-sky-400/25 bg-slate-950/60 p-3 backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-300/60 hover:bg-slate-900/70 hover:shadow-[0_0_28px_rgba(56,189,248,0.22)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              >
                <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-400/10 text-sky-300">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{ICONS[card.id]}</svg>
                </span>
                <span className="min-w-0 flex-1 pe-4">
                  <span className="block text-small font-semibold leading-snug text-white">{card.title}</span>
                  <span className="mt-0.5 block text-small leading-snug text-slate-300 lg:hidden min-[1360px]:block">{card.desc}</span>
                </span>
                <svg aria-hidden="true" viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="absolute end-2.5 top-3 shrink-0 text-sky-300 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5 motion-reduce:transition-none">
                  <path d="M4 10h11m-4-4l4 4-4 4" />
                </svg>
              </LocaleLink>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
