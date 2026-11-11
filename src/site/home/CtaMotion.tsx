"use client";

import { useEffect } from "react";

/**
 * The final CTA's motion. The entrance plays once: content is only hidden
 * after this runs (data-motion="armed"), so without JavaScript, under reduced
 * motion or on any failure everything stays visible. The slow line motion runs
 * only while the band is on screen (data-live), and never under reduced motion.
 */
export default function CtaMotion({ targetId }: { targetId: string }) {
  useEffect(() => {
    const el = document.getElementById(targetId);
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    el.dataset.motion = "armed";
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && e.intersectionRatio >= 0.3) el.dataset.motion = "play";
        if (e.isIntersecting) el.dataset.live = "";
        else delete el.dataset.live;
      },
      { threshold: [0, 0.3] }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      delete el.dataset.live;
    };
  }, [targetId]);
  return null;
}
