import {
  AdditiveBlending,
  Color,
  DirectionalLight,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  PointLight,
  Vector3,
  type Light,
} from "three";
import { Timeline, buildGlow, createTrailPulse, easeInOutCubic, type TrailPulse } from "../anim";
import { buildCard, buildDashboardPanel, type CardBuilt } from "../devices";
import { canvasTexture, lightPoolTexture, softShadowTexture, vignetteTexture, type ShowcaseKit } from "../kit";
import { glowTrail, ramp, trailPoints } from "../ribbon";
import { drawSheen } from "./agentsUi";
import {
  DASH_EMPTY,
  DASH_FULL,
  DASH_H,
  DASH_W,
  PROC_H,
  PROC_ROW,
  PROC_ROW_CY,
  PROC_W,
  createDashboardScreen,
  drawGlowFrame,
  drawOutputCard,
  drawProcessingModule,
  drawSourceCard,
  type DashProgress,
  type OutputKind,
  type SourceKind,
} from "./dataUi";
import type { UiFont } from "../uiFont";
import type { ShowcaseScene } from "./types";
import type { Translations } from "@/lib/translations";

/**
 * SCENE 2 - DATA & ANALYTICS. STATIC look-dev checkpoint (no animation yet):
 * scattered raw business sources on the left flow through a compact
 * transformation stack into one dominant analytics dashboard, which feeds
 * three organised business outputs on the right. Same renderer, same baked
 * cinematic plate, same platform, same warm-left/cool-right lighting family,
 * same faux-glass card language, and the same static-trail system as AI
 * Agents (scenes/agents.ts) - reused, not rebuilt. AI Agents itself is not
 * touched by anything in this file.
 */

const GROUND_Y = -5.35;
/** Scaled down to ~84% of the previous pass's size (8.6 -> 7.2): the earlier
 * spacing-only passes kept pushing objects toward the viewport edges to open
 * gaps, but the real problem was scale - everything was too big for the
 * frame. This pass shrinks geometry first, then repositions into the space
 * that opens up, rather than fighting for room at the same size. */
const DASH_PANEL_H = 7.2;
const DASH_PANEL_W = DASH_PANEL_H * (DASH_W / DASH_H);
const DASH_Z = -5.6;
/** Dashboard centre offset +1.9 right of the scene axis. With the outputs
 * moved out to x~9 and the sources to x~-9, this leaves roughly equal 95-115px
 * gaps (at 1440x900) between sources, module, dashboard and outputs. */
const DASH_X = 1.9;
/** Three-quarter view (verified against the rendered frame, not the numbers):
 * NEGATIVE yaw lets the LEFT edge recede and brings the RIGHT edge toward the
 * viewer; pitch is applied in the panel's own frame (rotation order YXZ) so it
 * reads as a display tilted slightly back, not a sloping tabletop. */
const DASH_ROT: [number, number, number] = [-0.16, -0.45, 0];
const dashEdge = (side: -1 | 1, inset: number, y: number): Vector3 => {
  const a = DASH_PANEL_W / 2 - inset;
  return new Vector3(DASH_X + side * a * Math.cos(DASH_ROT[1]), y, DASH_Z - side * a * Math.sin(DASH_ROT[1]));
};

const BLUE: [number, number, number] = [0.145, 0.388, 0.922];
const CYAN: [number, number, number] = [0.133, 0.827, 0.933];
const VIOLET: [number, number, number] = [0.56, 0.36, 0.93];

interface SourceSpec {
  kind: SourceKind;
  accent: string;
  pos: [number, number, number];
  rot: [number, number, number];
  scale: number;
}

// ONE left-hand source family: five separate floating cards reading top to
// bottom (Excel -> Databases -> Cloud -> PDF -> APIs), with a visible gap
// between each pair and only gentle x/z/roll variation for depth. Title/
// subtitle come from copy.data.sources.
const SOURCE_CARD_W = 2.95;
const SOURCE_CARD_H = 1.84;
const SOURCE_KEYS = ["spreadsheet", "database", "cloud", "document", "api"] as const;
const SOURCES: SourceSpec[] = [
  // vertical pitch 1.95 with a ~0.88 scale leaves a clear ~0.35-unit gap
  // between every pair of cards (five separate floating cards, not a stack)
  { kind: "spreadsheet", accent: "#34d399", pos: [-9.0, 3.8, 0.9], rot: [0.03, -0.2, 0.05], scale: 0.88 },
  { kind: "database", accent: "#60a5fa", pos: [-9.28, 1.85, -0.2], rot: [0.02, -0.13, -0.03], scale: 0.88 },
  { kind: "cloud", accent: "#38d6ee", pos: [-9.13, -0.1, 0.6], rot: [0.015, -0.24, 0.04], scale: 0.88 },
  { kind: "document", accent: "#fb923c", pos: [-9.2, -2.05, -0.3], rot: [0.01, -0.15, -0.045], scale: 0.88 },
  { kind: "api", accent: "#818cf8", pos: [-9.05, -4.0, 0.7], rot: [0.01, -0.18, 0.03], scale: 0.88 },
];

/**
 * ONE large vertical glass processing module (section D) - not four
 * independent cards. Widened substantially for the reference-match pass
 * (1.8 -> 2.6 world units): the reference module has real width and
 * presence, not a narrow dark column. Sitting closer to camera (z=1.3) than
 * the dashboard so the two can sit close/slightly overlapping in x without
 * looking like a collision - depth, not a gap, does the separating now.
 */
// Scaled to ~77% of the previous pass (2.6 -> 2.0) and repositioned into the
// space that opened up between the (now smaller, closer-to-centre) sources
// and the (now smaller) dashboard.
const PROC_MODULE_W = 2.0;
const PROC_MODULE_H = PROC_MODULE_W * (PROC_H / PROC_W);
// Shifted slightly left (final layout pass) so it reads as its own stage
// between the (now much further left) sources and the dashboard, with real
// gaps on both sides rather than sitting adjacent to either.
const PROC_POS: [number, number, number] = [-5.3, 0.2, 1.0];
const PROC_ROT: [number, number, number] = [0.012, -0.09, 0.012];

interface OutputSpec {
  kind: OutputKind;
  accent: string;
  pos: [number, number, number];
  rot: [number, number, number];
}

// One coherent output family on the right, mirroring AI Agents' result
// cluster: same bigger card size as the sources now (section 10) so left and
// right read as comparable visual weight. Title/subtitle come from
// copy.data.outputs.
// Scaled to ~77% (4.1 -> 3.16, 2.56 -> 1.97) and pulled in toward centre
// (~75% of the previous x/y spread), matching the sources' treatment.
const OUTPUT_CARD_W = 3.16;
const OUTPUT_CARD_H = 1.97;
const OUTPUT_KEYS = ["insights", "dashboards", "reports"] as const;
// x shifted substantially further right (final layout pass, section 8/9):
// same reasoning as the sources - card scale LOCKED, position only.
const OUTPUTS: OutputSpec[] = [
  { kind: "insights", accent: "#a78bfa", pos: [9.1, 1.9, -0.55], rot: [0.012, 0.24, -0.03] },
  { kind: "dashboards", accent: "#60a5fa", pos: [8.84, 0.1, -0.7], rot: [0.01, 0.27, -0.035] },
  { kind: "reports", accent: "#38d6ee", pos: [9.1, -1.78, -0.65], rot: [0.008, 0.25, -0.03] },
];

export function buildDataScene(kit: ShowcaseKit, font: UiFont, reducedMotion: boolean, t: Translations["showcase"]): Promise<ShowcaseScene> {
  const copy = t.data;
  const group = new Group();
  const lights: Light[] = [];
  const owned: { dispose(): void }[] = [];
  const own = <T extends { dispose(): void }>(x: T): T => (owned.push(x), x);

  // ── centre: the analytics dashboard ──
  const dashUi = createDashboardScreen(font, copy);
  const dashProgress: DashProgress = { ...(reducedMotion ? DASH_FULL : DASH_EMPTY) };
  dashUi.render(dashProgress);
  const dashTex = own(canvasTexture(dashUi.canvas));
  const sheenTex = own(canvasTexture(drawSheen(), false));
  const dashboard = buildDashboardPanel(kit, dashTex, DASH_PANEL_W, DASH_PANEL_H, sheenTex);
  owned.push(...dashboard.owned);
  dashboard.group.position.set(DASH_X, GROUND_Y + DASH_PANEL_H / 2 + 0.9, DASH_Z);
  dashboard.group.rotation.order = "YXZ";
  dashboard.group.rotation.set(...DASH_ROT);
  group.add(dashboard.group);

  // ── left: fragmented raw business sources ──
  const sourceCards: CardBuilt[] = [];
  SOURCES.forEach((spec, i) => {
    const sc = copy.sources[SOURCE_KEYS[i]];
    const tex = own(canvasTexture(drawSourceCard(font, spec.kind, sc.title, sc.subtitle, spec.accent)));
    const card = buildCard(kit, tex, SOURCE_CARD_W, SOURCE_CARD_H, 0.34, 0.1);
    owned.push(...card.owned);
    card.group.position.set(...spec.pos);
    card.group.rotation.set(...spec.rot);
    card.group.scale.setScalar(spec.scale);
    group.add(card.group);
    sourceCards.push(card);
  });

  // ── one processing module: Extract/Clean/Transform/Unify as internal rows of a single glass shell (section D) ──
  const procTex = own(canvasTexture(drawProcessingModule(font, copy)));
  const procModule = buildCard(kit, procTex, PROC_MODULE_W, PROC_MODULE_H, 0.32, 0.14);
  owned.push(...procModule.owned);
  procModule.group.position.set(...PROC_POS);
  procModule.group.rotation.set(...PROC_ROT);
  group.add(procModule.group);

  // ── right: organised business outputs ──
  const outputCards: CardBuilt[] = [];
  OUTPUTS.forEach((spec, i) => {
    const oc = copy.outputs[OUTPUT_KEYS[i]];
    const tex = own(canvasTexture(drawOutputCard(font, spec.kind, oc.title, oc.subtitle, spec.accent)));
    const card = buildCard(kit, tex, OUTPUT_CARD_W, OUTPUT_CARD_H, 0.34, 0.1);
    owned.push(...card.owned);
    card.group.position.set(...spec.pos);
    card.group.rotation.set(...spec.rot);
    group.add(card.group);
    outputCards.push(card);
  });

  // ── trails: sources -> ONE processing module -> dashboard -> outputs (sections F/G/I) ──
  // Several LAYERED curved streams converge on the module's left face - a
  // brighter core plus a softer secondary parallel path per source, so the
  // incoming side reads as rich energetic data streams (section 7), not
  // single thin wires. Many disconnected sources feeding one pipeline.
  // Dormant, every trail is deliberately dim (DORMANT_TRAIL): with this many
  // lines on screen at once, full brightness read as a web of wires competing
  // with the dashboard. The animation's pulses are unaffected - riding a quiet
  // line, they are still the brightest thing on it, so the active path stays
  // obviously visible against the rest.
  const DORMANT_TRAIL = 0.5;
  const DORMANT_SIDE = 0.38;
  // The exact curve control points of every lane, kept so a pulse can ride the visible path.
  interface Lane {
    main: Vector3[];
    side?: Vector3[];
  }
  const srcLanes: Lane[] = [];
  const modLanes: Lane[] = [];
  const outLanes: Lane[] = [];
  const moduleLeft = new Vector3(PROC_POS[0] - PROC_MODULE_W / 2 + 0.12, PROC_POS[1], PROC_POS[2] - 0.15);
  SOURCES.forEach((spec, i) => {
    const anchor = new Vector3(spec.pos[0] + 1.3, spec.pos[1] - 0.08, spec.pos[2]);
    const target = moduleLeft.clone().add(new Vector3(0, 1.9 - i * 0.95, 0));
    const color = i % 2 ? CYAN : VIOLET;
    glowTrail(anchor, target, ramp(BLUE, color), 0.13, DORMANT_TRAIL).forEach((m) => group.add(m));
    // secondary parallel path, softer and offset - a second thread in the same stream
    const anchor2 = anchor.clone().add(new Vector3(0, -0.35, 0.2));
    const target2 = target.clone().add(new Vector3(0, -0.3, 0.15));
    glowTrail(anchor2, target2, ramp(BLUE, color), 0.06, DORMANT_SIDE).forEach((m) => group.add(m));
    srcLanes.push({ main: trailPoints(anchor, target), side: trailPoints(anchor2, target2) });
  });
  // A small number of clean, parallel streams out of the module's right face
  // toward the dashboard - deliberately more orderly than the incoming side
  // (section I): fragmented before, structured after. More streams than the
  // first pass so this transition reads as powerful, not a single connector.
  const moduleRight = new Vector3(PROC_POS[0] + PROC_MODULE_W / 2 - 0.12, PROC_POS[1], PROC_POS[2] - 0.15);
  const dashLeftBase = dashEdge(-1, 0.25, -0.6);
  [1.4, 0.7, 0, -0.7, -1.4].forEach((dy, i) => {
    const from = moduleRight.clone().add(new Vector3(0, dy, 0));
    const to = dashLeftBase.clone().add(new Vector3(0, dy * 0.8, -0.2));
    glowTrail(from, to, ramp(VIOLET, CYAN), 0.12, DORMANT_TRAIL).forEach((m) => group.add(m));
    modLanes.push({ main: trailPoints(from, to) });
  });

  const dashRight = dashEdge(1, 0.25, 0.4);
  OUTPUTS.forEach((spec, i) => {
    const source = dashRight.clone().add(new Vector3(0, -(i * 1.25), -0.1));
    const anchor = new Vector3(spec.pos[0] - 1.4, spec.pos[1], spec.pos[2]);
    glowTrail(source, anchor, ramp(BLUE, CYAN), 0.15, DORMANT_TRAIL).forEach((m) => group.add(m));
    // a second, cleaner companion stream - the output side stays more
    // organised/controlled than the incoming side (section 11)
    const source2 = source.clone().add(new Vector3(0, 0.32, 0.1));
    const anchor2 = anchor.clone().add(new Vector3(0, 0.28, 0.08));
    glowTrail(source2, anchor2, ramp(BLUE, CYAN), 0.07, DORMANT_SIDE).forEach((m) => group.add(m));
    outLanes.push({ main: trailPoints(source, anchor), side: trailPoints(source2, anchor2) });
  });

  // ── grounding only: contact shadow, a faint cool pool, no opaque disc ──
  const shadowTex = own(softShadowTexture());
  const contactShadow = new Mesh(
    own(new PlaneGeometry(9, 3.4)),
    own(new MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0.5, depthWrite: false, toneMapped: false })),
  );
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.set(0.1, GROUND_Y + 0.02, DASH_Z + 0.5);
  contactShadow.renderOrder = -1;
  group.add(contactShadow);

  const poolTex = own(lightPoolTexture([56, 130, 240], 0.2));
  const pool = new Mesh(
    own(new PlaneGeometry(11, 6)),
    own(new MeshBasicMaterial({ map: poolTex, transparent: true, depthWrite: false, toneMapped: false })),
  );
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(0.2, GROUND_Y + 0.03, DASH_Z + 0.2);
  pool.renderOrder = -2;
  group.add(pool);

  const vignetteTex = own(vignetteTexture(0.4));
  const vignette = new Mesh(
    own(new PlaneGeometry(22, 16)),
    own(new MeshBasicMaterial({ map: vignetteTex, transparent: true, depthWrite: false, toneMapped: false, side: DoubleSide })),
  );
  vignette.position.set(0, 1.2, DASH_Z - 3.6);
  vignette.renderOrder = -4;
  group.add(vignette);

  // ── lighting: identical family to AI Agents (cool key/rim, warm left, cool right), plus a restrained violet accent for the output cluster ──
  const key = new DirectionalLight(0xe7edff, 1.7);
  key.position.set(-6, 10, 11);
  const rimR = new DirectionalLight(0x6ea8ff, 2.4);
  rimR.position.set(9, 4, -8);
  const warmLeft = new PointLight(0xffa85e, 3.0, 13, 2);
  warmLeft.position.set(-9.5, 2, 5);
  const coolRight = new PointLight(0x38d6ee, 3.6, 14, 2);
  coolRight.position.set(9, 0.5, 3);
  const violetAccent = new PointLight(0x8b5cf6, 1.6, 10, 2);
  violetAccent.position.set(8, -1.5, 2);
  lights.push(key, rimR, warmLeft, coolRight, violetAccent);

  // ── animation: sources -> processing -> dashboard -> outputs, one loop ──
  // The story is told ONLY by (a) small pulses riding the existing trails,
  // (b) a restrained edge highlight that steps down the processing module,
  // (c) the dashboard's charts filling in, and (d) a short edge glow on each
  // output card as its pulse lands. No card, dashboard frame or light ever
  // changes brightness or moves, so nothing can read as a flash.
  let tick: ((dtMs: number) => boolean) | undefined;
  if (!reducedMotion) {
    const PULSE_SRC: [number, number, number] = [190, 225, 255];
    const PULSE_MOD: [number, number, number] = [205, 190, 255];
    const PULSE_OUT: [number, number, number] = [150, 240, 255];
    const mkPulse = (pts: Vector3[], rgb: [number, number, number], size: number): TrailPulse => {
      const p = createTrailPulse(kit, own, pts, rgb, size);
      group.add(p.sprite);
      return p;
    };
    const srcPulses = srcLanes.map((l) => ({ main: mkPulse(l.main, PULSE_SRC, 0.9), side: mkPulse(l.side!, PULSE_SRC, 0.5) }));
    const modPulses = modLanes.map((l) => mkPulse(l.main, PULSE_MOD, 0.62));
    const outPulses = outLanes.map((l) => ({ main: mkPulse(l.main, PULSE_OUT, 2.0), side: mkPulse(l.side!, PULSE_OUT, 1.1) }));

    // processing module: one edge highlight (plus an icon glow) that steps down the rows
    const PROC_PX = PROC_MODULE_W / PROC_W; // world units per canvas px
    const rowLocalY = (i: number) => (PROC_H / 2 - PROC_ROW_CY[i]) * PROC_PX;
    const hiPad = 60;
    const hiTex = own(canvasTexture(drawGlowFrame(PROC_ROW.w, PROC_ROW.h, 32, hiPad, 0.1), false));
    const hiMat = own(
      new MeshBasicMaterial({ map: hiTex, color: new Color("#60a5fa"), transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending, toneMapped: false }),
    );
    const hi = new Mesh(own(new PlaneGeometry((PROC_ROW.w + hiPad * 2) * PROC_PX, (PROC_ROW.h + hiPad * 2) * PROC_PX)), hiMat);
    hi.renderOrder = 5;
    hi.userData.isGlow = true;
    hi.position.z = 0.09;
    procModule.group.add(hi);
    const iconGlow = buildGlow(kit, own, 0.7, [255, 255, 255]);
    const iconGlowMat = iconGlow.material as MeshBasicMaterial;
    iconGlow.position.set((PROC_ROW.iconCx - PROC_W / 2) * PROC_PX, 0, 0.09);
    procModule.group.add(iconGlow);
    const STAGE_HEX = ["#60a5fa", "#38d6ee", "#818cf8", "#a78bfa"];
    const HI_OPACITY = 0.85;
    const ICON_OPACITY = 0.5;
    const c0 = new Color();
    const c1 = new Color();
    const setHi = (y: number, opacity: number, color: Color) => {
      hi.position.y = y;
      iconGlow.position.y = y;
      hiMat.color.copy(color);
      iconGlowMat.color.copy(color);
      hiMat.opacity = opacity * HI_OPACITY;
      iconGlowMat.opacity = opacity * ICON_OPACITY;
    };

    // output acknowledgement: a short edge glow that rises as the pulse lands and fades away
    const ackPad = 50;
    const ackTex = own(canvasTexture(drawGlowFrame(920, 560, 99, ackPad, 0.06), false));
    const ackScale = (920 + ackPad * 2) / 920;
    const acks = outputCards.map((card, i) => {
      const mat = own(
        new MeshBasicMaterial({ map: ackTex, color: new Color(OUTPUTS[i].accent), transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending, toneMapped: false }),
      );
      const m = new Mesh(own(new PlaneGeometry(OUTPUT_CARD_W * ackScale, OUTPUT_CARD_H * ackScale)), mat);
      m.renderOrder = 5;
      m.userData.isGlow = true;
      m.position.z = 0.07;
      card.group.add(m);
      return mat;
    });

    const linear = (t: number) => t;
    const sine = (t: number) => 0.5 - Math.cos(Math.PI * t) / 2;
    let dashDirty = false;
    const setDash = (patch: Partial<DashProgress>) => {
      Object.assign(dashProgress, patch);
      dashDirty = true;
    };

    // ms on the cycle clock
    const SRC_STAGGER = 320;
    const SRC_TRAVEL = 1200;
    const STAGE_T = [1200, 2350, 3500, 4650];
    const STAGE_END = 5800;
    const MOD_T = 5600;
    const DASH_T = 6700;
    const OUT_T = 9500;
    const HOLD_END = 13600;
    const RESET_MS = 800;
    const CYCLE_MS = 14400;

    function buildCycle(): Timeline {
      const tl = new Timeline();
      tl.at(0, () => {
        setHi(rowLocalY(0), 0, c0.set(STAGE_HEX[0]));
        setDash({ ...DASH_EMPTY });
      });

      // 1. sources feed the module, one after another
      srcPulses.forEach((sp, i) => {
        const t = 300 + i * SRC_STAGGER;
        tl.add(t, SRC_TRAVEL, (p) => sp.main.setProgress(p), sine);
        tl.add(t + 170, SRC_TRAVEL, (p) => sp.side.setProgress(p), sine);
      });

      // 2. the module works down its rows as data reaches each stage
      STAGE_T.forEach((t, i) => {
        const fromY = rowLocalY(Math.max(0, i - 1));
        const toY = rowLocalY(i);
        const fromHex = STAGE_HEX[Math.max(0, i - 1)];
        tl.add(
          t,
          i === 0 ? 500 : 520,
          (p) => {
            c0.set(fromHex);
            c1.set(STAGE_HEX[i]);
            setHi(fromY + (toY - fromY) * p, i === 0 ? p : 1, c0.lerp(c1, p));
          },
          easeInOutCubic,
        );
      });
      tl.add(
        STAGE_END,
        600,
        (p) => setHi(rowLocalY(3), 1 - p, c0.set(STAGE_HEX[3])),
        linear,
      );

      // 3. unified data leaves the module toward the dashboard
      modPulses.forEach((mp, i) => tl.add(MOD_T + i * 130, 1000, (p) => mp.setProgress(p), sine));

      // 4. the dashboard is populated as the data arrives
      tl.add(DASH_T, 1800, (p) => setDash({ kpi: p }), linear);
      tl.add(DASH_T + 150, 1900, (p) => setDash({ bars: p }), linear);
      tl.add(DASH_T + 250, 1800, (p) => setDash({ donut: p }), linear);
      tl.add(DASH_T + 600, 1700, (p) => setDash({ channels: p }), linear);
      tl.add(DASH_T + 800, 1900, (p) => setDash({ forecast: p }), linear);

      // 5. results leave the dashboard; each card acknowledges as its pulse lands
      outPulses.forEach((op, i) => {
        const t = OUT_T + i * 350;
        tl.add(t, 1000, (p) => op.main.setProgress(p), sine);
        tl.add(t + 150, 1000, (p) => op.side.setProgress(p), sine);
        tl.add(
          t + 1000,
          1300,
          (p) => {
            const rise = 0.18;
            acks[i].opacity = 0.8 * (p < rise ? p / rise : Math.pow(1 - (p - rise) / (1 - rise), 1.6));
          },
          linear,
        );
      });

      // 6. hold the finished frame, then drain the dashboard back to empty
      tl.add(HOLD_END, RESET_MS, (p) => {
        const k = 1 - p;
        setDash({ kpi: k, bars: k, donut: k, channels: k, forecast: k });
      }, easeInOutCubic);
      tl.add(CYCLE_MS - 1, 1, () => {});
      return tl;
    }

    let phase = buildCycle();
    const loop = () => {
      phase = buildCycle();
      phase.whenDone(loop);
    };
    phase.whenDone(loop);

    // the dashboard canvas is repainted at ~30 fps, and only while its data is changing
    let sinceDraw = 0;
    tick = (dt: number) => {
      phase.tick(dt);
      sinceDraw += dt;
      if (dashDirty && sinceDraw >= 33) {
        sinceDraw = 0;
        dashDirty = false;
        dashUi.render(dashProgress);
        dashTex.needsUpdate = true;
      }
      return true;
    };
  }

  return Promise.resolve({
    group,
    anchors: {},
    lights,
    tick,
    camera: { fov: 24, dist: 32, target: new Vector3(0, -0.5, 0), yaw: 4, pitch: 3, designAspect: 1.6 },
    portrait: { target: new Vector3(DASH_X, GROUND_Y + DASH_PANEL_H / 2 + 0.7, DASH_Z), dist: 41, yaw: 6, pitch: 3 },
    dispose() {
      group.traverse((o) => {
        const mm = o as { isMesh?: boolean; geometry?: { dispose(): void } };
        if (mm.isMesh && mm.geometry) mm.geometry.dispose();
      });
      owned.forEach((x) => x.dispose());
    },
  });
}
