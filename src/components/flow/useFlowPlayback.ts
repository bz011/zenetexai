"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";
import { animateSequence } from "motion/mini";

/**
 * Shared playback for every ZentexAI flow diagram (homepage governed flow and
 * the service-page mechanisms). A diagram marks its animated graphics with
 * `data-fx="rail|dot|gate|branch|tick"` and `data-row="<n>"`; this hook plays
 * them in row order, once, when the diagram is at least 30% on screen, through
 * motion/mini (WAAPI, ~3 KB gzip). Text is never animated. With reduced motion
 * (or no IntersectionObserver) it resolves straight to the final state.
 *
 * Storytelling timeline, not a stagger: each transition is <= 240ms and the
 * whole pass is ~2s for nine rows.
 */

export const EASE = [0.22, 1, 0.36, 1] as const;

/** idle -> done values for each animated part. `done` is also the reduced-motion state. */
export const FX = {
  rail: { idle: { transform: "scaleY(0)" }, done: { transform: "scaleY(1)" } },
  railX: { idle: { transform: "scaleX(0)" }, done: { transform: "scaleX(1)" } },
  dot: { idle: { transform: "scale(0)" }, done: { transform: "scale(1)" } },
  gate: { idle: { opacity: "0" }, done: { opacity: "1" } },
  branch: { idle: { opacity: "0" }, done: { opacity: "1" } },
  tick: { idle: { transform: "scaleY(0.25)", opacity: "0.35" }, done: { transform: "scaleY(1)", opacity: "1" } },
} as const;
export type FxName = keyof typeof FX;

export function setFxState(root: HTMLElement, state: "idle" | "done") {
  root.querySelectorAll<HTMLElement | SVGElement>("[data-fx]").forEach((el) => {
    const name = el.getAttribute("data-fx") as FxName;
    Object.assign(el.style, FX[name][state]);
  });
}

interface Options {
  stepSeconds?: number;
  startSeconds?: number;
}

export function useFlowPlayback<T extends HTMLElement>(ref: RefObject<T | null>, { stepSeconds = 0.18, startSeconds = 0.4 }: Options = {}) {
  const controls = useRef<{ stop: () => void } | null>(null);
  const reducedRef = useRef(false);

  const play = useCallback(() => {
    const root = ref.current;
    if (!root) return;
    controls.current?.stop();
    if (reducedRef.current) {
      setFxState(root, "done");
      return;
    }
    setFxState(root, "idle");
    const sequence: unknown[] = [];
    root.querySelectorAll<HTMLElement | SVGElement>("[data-fx]").forEach((el) => {
      const name = el.getAttribute("data-fx") as FxName;
      const row = Number(el.getAttribute("data-row") ?? 0);
      const to = FX[name].done as Record<string, string>;
      const from = FX[name].idle as Record<string, string>;
      const keyframes: Record<string, string[]> = {};
      for (const key of Object.keys(to)) keyframes[key] = [from[key], to[key]];
      sequence.push([el, keyframes, { duration: name === "rail" || name === "railX" ? 0.24 : 0.2, ease: EASE, at: startSeconds + row * stepSeconds }]);
    });
    controls.current = animateSequence(sequence as never);
  }, [ref, startSeconds, stepSeconds]);

  useEffect(() => {
    reducedRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const root = ref.current;
    if (!root) return;
    if (!("IntersectionObserver" in window)) {
      setFxState(root, "done");
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          observer.disconnect();
          play();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(root);
    return () => {
      observer.disconnect();
      controls.current?.stop();
    };
  }, [play, ref]);

  return { play };
}
