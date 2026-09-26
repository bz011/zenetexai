# Homepage governed flow: 3D enhancement evaluation

**Decision: implemented, lazy and fully working - but DISABLED by default.**
Enable for a preview with `?flow3d=1`; switch on for everyone by changing
`FLOW_3D_DEFAULT` in `src/lib/featureFlags.ts` (no other change needed).

## What was built

The same concept as the SVG diagram (`components/flow/GovernedFlow.tsx`), not a
second concept. Depth carries meaning, and only that:

| Plane | z | Content |
|---|---|---|
| Agent | 0 | rail, stage nodes, gates (replace the 2D rail/markers) |
| Human | +60 | the "Your team" handoff frame, joined to the Decide node by a curve |
| Record | -100 | one audit tick per step, behind the panel |

HTML text is untouched (it is the content). Pointer movement tilts the scene up
to ~6 degrees so the planes shift against each other; hovering a row lights its
node. Raw three.js, no textures, DPR <= 1.5, on-demand rendering (no idle loop),
paused off-screen, context loss returns to the SVG.

## Architecture (nothing 3D is in the critical path)

`FlowStage` renders the SVG diagram, always. Only if **all** hold does it fetch
the 3D chunk: flag on, viewport >= 1024px, fine pointer, no
`prefers-reduced-motion`, no data-saver, WebGL available - and only after the
page `load` event plus an idle callback. Any failure leaves the SVG exactly as it
was. Verified in a production build: with WebGL disabled the SVG rails animate
and no canvas is created; with reduced motion the SVG resolves immediately.

## Measurements (production build, local, Edge)

| | Result | Budget |
|---|---|---|
| Lazy JS (gzip) | **145 KB** (82.1 + 60.4 + 2.6, three.js split by webpack) | <= 150 KB |
| Homepage initial First Load JS | unchanged (162 kB); loader ~1 KB | <= 160 KB practical |
| Draw calls | **7** | <= 20 |
| Triangles | **286** | <= 20,000 |
| Logical nodes | **23** | <= 40 |
| Added TBT | **0 ms** (no long task attributable to mount) | <= 50 ms |
| Frame pacing while moving the pointer | 16.7 ms average, p95 17.5 ms, 0 long tasks (60 fps) | render <= 8 ms |
| Textures / CDN assets | none | none |

Not measured: per-frame CPU time in isolation, GPU time, battery, low-end
devices. Local runs have near-zero network latency, so the network cost of the
chunk is only reflected in its size.

R3F comparison: a minimal React-Three-Fiber scene (Canvas + a few primitives)
bundled at **229 KB gzip** in the audit; this scene in raw three.js is **145 KB**.
R3F would add ~85 KB for nothing this scene needs (no declarative scene tree, no
drei helpers - and drei's default CDN-backed helpers are blocked by the CSP).

## Why it stays off

1. **At rest it is nearly indistinguishable from the SVG.** The rail, nodes and
   gates are flat by nature; only the two offset planes read as depth, and only
   while the pointer is moving.
2. **Depth helps a little and hurts a little.** The floating handoff frame and
   the record ticks do separate "human" and "record" from the agent flow, but
   they sit in front of / behind HTML text that cannot move with them, so lines
   pass near or across words (tuned down from +120/-160 to +60/-100, still not
   free of it).
3. **It costs ~145 KB of JavaScript, a WebGL context and pointer-driven
   rendering** for desktop-with-mouse visitors only - most of them for a diagram
   the SVG already explains completely.
4. The same information is fully available, accessible and printable without it.

Performance wins over decoration. The layer stays in the codebase, tested
(gating, flag, scene budget), so it can be revisited if a future scene (for
example one that genuinely needs 3D, such as a spatial view of data lineage) makes
the cost worthwhile.
