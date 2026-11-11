"use client";

import { useEffect } from "react";

/**
 * Plays the "Our approach" entrance once. The section is only hidden after
 * this runs (data-motion="armed"), so without JavaScript, under reduced motion
 * or if anything fails, everything stays visible. When a quarter of the
 * section is on screen it switches to "play" and the CSS sequence runs.
 */
export default function ApproachMotion({ targetId }: { targetId: string }) {
  useEffect(() => {
    const el = document.getElementById(targetId);
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    el.dataset.motion = "armed";
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        el.dataset.motion = "play";
        io.disconnect();
      },
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [targetId]);
  return null;
}
