import {
  AdditiveBlending,
  DirectionalLight,
  DoubleSide,
  Group,
  Mesh,
  Color,
  MeshBasicMaterial,
  PlaneGeometry,
  PointLight,
  RingGeometry,
  Vector3,
  type Light,
} from "three";
import { Timeline, createTrailPulse, easeInOutCubic, type TrailPulse } from "../anim";
import { buildCard } from "../devices";
import { canvasTexture, lightPoolTexture, softShadowTexture, vignetteTexture, makeCanvas, type ShowcaseKit } from "../kit";
import { mix, tapeGeometry } from "../../core3d/geometry";
import type { UiFont } from "../uiFont";
import { buildMlCore, CORE_H, CORE_W } from "./mlCore";
import { drawGlowFrame } from "./agentsUi";
import {
  HIST_EMPTY,
  HIST_FULL,
  HIST_H,
  HIST_W,
  PRED_EMPTY,
  PRED_FULL,
  PRED_H,
  PRED_W,
  createHistoricalCard,
  createPredictionPanel,
  type HistProgress,
  type PredProgress,
} from "./mlUi";
import type { ShowcaseScene } from "./types";

/**
 * SCENE 3 - MACHINE LEARNING. One idea, three objects: HISTORICAL DATA on the
 * left, the ML CORE (the hero) in the middle, the PREDICTION on the right.
 * Deliberately simpler than Data & Analytics - no pipeline, no bank of source
 * cards: one card in, one core, one panel out, joined by three smooth streams
 * each way. Same renderer, baked plate, lighting family and glass card
 * language as the other scenes.
 */

const GROUND_Y = -5.35;

const BLUE: [number, number, number] = [0.145, 0.388, 0.922];
const CYAN: [number, number, number] = [0.133, 0.827, 0.933];
const VIOLET: [number, number, number] = [0.56, 0.36, 0.93];

// Composition (verified against the render at 1440x900, not the numbers).
const HIST_POS: [number, number, number] = [-7.7, 0.4, 0.6];
const HIST_ROT: [number, number, number] = [0.02, -0.16, 0.03];
const HIST_SIZE = { w: 4.3, h: (4.3 * HIST_H) / HIST_W };
const CORE_POS: [number, number, number] = [-1.0, -0.3, 0];
const PRED_POS: [number, number, number] = [6.95, 0.05, -0.3];
const PRED_ROT: [number, number, number] = [0.02, 0.2, -0.02];
const PRED_SIZE = { w: 6.9, h: (6.9 * PRED_H) / PRED_W };

/** A smooth S-shaped stream between two points (gentle dip in depth, never across a face). */
function streamPoints(a: Vector3, b: Vector3): Vector3[] {
  const pts: Vector3[] = [];
  for (let i = 0; i <= 4; i++) {
    const u = i / 4;
    const s = u * u * (3 - 2 * u);
    pts.push(new Vector3(a.x + (b.x - a.x) * u, a.y + (b.y - a.y) * s, a.z + (b.z - a.z) * u - 0.45 * Math.sin(Math.PI * u)));
  }
  return pts;
}

/** Three additive tapes of decreasing width along one path - the same soft glow the other scenes' trails have. */
function streamMeshes(points: Vector3[], from: [number, number, number], to: [number, number, number], base: number): Mesh[] {
  const layers: [number, number][] = [
    [1, 0.14],
    [0.55, 0.3],
    [0.22, 0.65],
  ];
  return layers.map(([w, opacity]) => {
    const geo = tapeGeometry(points, base * w, 0.02, (u) => mix(from, to, u), 40);
    const mat = new MeshBasicMaterial({ vertexColors: true, transparent: true, opacity, blending: AdditiveBlending, depthWrite: false, toneMapped: false });
    return new Mesh(geo, mat);
  });
}

function beamTexture() {
  const { c, g } = makeCanvas(64, 256);
  const grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, "rgba(80,200,255,0)");
  grad.addColorStop(0.6, "rgba(80,200,255,0.3)");
  grad.addColorStop(1, "rgba(140,230,255,0.9)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 256);
  // soft fall-off at the sides
  const side = g.createLinearGradient(0, 0, 64, 0);
  side.addColorStop(0, "rgba(0,0,0,1)");
  side.addColorStop(0.3, "rgba(0,0,0,0)");
  side.addColorStop(0.7, "rgba(0,0,0,0)");
  side.addColorStop(1, "rgba(0,0,0,1)");
  g.globalCompositeOperation = "destination-out";
  g.fillStyle = side;
  g.fillRect(0, 0, 64, 256);
  return canvasTexture(c, false);
}

export function buildMlScene(kit: ShowcaseKit, font: UiFont, reducedMotion: boolean): Promise<ShowcaseScene> {
  const group = new Group();
  const lights: Light[] = [];
  const owned: { dispose(): void }[] = [];
  const own = <T extends { dispose(): void }>(x: T): T => (owned.push(x), x);

  // ── left: historical data ──
  // Animated, the scene starts dormant and the cycle brings it to life; reduced motion paints the finished frame once.
  const hist = createHistoricalCard(font);
  const histProgress: HistProgress = { ...(reducedMotion ? HIST_FULL : HIST_EMPTY) };
  hist.render(histProgress);
  const histTex = own(canvasTexture(hist.canvas));
  const histCard = buildCard(kit, histTex, HIST_SIZE.w, HIST_SIZE.h, 0.4, 0.12);
  owned.push(...histCard.owned);
  histCard.group.position.set(...HIST_POS);
  histCard.group.rotation.set(...HIST_ROT);
  group.add(histCard.group);

  // ── centre: the core ──
  const core = buildMlCore(kit);
  owned.push(...core.owned);
  core.group.position.set(...CORE_POS);
  core.group.rotation.set(0.02, 0.3, 0);
  core.setState(reducedMotion ? 1 : 0, 0);
  group.add(core.group);

  // ── right: predictions ──
  const pred = createPredictionPanel(font);
  const predProgress: PredProgress = { ...(reducedMotion ? PRED_FULL : PRED_EMPTY) };
  pred.render(predProgress);
  const predTex = own(canvasTexture(pred.canvas));
  const predCard = buildCard(kit, predTex, PRED_SIZE.w, PRED_SIZE.h, 0.42, 0.12);
  owned.push(...predCard.owned);
  predCard.group.position.set(...PRED_POS);
  predCard.group.rotation.set(...PRED_ROT);
  group.add(predCard.group);

  // ── connections: three smooth streams each way, each ending on the visible edge of its object ──
  const histRight = new Vector3(HIST_POS[0] + (HIST_SIZE.w / 2) * Math.cos(HIST_ROT[1]) - 0.02, 0, HIST_POS[2] - (HIST_SIZE.w / 2) * Math.sin(HIST_ROT[1]));
  const coreLeftX = CORE_POS[0] - CORE_W / 2 + 0.02;
  const coreRightX = CORE_POS[0] + CORE_W / 2 - 0.02;
  const inYs = [1.0, 0, -1.0];
  const streams: { pts: Vector3[] }[] = [];
  inYs.forEach((dy, i) => {
    const a = new Vector3(histRight.x, HIST_POS[1] + dy * 1.05, histRight.z);
    const b = new Vector3(coreLeftX, CORE_POS[1] + dy, CORE_POS[2] + 0.3);
    const pts = streamPoints(a, b);
    streamMeshes(pts, BLUE, i % 2 ? CYAN : BLUE, 0.2).forEach((m) => group.add(m));
    streams.push({ pts });
  });
  const predLeft = new Vector3(PRED_POS[0] - (PRED_SIZE.w / 2) * Math.cos(PRED_ROT[1]) + 0.02, 0, PRED_POS[2] + (PRED_SIZE.w / 2) * Math.sin(PRED_ROT[1]));
  inYs.forEach((dy, i) => {
    const a = new Vector3(coreRightX, CORE_POS[1] + dy, CORE_POS[2] + 0.3);
    const b = new Vector3(predLeft.x, PRED_POS[1] + dy * 0.95, predLeft.z);
    const pts = streamPoints(a, b);
    streamMeshes(pts, VIOLET, i % 2 ? CYAN : VIOLET, 0.2).forEach((m) => group.add(m));
    streams.push({ pts });
  });

  // ── grounding: contact shadow, a cool pool, the hologram ring and beam under the core ──
  const shadowTex = own(softShadowTexture());
  const contactShadow = new Mesh(
    own(new PlaneGeometry(11, 3.6)),
    own(new MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0.5, depthWrite: false, toneMapped: false })),
  );
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.set(0.1, GROUND_Y + 0.02, -0.4);
  contactShadow.renderOrder = -1;
  group.add(contactShadow);

  const poolTex = own(lightPoolTexture([56, 130, 240], 0.22));
  const pool = new Mesh(
    own(new PlaneGeometry(12, 6.5)),
    own(new MeshBasicMaterial({ map: poolTex, transparent: true, depthWrite: false, toneMapped: false })),
  );
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(0.2, GROUND_Y + 0.03, -0.4);
  pool.renderOrder = -2;
  group.add(pool);

  const ringY = GROUND_Y + 0.95;
  [
    { r0: 1.7, r1: 1.78, o: 0.75 },
    { r0: 1.1, r1: 1.16, o: 0.55 },
    { r0: 2.35, r1: 2.38, o: 0.28 },
  ].forEach(({ r0, r1, o }) => {
    const ring = new Mesh(
      own(new RingGeometry(r0, r1, 72)),
      own(new MeshBasicMaterial({ color: 0x56c8ff, transparent: true, opacity: o, side: DoubleSide, depthWrite: false, blending: AdditiveBlending, toneMapped: false })),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.scale.set(1, 1, 1);
    ring.position.set(CORE_POS[0], ringY, CORE_POS[2]);
    ring.renderOrder = -1;
    group.add(ring);
  });
  const ringGlowTex = own(lightPoolTexture([70, 190, 255], 0.55));
  const ringGlow = new Mesh(
    own(new PlaneGeometry(6.2, 6.2)),
    own(new MeshBasicMaterial({ map: ringGlowTex, transparent: true, depthWrite: false, blending: AdditiveBlending, toneMapped: false })),
  );
  ringGlow.rotation.x = -Math.PI / 2;
  ringGlow.position.set(CORE_POS[0], ringY + 0.01, CORE_POS[2]);
  ringGlow.renderOrder = -1;
  group.add(ringGlow);
  const beamTex = own(beamTexture());
  const beamH = CORE_POS[1] - CORE_H / 2 - ringY;
  const beam = new Mesh(
    own(new PlaneGeometry(2.6, Math.abs(beamH))),
    own(new MeshBasicMaterial({ map: beamTex, transparent: true, depthWrite: false, blending: AdditiveBlending, toneMapped: false, side: DoubleSide })),
  );
  beam.position.set(CORE_POS[0], ringY + Math.abs(beamH) / 2, CORE_POS[2]);
  beam.renderOrder = -1;
  group.add(beam);

  const vignetteTex = own(vignetteTexture(0.4));
  const vignette = new Mesh(
    own(new PlaneGeometry(22, 16)),
    own(new MeshBasicMaterial({ map: vignetteTex, transparent: true, depthWrite: false, toneMapped: false, side: DoubleSide })),
  );
  vignette.position.set(0, 1.2, -9.6);
  vignette.renderOrder = -4;
  group.add(vignette);

  // ── lighting: the same family as the other scenes (cool key/rim, warm left, cool right), plus a blue light for the core's glass ──
  const key = new DirectionalLight(0xe7edff, 1.7);
  key.position.set(-6, 10, 11);
  const rimR = new DirectionalLight(0x6ea8ff, 2.4);
  rimR.position.set(9, 4, -8);
  const warmLeft = new PointLight(0xffa85e, 3.0, 13, 2);
  warmLeft.position.set(-9.5, 2, 5);
  const coolRight = new PointLight(0x38d6ee, 5, 14, 2);
  coolRight.position.set(9, 0.5, 3);
  const coreLight = new PointLight(0x5a86ff, 6, 9, 2);
  coreLight.position.set(CORE_POS[0], CORE_POS[1] + 0.5, 3.2);
  lights.push(key, rimR, warmLeft, coolRight, coreLight);

  // ── animation: HISTORICAL DATA -> LEARN A PATTERN -> PREDICT THE FUTURE, one loop ──
  // Told only by small pulses on the existing streams, the historical bars
  // coming alive, the network lighting up layer by layer, the future curve
  // being drawn, and a short edge glow where a pulse lands. The card, the core
  // and the panel never move, and none of them changes brightness as a whole.
  let tick: ((dtMs: number) => boolean) | undefined;
  if (!reducedMotion) {
    const PULSE_IN: [number, number, number] = [170, 215, 255];
    const PULSE_OUT: [number, number, number] = [200, 175, 255];
    const mkPulse = (pts: Vector3[], rgb: [number, number, number], size: number): TrailPulse => {
      const p = createTrailPulse(kit, own, pts, rgb, size);
      group.add(p.sprite);
      return p;
    };
    const inPulses = streams.slice(0, 3).map((s) => mkPulse(s.pts, PULSE_IN, 1.0));
    const outPulses = streams.slice(3).map((s) => mkPulse(s.pts, PULSE_OUT, 1.5));

    // a short edge glow on a card (the same soft outline the other scenes use)
    const glowTextures = new Map<string, ReturnType<typeof canvasTexture>>();
    const addAck = (card: { group: Group }, cw: number, ch: number, radius: number, depth: number, accent: string): MeshBasicMaterial => {
      const PX = 200;
      const PAD = 50;
      const key = `${cw}x${ch}`;
      let tex = glowTextures.get(key);
      if (!tex) {
        tex = own(canvasTexture(drawGlowFrame(cw * PX, ch * PX, radius * PX, PAD, 0.06), false));
        glowTextures.set(key, tex);
      }
      const m = own(
        new MeshBasicMaterial({ map: tex, color: new Color(accent), transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending, toneMapped: false }),
      );
      const plane = new Mesh(own(new PlaneGeometry(cw + (PAD * 2) / PX, ch + (PAD * 2) / PX)), m);
      plane.renderOrder = 5;
      plane.userData.isGlow = true;
      plane.position.z = depth / 2 + 0.02;
      card.group.add(plane);
      return m;
    };
    const ackHist = addAck(histCard, HIST_SIZE.w, HIST_SIZE.h, 0.4, 0.12, "#60a5fa");
    const ackPred = addAck(predCard, PRED_SIZE.w, PRED_SIZE.h, 0.42, 0.12, "#a78bfa");
    const ackEnv = (m: MeshBasicMaterial) => (p: number) => {
      const rise = 0.18;
      m.opacity = 0.8 * (p < rise ? p / rise : Math.pow(1 - (p - rise) / (1 - rise), 1.6));
    };

    const linear = (t: number) => t;
    const sine = (t: number) => 0.5 - Math.cos(Math.PI * t) / 2;
    const learnState = { learn: 0, reset: 0 };
    let coreDirty = true;
    let histDirty = false;
    let predDirty = false;
    const setHist = (patch: Partial<HistProgress>) => {
      Object.assign(histProgress, patch);
      histDirty = true;
    };
    const setPred = (patch: Partial<PredProgress>) => {
      Object.assign(predProgress, patch);
      predDirty = true;
    };
    const setLearn = (patch: Partial<typeof learnState>) => {
      Object.assign(learnState, patch);
      coreDirty = true;
    };

    // ms on the cycle clock
    const OBS_T = 500;
    const IN_T = 2700;
    const LEARN_T = 4000;
    const LEARN_MS = 4200;
    const OUT_T = 7300;
    const LINE_T = 8700;
    const KPI_T = 10800;
    const RESET_T = 14000;
    const CYCLE_MS = 15500;

    function buildCycle(): Timeline {
      const tl = new Timeline();
      tl.at(0, () => {
        setLearn({ learn: 0, reset: 0 });
        setHist({ ...HIST_EMPTY });
        setPred({ ...PRED_EMPTY });
        ackHist.opacity = 0;
        ackPred.opacity = 0;
      });

      // A. historical data: new observations arrive, the series comes alive, and it sends what it has learned from
      tl.add(OBS_T, 1700, (p) => setHist({ obs: p }), linear);
      tl.add(OBS_T + 1300, 900, (p) => setHist({ active: p }), linear);
      tl.add(OBS_T + 1800, 1300, ackEnv(ackHist), linear);
      inPulses.forEach((ip, i) => tl.add(IN_T + i * 280, 1300, (p) => ip.setProgress(p), sine));

      // B. learning: the activation wave crosses the network, the core builds up, the pattern settles
      tl.add(LEARN_T, LEARN_MS, (p) => setLearn({ learn: p }), linear);

      // C. prediction: the core sends it out, and the future curve is drawn as it lands
      outPulses.forEach((op, i) => tl.add(OUT_T + i * 280, 1300, (p) => op.setProgress(p), sine));
      tl.add(OUT_T + 1300, 1500, ackEnv(ackPred), linear);
      tl.add(LINE_T, 2200, (p) => setPred({ line: p }), linear);
      tl.add(LINE_T + 500, 2200, (p) => setPred({ band: p }), linear);
      tl.add(KPI_T, 1500, (p) => setPred({ kpi: p }), linear);

      // D. hold, then E. everything eases back to dormant together
      tl.add(
        RESET_T,
        900,
        (p) => {
          setLearn({ reset: p });
          setHist({ obs: 1 - p, active: 1 - p });
          setPred({ fade: 1 - p });
        },
        easeInOutCubic,
      );
      tl.add(CYCLE_MS - 1, 1, () => {});
      return tl;
    }

    let phase = buildCycle();
    const loop = () => {
      phase = buildCycle();
      phase.whenDone(loop);
    };
    phase.whenDone(loop);

    // the canvases are repainted at ~30 fps, and only while their content is changing
    let sinceDraw = 0;
    tick = (dt: number) => {
      phase.tick(dt);
      if (coreDirty) {
        coreDirty = false;
        core.setState(learnState.learn, learnState.reset);
      }
      sinceDraw += dt;
      if (sinceDraw >= 33) {
        if (histDirty) {
          histDirty = false;
          sinceDraw = 0;
          hist.render(histProgress);
          histTex.needsUpdate = true;
        }
        if (predDirty) {
          predDirty = false;
          sinceDraw = 0;
          pred.render(predProgress);
          predTex.needsUpdate = true;
        }
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
    dispose() {
      group.traverse((o) => {
        const mm = o as { isMesh?: boolean; geometry?: { dispose(): void } };
        if (mm.isMesh && mm.geometry) mm.geometry.dispose();
      });
      owned.forEach((x) => x.dispose());
    },
  });
}
