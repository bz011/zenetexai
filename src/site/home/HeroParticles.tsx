"use client";

import { useEffect, useRef } from "react";

/**
 * A light particle layer drawn over the static AI-profile image. The image is
 * never transformed; this canvas adds new motion around it:
 *  - teal motes that drift away from the back of the head, as the artwork's
 *    own particles do, and fade out;
 *  - warm-gold dust idling on small closed orbits along the streams;
 *  - a slow sheen flowing along curves traced over the image's ribbons and
 *    ring, with brighter pulses of light running ahead of it;
 *  - two soft warm glows that rise and settle once per loop;
 *  - the artwork's own painted lights (measured from the image) brightening
 *    and settling in turn, so the light seems to breathe where it already is.
 * Every position and opacity is a periodic function of (time mod LOOP), so the
 * animation repeats seamlessly. Anything that nears the head (an ellipse in
 * image space) fades to nothing, so no particle crosses the face.
 * Not started under prefers-reduced-motion (the static image is the fallback),
 * paused off-screen and in background tabs. Coordinates are fractions of the
 * image (u across, v down); the canvas always covers the whole image.
 */

const LOOP = 8000;
const TAU = Math.PI * 2;

// Warm swells: centre (u, v), radius (fraction of the width), offset in the loop, peak alpha.
const SWELLS: [number, number, number, number, number][] = [
  [0.24, 0.66, 0.26, 0, 0.22],
  [0.78, 0.8, 0.22, 0.5, 0.16],
];

// The head, in image fractions: a little larger than the head itself.
const HEAD = { u: 0.553, v: 0.3, ru: 0.118, rv: 0.25 };

type Mote = { u: number; v: number; dir: number; dist: number; k: number; phase: number; size: number; alpha: number; color: string; spin: number };
type Dust = { u: number; v: number; au: number; av: number; f1: number; f2: number; p1: number; p2: number; f3: number; p3: number; r: number; alpha: number; sprite: "gold" | "teal" };
type Curve = { p: [number, number][]; color: string; width: number; pulses: number[]; len: number };

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 0 inside the head ellipse, rising to 1 a short way outside it. */
function clearOfHead(u: number, v: number) {
  const d = Math.hypot((u - HEAD.u) / HEAD.ru, (v - HEAD.v) / HEAD.rv);
  const x = Math.min(1, Math.max(0, (d - 1) / 0.35));
  return x * x * (3 - 2 * x);
}

function bezier(p: [number, number][], s: number): [number, number] {
  const m = 1 - s;
  const a = m * m * m, b = 3 * m * m * s, c = 3 * m * s * s, d = s * s * s;
  return [a * p[0][0] + b * p[1][0] + c * p[2][0] + d * p[3][0], a * p[0][1] + b * p[1][1] + c * p[2][1] + d * p[3][1]];
}

function sprite(rgb: string, size = 64) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, `rgba(${rgb},1)`);
  grad.addColorStop(0.18, `rgba(${rgb},0.85)`);
  grad.addColorStop(0.45, `rgba(${rgb},0.22)`);
  grad.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  return c;
}

function build() {
  const rnd = mulberry32(20261030);
  const pick = <T,>(xs: T[]) => xs[Math.floor(rnd() * xs.length)];

  const motes: Mote[] = Array.from({ length: 60 }, () => {
    // Born just behind the head, drifting away from it (leftwards, fanning up and down).
    const v = 0.1 + rnd() * 0.46;
    const u = 0.36 + rnd() * 0.08 + (v > 0.35 ? -0.03 : 0);
    return {
      u, v,
      dir: Math.PI + (rnd() - 0.5) * 1.1 + (v - 0.33) * 0.9,
      dist: 0.07 + rnd() * 0.15,
      k: pick([1, 1, 2]),
      phase: rnd(),
      size: 1.8 + rnd() * 3,
      alpha: 0.5 + rnd() * 0.45,
      color: pick(["21, 92, 88", "26, 120, 112", "64, 170, 152", "64, 170, 152", "196, 150, 82", "226, 184, 116"]),
      spin: rnd() * Math.PI,
    };
  });

  const dust: Dust[] = [];
  while (dust.length < 42) {
    const u = 0.03 + rnd() * 0.94;
    const v = 0.5 + rnd() * 0.42;
    if (clearOfHead(u, v) < 1) continue;
    dust.push({
      u, v,
      au: 0.008 + rnd() * 0.016, av: 0.005 + rnd() * 0.012,
      f1: pick([1, 2]), f2: pick([1, 2]), p1: rnd() * TAU, p2: rnd() * TAU,
      f3: pick([1, 2, 3]), p3: rnd() * TAU,
      r: 5 + rnd() * 8,
      alpha: 0.45 + rnd() * 0.45,
      sprite: rnd() < 0.72 ? "gold" : "teal",
    });
  }

  // Traced over the artwork's ribbons and ring (checked against an overlay of
  // the image; approximate, in image fractions). Each carries a slow sheen and
  // one or two pulses (their phases in the loop).
  const curves: Curve[] = [
    { p: [[0.07, 0.29], [0.18, 0.24], [0.32, 0.27], [0.42, 0.33]], color: "242, 212, 160", width: 1.6, pulses: [0.7], len: 0.16 }, // the ring, behind the head
    { p: [[0.63, 0.36], [0.74, 0.38], [0.81, 0.46], [0.76, 0.52]], color: "242, 212, 160", width: 1.4, pulses: [0.2], len: 0.18 }, // the ring, in front
    { p: [[0.0, 0.58], [0.25, 0.78], [0.55, 0.9], [1.0, 0.8]], color: "246, 214, 160", width: 2.2, pulses: [0.0, 0.5], len: 0.14 }, // the long gold stream
    { p: [[0.28, 0.7], [0.38, 0.6], [0.52, 0.62], [0.68, 0.78]], color: "120, 210, 194", width: 2.4, pulses: [0.35], len: 0.2 }, // teal sweep over the shoulder
    { p: [[0.55, 0.82], [0.72, 0.76], [0.86, 0.78], [1.0, 0.86]], color: "150, 218, 204", width: 1.8, pulses: [0.6], len: 0.18 }, // ribbons, right
    { p: [[0.0, 0.37], [0.09, 0.44], [0.2, 0.53], [0.34, 0.54]], color: "160, 214, 204", width: 1.6, pulses: [0.85], len: 0.18 }, // ribbon, upper left
  ];

  // The brightest painted lights in ai-profile.png, in image fractions (local
  // brightness peaks of the artwork; the face is excluded at draw time too).
  const lights = [
    [0.268, 0.774], [0.409, 0.498], [0.311, 0.816], [0.457, 0.69], [0.195, 0.929], [0.37, 0.845],
    [0.217, 0.745], [0.37, 0.573], [0.294, 0.636], [0.414, 0.895], [0.139, 0.812], [0.501, 0.753], [0.411, 0.649],
  ].map(([u, v], i) => ({ u, v, r: 18 + rnd() * 16, f: 1, phase: (i / 13) * TAU + rnd() * 0.6, peak: 0.4 + rnd() * 0.25 }));

  return { motes, dust, curves, lights };
}

export default function ParticleField({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { motes, dust, curves, lights } = build();
    const sprites = { gold: sprite("246, 205, 140"), teal: sprite("110, 205, 188"), champagne: sprite("252, 228, 186") };
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
      const scale = w / 1200; // sizes are tuned for a ~1200px-wide image
      ctx.clearRect(0, 0, w, h);

      // Two soft warm swells per loop, half a loop apart, on the streams (never on the face).
      for (const [cu, cv, cr, off, peak] of SWELLS) {
        const swell = Math.pow(0.5 + 0.5 * Math.sin(TAU * (t - off) - Math.PI / 2), 2);
        const g = ctx.createRadialGradient(cu * w, cv * h, 0, cu * w, cv * h, cr * w);
        g.addColorStop(0, `rgba(246, 205, 140, ${peak * swell})`);
        g.addColorStop(1, "rgba(246, 205, 140, 0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }

      // The painted lights breathe in turn: each brightens once per loop.
      for (const l of lights) {
        const a = l.peak * Math.pow(0.5 + 0.5 * Math.sin(TAU * l.f * t + l.phase), 3) * clearOfHead(l.u, l.v);
        if (a < 0.01) continue;
        const r = l.r * scale;
        ctx.globalAlpha = a;
        ctx.drawImage(sprites.champagne, l.u * w - r, l.v * h - r, r * 2, r * 2);
      }
      ctx.globalAlpha = 1;

      ctx.lineCap = "round";
      for (const c of curves) {
        // A slow sheen flowing along the whole ribbon: two soft bands of light per loop.
        const n = 36;
        let [pu, pv] = bezier(c.p, 0);
        for (let i = 1; i <= n; i++) {
          const sm = (i - 0.5) / n;
          const [u, v] = bezier(c.p, i / n);
          const band = Math.pow(0.5 + 0.5 * Math.sin(TAU * (2 * sm - t)), 3);
          const a = 0.32 * band * Math.sin(Math.PI * sm) * clearOfHead(u, v);
          if (a >= 0.01) {
            ctx.beginPath();
            ctx.moveTo(pu * w, pv * h);
            ctx.lineTo(u * w, v * h);
            ctx.strokeStyle = `rgba(${c.color}, ${0.35 * a})`;
            ctx.lineWidth = c.width * 6 * scale;
            ctx.stroke();
            ctx.strokeStyle = `rgba(${c.color}, ${a})`;
            ctx.lineWidth = c.width * 1.2 * scale;
            ctx.stroke();
          }
          pu = u;
          pv = v;
        }

        // Pulses of light running ahead of it, each with a bright head.
        for (const phase of c.pulses) {
          const head = (t + phase) % 1;
          const steps = 26;
          for (let i = 0; i < steps; i++) {
            const s0 = head - (c.len * i) / steps;
            const s1 = head - (c.len * (i + 1)) / steps;
            if (s1 < 0) break;
            const [u0, v0] = bezier(c.p, s0);
            const [u1, v1] = bezier(c.p, s1);
            const a = (1 - i / steps) * Math.sin(Math.PI * s0) * clearOfHead(u0, v0);
            if (a < 0.01) continue;
            ctx.beginPath();
            ctx.moveTo(u0 * w, v0 * h);
            ctx.lineTo(u1 * w, v1 * h);
            ctx.strokeStyle = `rgba(${c.color}, ${0.24 * a})`;
            ctx.lineWidth = c.width * 5 * scale;
            ctx.stroke();
            ctx.strokeStyle = `rgba(${c.color}, ${0.9 * a})`;
            ctx.lineWidth = c.width * 1.1 * scale;
            ctx.stroke();
          }
          const [hu, hv] = bezier(c.p, head);
          const ah = 0.85 * Math.sin(Math.PI * head) * clearOfHead(hu, hv);
          if (ah > 0.01) {
            const r = 11 * scale;
            ctx.globalAlpha = ah;
            ctx.drawImage(sprites.champagne, hu * w - r, hv * h - r, r * 2, r * 2);
            ctx.globalAlpha = 1;
          }
        }
      }

      // Gold and teal dust on small closed orbits.
      for (const d of dust) {
        const u = d.u + d.au * Math.sin(TAU * d.f1 * t + d.p1);
        const v = d.v + d.av * Math.sin(TAU * d.f2 * t + d.p2);
        const a = d.alpha * (0.55 + 0.45 * Math.sin(TAU * d.f3 * t + d.p3)) * clearOfHead(u, v);
        if (a < 0.01) continue;
        const r = d.r * scale;
        ctx.globalAlpha = a;
        ctx.drawImage(sprites[d.sprite], u * w - r, v * h - r, r * 2, r * 2);
      }
      ctx.globalAlpha = 1;

      // Motes leaving the back of the head.
      for (const m of motes) {
        const life = (t * m.k + m.phase) % 1;
        const eased = 1 - Math.pow(1 - life, 2);
        const u = m.u + Math.cos(m.dir) * m.dist * eased;
        const v = m.v + Math.sin(m.dir) * m.dist * eased * 0.9 + 0.01 * Math.sin(TAU * life);
        const a = m.alpha * Math.pow(Math.sin(Math.PI * life), 1.4) * clearOfHead(u, v);
        if (a < 0.01) continue;
        const s = m.size * scale * (1 - 0.35 * life);
        ctx.save();
        ctx.translate(u * w, v * h);
        ctx.rotate(m.spin + life * 0.6);
        ctx.fillStyle = `rgba(${m.color}, ${a})`;
        ctx.fillRect(-s / 2, -s / 2, s, s);
        ctx.restore();
      }

      raf = requestAnimationFrame(draw);
    };

    const run = () => {
      cancelAnimationFrame(raf);
      if (reduce.matches || !visible || document.hidden) {
        raf = 0;
        if (reduce.matches) ctx.clearRect(0, 0, w, h);
        return;
      }
      raf = requestAnimationFrame(draw);
    };

    resize();
    const ro = new ResizeObserver(() => { resize(); });
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; run(); }, { rootMargin: "120px" });
    io.observe(canvas);
    const onVis = () => run();
    document.addEventListener("visibilitychange", onVis);
    reduce.addEventListener("change", run);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      reduce.removeEventListener("change", run);
    };
  }, []);

  return <canvas ref={ref} className={className} aria-hidden="true" data-particles="" />;
}
