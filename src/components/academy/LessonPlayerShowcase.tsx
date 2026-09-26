"use client";

import { useEffect, useRef } from "react";
import CropImage from "@/components/ui/CropImage";
import { useLang } from "@/lib/LanguageContext";
import { LESSON_PLAYER as P, academyShowcaseCopy } from "@/lib/academyCopy";

/**
 * Hero product showcase for the Academy: the REAL lesson-player screenshot,
 * cropped two ways. Desktop layers the video player (behind) and the course
 * outline (in front) - both from the same authentic image - with a depth shift
 * of at most 12px in response to the pointer. Below lg it is a single clean
 * crop of the outline. No mock-up, no fabricated UI, no browser/laptop frame.
 */
export default function LessonPlayerShowcase() {
  const { lang } = useLang();
  const c = academyShowcaseCopy[lang];
  const layers = useRef<HTMLDivElement>(null);

  // Motion class: hierarchy/depth only. Fine pointer, no reduced motion, >= lg.
  useEffect(() => {
    const el = layers.current;
    if (!el) return;
    const ok = window.matchMedia("(min-width: 1024px) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    if (!ok.matches) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width - 0.5) * 2;
      const y = ((e.clientY - r.top) / r.height - 0.5) * 2;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty("--dx", x.toFixed(3));
        el.style.setProperty("--dy", y.toFixed(3));
      });
    };
    const onLeave = () => {
      el.style.setProperty("--dx", "0");
      el.style.setProperty("--dy", "0");
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <figure>
      {/* Desktop: two crops of one screenshot, layered. Max shift: 4px behind, 8px in front. */}
      <div ref={layers} className="relative hidden aspect-[9/8] lg:block">
        <div
          className="media-frame absolute start-0 top-0 w-[86%] transition-transform duration-200 ease-out"
          style={{ transform: "translate3d(calc(var(--dx, 0) * -4px), calc(var(--dy, 0) * -3px), 0)" }}
        >
          <CropImage src={P.src} srcWidth={P.width} srcHeight={P.height} crop={P.player} alt={c.altPlayer} priority />
        </div>
        <div
          className="media-frame absolute bottom-0 end-0 w-[54%] transition-transform duration-200 ease-out"
          style={{ transform: "translate3d(calc(var(--dx, 0) * 8px), calc(var(--dy, 0) * 6px), 0)" }}
        >
          <CropImage src={P.src} srcWidth={P.width} srcHeight={P.height} crop={P.outline} alt={c.altOutline} />
        </div>
      </div>

      {/* Mobile / tablet: one clean crop */}
      <div className="mx-auto max-w-sm lg:hidden">
        <div className="media-frame">
          <CropImage src={P.src} srcWidth={P.width} srcHeight={P.height} crop={P.outline} alt={c.altOutline} priority />
        </div>
      </div>

      <figcaption className="mt-5">
        <p className="text-small text-ink-2">{c.caption}</p>
        <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-3">
          {c.points.map((p) => (
            <div key={p.term} className="border-t border-line-strong pt-3">
              <dt className="text-caption font-semibold text-ink">{p.term}</dt>
              <dd className="mt-0.5 text-caption text-ink-3">{p.desc}</dd>
            </div>
          ))}
        </dl>
      </figcaption>
    </figure>
  );
}
