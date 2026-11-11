"use client";

import { useEffect, useRef } from "react";

/**
 * Light and particles flowing along the static dataflow wave. The image is
 * never transformed; this canvas, laid exactly over it, draws:
 *  - pulses of light that run the length of the wave along its strands;
 *  - fine motes that drift a short way along the wave and fade;
 *  - the artwork's own painted lights glowing softly, one after another.
 * Positions are fractions of the image (u across, v down). The wave's spine is
 * traced from the artwork (the weighted centre of its colour, every 5% of the
 * width); strands weave around it. Every value is periodic in (time mod LOOP),
 * so the loop is seamless. Flow follows the reading direction (`flow` = -1 in
 * Arabic). Not started under prefers-reduced-motion (the image is the static
 * fallback), paused off-screen and in background tabs.
 */

const LOOP = 10000;
const TAU = Math.PI * 2;

// Centre of the wave at u = 0, 0.05, ... 1 (measured from dataflow-waves.png).
const SPINE = [0.385, 0.37, 0.395, 0.46, 0.53, 0.534, 0.49, 0.455, 0.478, 0.54, 0.61, 0.634, 0.646, 0.625, 0.565, 0.521, 0.44, 0.419, 0.39, 0.4, 0.43];

function spine(u: number) {
  const x = Math.min(0.9999, Math.max(0, u)) * (SPINE.length - 1);
  const i = Math.floor(x);
  const f = x - i;
  const p0 = SPINE[Math.max(0, i - 1)], p1 = SPINE[i], p2 = SPINE[i + 1], p3 = SPINE[Math.min(SPINE.length - 1, i + 2)];
  // Catmull-Rom
  return 0.5 * (2 * p1 + (-p0 + p2) * f + (2 * p0 - 5 * p1 + 4 * p2 - p3) * f * f + (-p0 + 3 * p1 - 3 * p2 + p3) * f * f * f);
}

type Strand = { amp: number; freq: number; phase: number };
const strandV = (s: Strand, u: number) => spine(u) + s.amp * Math.sin(TAU * s.freq * u + s.phase);

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sprite(rgb: string, size = 64) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, `rgba(${rgb},1)`);
  grad.addColorStop(0.2, `rgba(${rgb},0.8)`);
  grad.addColorStop(0.5, `rgba(${rgb},0.18)`);
  grad.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  return c;
}

function build() {
  const rnd = mulberry32(20261031);
  const strands: Strand[] = [
    { amp: 0.0, freq: 1, phase: 0 },
    { amp: 0.055, freq: 2, phase: 0.6 },
    { amp: 0.07, freq: 1.5, phase: 2.4 },
    { amp: 0.045, freq: 3, phase: 4.1 },
    { amp: 0.06, freq: 2.5, phase: 1.3 },
  ];
  const pulses = [
    { strand: 1, k: 1, phase: 0.0, len: 0.09, color: "250, 212, 150", width: 2.2 },
    { strand: 2, k: 1, phase: 0.36, len: 0.07, color: "150, 225, 210", width: 2 },
    { strand: 0, k: 1, phase: 0.62, len: 0.1, color: "250, 212, 150", width: 1.8 },
    { strand: 3, k: 2, phase: 0.2, len: 0.06, color: "250, 225, 185", width: 1.4 },
    { strand: 4, k: 1, phase: 0.85, len: 0.08, color: "150, 225, 210", width: 1.6 },
  ];
  const motes = Array.from({ length: 70 }, () => ({
    strand: Math.floor(rnd() * strands.length),
    u: 0.04 + rnd() * 0.88,
    off: (rnd() - 0.5) * 0.08,
    reach: 0.04 + rnd() * 0.06,
    k: rnd() < 0.7 ? 1 : 2,
    phase: rnd(),
    size: 1.2 + rnd() * 2.2,
    alpha: 0.35 + rnd() * 0.45,
    color: ["24, 98, 94", "34, 130, 122", "70, 175, 158", "200, 150, 78", "226, 176, 98"][Math.floor(rnd() * 5)],
    spin: rnd() * Math.PI,
  }));
  // The wave's own brightest painted lights (local brightness peaks of
  // dataflow-waves.png); each glows softly once per loop, in turn.
  const glints = [
    [0.309, 0.564], [0.212, 0.481], [0.138, 0.519], [0.775, 0.387], [0.689, 0.657], [0.829, 0.348],
    [0.462, 0.475], [0.263, 0.646], [0.385, 0.575], [0.893, 0.409], [0.551, 0.757], [0.61, 0.508], [0.506, 0.519],
  ].map(([u, v], i) => ({ u, v, r: 14 + rnd() * 12, f: 1, phase: (i / 13) * TAU * 3 + rnd() * 0.5, sprite: i % 4 === 3 ? "teal" as const : "gold" as const }));
  return { strands, pulses, motes, glints };
}

/** Soft at the far ends of the wave, where the artwork itself fades out. */
const ends = (u: number) => Math.pow(Math.max(0, Math.sin(Math.PI * Math.min(1, Math.max(0, u)))), 0.7);

export default function WaveFlow({ className, flow = 1 }: { className?: string; flow?: 1 | -1 }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

    const { strands, pulses, motes, glints } = build();
    const sprites = { gold: sprite("252, 226, 182"), teal: sprite("130, 215, 198") };
    const along = (p: number) => (flow === 1 ? p : 1 - p);
    let w = 0, h = 0, raf = 0, visible = false;
    const start = performance.now();

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width;
      h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (now: number) => {
      const t = ((now - start) % LOOP) / LOOP;
      const scale = w / 1440; // sizes tuned for a ~1440px-wide wave
      ctx.clearRect(0, 0, w, h);

      // Glints where the light gathers.
      for (const g of glints) {
        const a = Math.pow(0.5 + 0.5 * Math.sin(TAU * g.f * t + g.phase), 5) * 0.5;
        if (a < 0.01) continue;
        const r = g.r * scale;
        ctx.globalAlpha = a;
        ctx.drawImage(sprites[g.sprite], g.u * w - r, g.v * h - r, r * 2, r * 2);
      }
      ctx.globalAlpha = 1;

      // Pulses of light running the length of the wave.
      ctx.lineCap = "round";
      for (const p of pulses) {
        const s = strands[p.strand];
        const head = (t * p.k + p.phase) % 1;
        const steps = 26;
        for (let i = 0; i < steps; i++) {
          const p0 = head - (p.len * i) / steps;
          const p1 = head - (p.len * (i + 1)) / steps;
          if (p1 < 0) break;
          const u0 = along(p0), u1 = along(p1);
          const a = (1 - i / steps) * ends(u0);
          if (a < 0.01) continue;
          ctx.beginPath();
          ctx.moveTo(u0 * w, strandV(s, u0) * h);
          ctx.lineTo(u1 * w, strandV(s, u1) * h);
          ctx.strokeStyle = `rgba(${p.color}, ${0.16 * a})`;
          ctx.lineWidth = p.width * 5 * scale;
          ctx.stroke();
          ctx.strokeStyle = `rgba(${p.color}, ${0.85 * a})`;
          ctx.lineWidth = p.width * scale;
          ctx.stroke();
        }
        // A bright point at the head.
        const uh = along(head);
        const ah = ends(uh) * 0.9;
        if (ah > 0.01) {
          const r = 9 * scale;
          ctx.globalAlpha = ah;
          ctx.drawImage(p.color.startsWith("250") ? sprites.gold : sprites.teal, uh * w - r, strandV(s, uh) * h - r, r * 2, r * 2);
          ctx.globalAlpha = 1;
        }
      }

      // Motes drifting a short way downstream, then fading.
      for (const m of motes) {
        const life = (t * m.k + m.phase) % 1;
        const p = m.u + m.reach * life;
        const u = along(p);
        const v = strandV(strands[m.strand], u) + m.off + 0.006 * Math.sin(TAU * life);
        const a = m.alpha * Math.pow(Math.sin(Math.PI * life), 1.3) * ends(u);
        if (a < 0.01) continue;
        const sz = m.size * scale * (1 - 0.3 * life);
        ctx.save();
        ctx.translate(u * w, v * h);
        ctx.rotate(m.spin + life * 0.8);
        ctx.fillStyle = `rgba(${m.color}, ${a})`;
        ctx.fillRect(-sz / 2, -sz / 2, sz, sz);
        ctx.restore();
      }

      raf = requestAnimationFrame(draw);
    };

    const run = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      if (reduce.matches || !visible || document.hidden) {
        if (reduce.matches) ctx.clearRect(0, 0, w, h);
        return;
      }
      raf = requestAnimationFrame(draw);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; run(); }, { rootMargin: "120px" });
    io.observe(canvas);
    document.addEventListener("visibilitychange", run);
    reduce.addEventListener("change", run);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", run);
      reduce.removeEventListener("change", run);
    };
  }, [flow]);

  return <canvas ref={ref} className={className} aria-hidden="true" data-particles="" />;
}
