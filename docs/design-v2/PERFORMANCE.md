# Performance: before and after

Lab measurements on a local production build (`next build` + `next start`, placeholder Supabase env, no real backend).
They are directional, not field data (no CrUX data exists for these URLs).
Conditions were the standard DevTools presets, unmanipulated: Slow 4G, 4x CPU throttle, mobile 390x844.
Localhost means TTFB is near zero, so LCP here is dominated by render delay and would be higher on a real network.

| Metric | Baseline (audit, prior design) | After (design/site-v2) |
|---|---|---|
| Homepage First Load JS (build report) | ~147 kB | 162 kB (shared 87.4 kB) |
| Homepage LCP (mobile, throttled) | flattered by the logo image being the LCP element | 804 ms, LCP element is the real H1 |
| Homepage CLS | 0 | 0.00 |
| Power BI page LCP / CLS | n/a | 1,096 ms / 0.00 |
| Lighthouse (Power BI, mobile) | n/a | Accessibility 96 (the one failure was step-number contrast, fixed afterwards), Best Practices 100, SEO 100 |

Other route First Load JS: About 144 kB, Services 144 kB, Blog 143 kB, Resources 144 kB, Contact 137 kB.

## Notes

- Homepage JS is about 2 kB above the 160 kB target. The animation library is `motion/mini` (WAAPI, ~3 kB gzipped) rather than the full React runtime,
  which alone added ~49 kB. Further trimming (per-language copy split, lazy below-the-fold sections) is a next-sprint item.
- The 3D layer is not in the initial route JS at all. It is a dynamic import, gated on desktop, fine pointer, no reduced motion, no save-data and WebGL,
  and loads after the page is idle. Scene budget measured: 7 draw calls, 286 triangles, 23 nodes. Details in [3D-EVALUATION.md](3D-EVALUATION.md).
- Hero copy is server-rendered HTML and visible at first paint. The flow animation starts only after intersection and never blocks text.
- Fonts: one variable Manrope file and Noto Sans Arabic via `next/font` (self-hosted, no layout shift).
- INP was not measured: no interaction trace was run. The interactive surface is small (menu, language switch, FAQ details, flow replay).
