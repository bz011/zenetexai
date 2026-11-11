"use client";

import { useEffect } from "react";

/**
 * Entrance layer for the prototypes. Content is fully visible without
 * JavaScript and under prefers-reduced-motion: only when this runs does the
 * page opt in (html[data-motion="on"]) and hide [data-reveal] elements until
 * they scroll into view. Each element may carry --i (its order in a group)
 * for a 70ms stagger. Transform and opacity only.
 */
export default function LabMotion() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = document.documentElement;
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    // Anything already on screen shows immediately, so the first paint never blanks.
    const vh = window.innerHeight;
    els.forEach((el) => {
      if (el.getBoundingClientRect().top < vh * 0.92) el.dataset.shown = "";
    });
    root.dataset.motion = "on";
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            (e.target as HTMLElement).dataset.shown = "";
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px" }
    );
    els.forEach((el) => {
      if (!("shown" in el.dataset)) io.observe(el);
    });
    return () => {
      io.disconnect();
      delete root.dataset.motion;
    };
  }, []);
  return null;
}
