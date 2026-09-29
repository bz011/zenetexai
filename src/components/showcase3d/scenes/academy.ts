import {
  AdditiveBlending,
  DirectionalLight,
  DoubleSide,
  Group,
  Color,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  PointLight,
  Shape,
  ShapeGeometry,
  Vector3,
  type Light,
} from "three";
import { Timeline, createTrailPulse, easeInOutCubic, type TrailPulse } from "../anim";
import { buildCard, buildDashboardPanel } from "../devices";
import { canvasTexture, lightPoolTexture, makeCanvas, softShadowTexture, vignetteTexture, type ShowcaseKit } from "../kit";
import { mix, tapeGeometry } from "../../core3d/geometry";
import { roundedPlane, roundedSlab } from "../shapes";
import type { UiFont } from "../uiFont";
import type { Translations } from "@/lib/translations";
import { drawGlowFrame, drawSheen } from "./agentsUi";
import {
  AI_H,
  AI_PILL,
  AI_W,
  CERT_H,
  CERT_W,
  COURSE_END,
  COURSE_H,
  COURSE_START,
  COURSE_W,
  LESSON_END,
  LESSON_H,
  LESSON_START,
  LESSON_W,
  SIM_END,
  SIM_H,
  SIM_START,
  SIM_W,
  createCoursePanel,
  createLessonScreen,
  createSimulatorPanel,
  drawAiCourseCard,
  drawCertificate,
  drawSeal,
  type CourseProgress,
  type LessonProgress,
  type SimProgress,
} from "./academyUi";
import type { ShowcaseScene } from "./types";

/**
 * SCENE 4 - ACADEMY. One journey, left to right: the PMP COURSE, the LESSON
 * (the laptop display, the hero), the EXAM SIMULATOR, and the CERTIFICATE -
 * LEARN -> PRACTICE -> PASS -> COMPLETE - with a small, quiet AI Agents Course
 * card as a hint of what is coming. Same renderer, plate, lighting family and
 * glass card language as the other scenes; everything is a stationary object.
 */

const GROUND_Y = -5.35;

const BLUE: [number, number, number] = [0.145, 0.388, 0.922];
const CYAN: [number, number, number] = [0.133, 0.827, 0.933];
const GOLD_RGB: [number, number, number] = [0.93, 0.72, 0.26];

// Composition (verified against the render at 1440x900, not the numbers).
const COURSE_POS: [number, number, number] = [-7.7, 0.6, 0.4];
const COURSE_ROT: [number, number, number] = [0, 0.3, 0.015];
const COURSE_SIZE = { w: 3.8, h: (3.8 * COURSE_H) / COURSE_W };

const LAPTOP_POS: [number, number, number] = [-2.15, 0, -0.1];
const LAPTOP_ROT: [number, number, number] = [0, 0.32, 0];
const SCREEN = { w: 6.2, h: (6.2 * LESSON_H) / LESSON_W, y: 0.6, pitch: -0.1 };
const DECK = { w: 6.5, h: 3.4, tilt: -1.05 };

const SIM_POS: [number, number, number] = [3.95, 1.1, -0.8];
const SIM_ROT: [number, number, number] = [0.01, -0.15, -0.03];
const SIM_SIZE = { w: 4.2, h: (4.2 * SIM_H) / SIM_W };

const CERT_POS: [number, number, number] = [8.35, 0.75, -0.6];
const CERT_ROT: [number, number, number] = [0.01, -0.12, -0.02];
const CERT_SIZE = { w: 3.3, h: (3.3 * CERT_H) / CERT_W };

const AI_POS: [number, number, number] = [7.1, -3.05, -0.3];
const AI_ROT: [number, number, number] = [0.01, -0.1, -0.015];
const AI_SIZE = { w: 5.5, h: (5.5 * AI_H) / AI_W };

/** A smooth stream between two points with a gentle S in height and a slight dip in depth. */
function streamPoints(a: Vector3, b: Vector3): Vector3[] {
  const pts: Vector3[] = [];
  for (let i = 0; i <= 4; i++) {
    const u = i / 4;
    const s = u * u * (3 - 2 * u);
    pts.push(new Vector3(a.x + (b.x - a.x) * u, a.y + (b.y - a.y) * s, a.z + (b.z - a.z) * u - 0.2 * Math.sin(Math.PI * u)));
  }
  return pts;
}

function streamMeshes(points: Vector3[], from: [number, number, number], to: [number, number, number], base: number): Mesh[] {
  const layers: [number, number][] = [
    [1, 0.14],
    [0.55, 0.3],
    [0.22, 0.7],
  ];
  return layers.map(([w, opacity]) => {
    const geo = tapeGeometry(points, base * w, 0.02, (u) => mix(from, to, u), 40);
    const mat = new MeshBasicMaterial({ vertexColors: true, transparent: true, opacity, blending: AdditiveBlending, depthWrite: false, toneMapped: false });
    return new Mesh(geo, mat);
  });
}

/** A key grid for the laptop's deck. */
function deckTexture() {
  const W = 1200;
  const H = 660;
  const { c, g } = makeCanvas(W, H);
  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#151b2e");
  bg.addColorStop(1, "#0d1220");
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  const rows = [14, 14, 13, 12, 8];
  rows.forEach((n, r) => {
    const rowW = 1080;
    const gap = 8;
    const kw = (rowW - gap * (n - 1)) / n;
    const y = 50 + r * 70;
    for (let i = 0; i < n; i++) {
      const x = 60 + i * (kw + gap);
      g.fillStyle = "rgba(255,255,255,0.055)";
      g.beginPath();
      g.roundRect(x, y, kw, 58, 9);
      g.fill();
      g.strokeStyle = "rgba(255,255,255,0.05)";
      g.lineWidth = 2;
      g.stroke();
    }
  });
  g.fillStyle = "rgba(255,255,255,0.03)";
  g.beginPath();
  g.roundRect(440, 410, 320, 200, 20);
  g.fill();
  g.strokeStyle = "rgba(255,255,255,0.06)";
  g.lineWidth = 2;
  g.stroke();
  return canvasTexture(c);
}

export function buildAcademyScene(kit: ShowcaseKit, font: UiFont, reducedMotion: boolean, t: Translations["showcase"]): Promise<ShowcaseScene> {
  const copy = t.academy;
  // everything that is an object of the scene lives in `content`, so the whole composition can be scaled and lifted as one
  const group = new Group();
  const content = new Group();
  content.scale.setScalar(1.08);
  content.position.set(0.15, 0.7, 0);
  group.add(content);
  const lights: Light[] = [];
  const owned: { dispose(): void }[] = [];
  const own = <T extends { dispose(): void }>(x: T): T => (owned.push(x), x);

  // Animated, the scene starts at its initial state (Module 3 active, lesson under way, simulator waiting, certificate
  // dormant); reduced motion paints the finished journey once.
  const finished = reducedMotion;

  // ── left: the PMP course ──
  const course = createCoursePanel(font, copy);
  const courseProgress: CourseProgress = { ...(finished ? COURSE_END : COURSE_START) };
  course.render(courseProgress);
  const courseTex = own(canvasTexture(course.canvas));
  const courseCard = buildCard(kit, courseTex, COURSE_SIZE.w, COURSE_SIZE.h, 0.34, 0.12);
  owned.push(...courseCard.owned);
  courseCard.group.position.set(...COURSE_POS);
  courseCard.group.rotation.set(...COURSE_ROT);
  content.add(courseCard.group);

  // ── centre: the lesson on a laptop (the hero) ──
  const lesson = createLessonScreen(font, copy);
  const lessonProgress: LessonProgress = { ...(finished ? LESSON_END : LESSON_START) };
  lesson.render(lessonProgress);
  const lessonTex = own(canvasTexture(lesson.canvas));
  const sheenTex = own(canvasTexture(drawSheen(), false));
  const laptop = new Group();
  laptop.position.set(...LAPTOP_POS);
  laptop.rotation.set(...LAPTOP_ROT);
  const screen = buildDashboardPanel(kit, lessonTex, SCREEN.w, SCREEN.h, sheenTex);
  owned.push(...screen.owned);
  screen.group.position.set(0, SCREEN.y, 0);
  screen.group.rotation.order = "YXZ";
  screen.group.rotation.x = SCREEN.pitch;
  laptop.add(screen.group);
  // the deck: a thin dark slab hinged at the screen's bottom edge, tilted up toward the viewer so its keys read
  const deck = new Group();
  const slab = new Mesh(own(roundedSlab(DECK.w, DECK.h, 0.1, 0.28, 0.03)), kit.titanium);
  deck.add(slab);
  const keysTex = own(deckTexture());
  const keys = new Mesh(own(roundedPlane(DECK.w - 0.24, DECK.h - 0.24, 0.2)), own(new MeshBasicMaterial({ map: keysTex, toneMapped: false })));
  keys.position.z = 0.056;
  deck.add(keys);
  const hinge = new Vector3(0, SCREEN.y - SCREEN.h / 2 + 0.02, -0.05);
  const up = new Vector3(0, Math.cos(DECK.tilt), Math.sin(DECK.tilt));
  deck.position.copy(hinge).addScaledVector(up, -DECK.h / 2);
  deck.rotation.x = DECK.tilt;
  laptop.add(deck);
  content.add(laptop);

  // ── right: the exam simulator ──
  const sim = createSimulatorPanel(font, copy);
  const simProgress: SimProgress = { ...(finished ? SIM_END : SIM_START) };
  sim.render(simProgress);
  const simTex = own(canvasTexture(sim.canvas));
  const simCard = buildCard(kit, simTex, SIM_SIZE.w, SIM_SIZE.h, 0.34, 0.12);
  owned.push(...simCard.owned);
  simCard.group.position.set(...SIM_POS);
  simCard.group.rotation.set(...SIM_ROT);
  content.add(simCard.group);

  // ── the certificate (dormant until the end) ──
  const certTex = own(canvasTexture(drawCertificate(font, copy, finished)));
  const certCard = buildCard(kit, certTex, CERT_SIZE.w, CERT_SIZE.h, 0.3, 0.1);
  owned.push(...certCard.owned);
  certCard.group.position.set(...CERT_POS);
  certCard.group.rotation.set(...CERT_ROT);
  content.add(certCard.group);

  // ── the AI Agents Course teaser (secondary) ──
  const aiTex = own(canvasTexture(drawAiCourseCard(font, copy)));
  const aiCard = buildCard(kit, aiTex, AI_SIZE.w, AI_SIZE.h, 0.3, 0.1);
  owned.push(...aiCard.owned);
  aiCard.group.position.set(...AI_POS);
  aiCard.group.rotation.set(...AI_ROT);
  content.add(aiCard.group);

  // ── the journey: three short arrows, each ending on the visible edge of the next object ──
  const edge = (pos: [number, number, number], rotY: number, halfW: number, side: 1 | -1, y: number): Vector3 =>
    new Vector3(pos[0] + side * halfW * Math.cos(rotY), y, pos[2] - side * halfW * Math.sin(rotY));
  const laptopEdge = (side: 1 | -1, y: number): Vector3 =>
    new Vector3(LAPTOP_POS[0] + side * (SCREEN.w / 2) * Math.cos(LAPTOP_ROT[1]), y, LAPTOP_POS[2] - side * (SCREEN.w / 2) * Math.sin(LAPTOP_ROT[1]));
  const arrows: { pts: Vector3[]; from: [number, number, number]; to: [number, number, number] }[] = [
    { pts: streamPoints(edge(COURSE_POS, COURSE_ROT[1], COURSE_SIZE.w / 2, 1, 0.55), laptopEdge(-1, -0.35)), from: BLUE, to: CYAN },
    { pts: streamPoints(laptopEdge(1, -0.4), edge(SIM_POS, SIM_ROT[1], SIM_SIZE.w / 2, -1, 0.7)), from: BLUE, to: CYAN },
    { pts: streamPoints(edge(SIM_POS, SIM_ROT[1], SIM_SIZE.w / 2, 1, 0.9), edge(CERT_POS, CERT_ROT[1], CERT_SIZE.w / 2, -1, 0.85)), from: GOLD_RGB, to: GOLD_RGB },
  ];
  arrows.forEach((a) => {
    streamMeshes(a.pts, a.from, a.to, 0.2).forEach((m) => content.add(m));
    // arrowhead: a small additive triangle pointing along the end of the path
    const end = a.pts[a.pts.length - 1];
    const prev = a.pts[a.pts.length - 2];
    const ang = Math.atan2(end.y - prev.y, end.x - prev.x);
    const tri = new Shape();
    tri.moveTo(0.16, 0);
    tri.lineTo(-0.1, 0.13);
    tri.lineTo(-0.1, -0.13);
    tri.closePath();
    const headMat = own(new MeshBasicMaterial({ transparent: true, opacity: 0.9, blending: AdditiveBlending, depthWrite: false, toneMapped: false, side: DoubleSide }));
    headMat.color.setRGB(...a.to);
    const head = new Mesh(own(new ShapeGeometry(tri)), headMat);
    head.position.copy(end);
    head.rotation.z = ang;
    head.renderOrder = 5;
    content.add(head);
  });

  // ── grounding: contact shadow and a cool pool ──
  const shadowTex = own(softShadowTexture());
  const contactShadow = new Mesh(
    own(new PlaneGeometry(13, 4)),
    own(new MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0.5, depthWrite: false, toneMapped: false })),
  );
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.set(0.1, GROUND_Y + 0.02, -0.4);
  contactShadow.renderOrder = -1;
  group.add(contactShadow);
  const poolTex = own(lightPoolTexture([56, 130, 240], 0.2));
  const pool = new Mesh(
    own(new PlaneGeometry(13, 6.5)),
    own(new MeshBasicMaterial({ map: poolTex, transparent: true, depthWrite: false, toneMapped: false })),
  );
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(0.2, GROUND_Y + 0.03, -0.4);
  pool.renderOrder = -2;
  group.add(pool);
  const vignetteTex = own(vignetteTexture(0.4));
  const vignette = new Mesh(
    own(new PlaneGeometry(22, 16)),
    own(new MeshBasicMaterial({ map: vignetteTex, transparent: true, depthWrite: false, toneMapped: false, side: DoubleSide })),
  );
  vignette.position.set(0, 1.2, -9.6);
  vignette.renderOrder = -4;
  group.add(vignette);

  // ── lighting: the same family as the other scenes ──
  const key = new DirectionalLight(0xe7edff, 1.7);
  key.position.set(-6, 10, 11);
  const rimR = new DirectionalLight(0x6ea8ff, 2.4);
  rimR.position.set(9, 4, -8);
  const warmLeft = new PointLight(0xffa85e, 3.0, 13, 2);
  warmLeft.position.set(-9.5, 2, 5);
  const coolRight = new PointLight(0x38d6ee, 5, 14, 2);
  coolRight.position.set(9, 0.5, 3);
  lights.push(key, rimR, warmLeft, coolRight);

  // ── animation: LEARN -> PROGRESS -> PRACTICE -> PASS -> COMPLETE, one loop ──
  // Told only by UI state changes on the objects (progress moving, a check appearing, an answer being chosen and
  // marked correct, the certificate coming to life), short pulses on the three arrows, and a brief edge glow where
  // something is achieved. No object moves, and none changes brightness as a whole.
  let tick: ((dtMs: number) => boolean) | undefined;
  if (!reducedMotion) {
    const mkPulse = (pts: Vector3[], rgb: [number, number, number], size: number): TrailPulse => {
      const p = createTrailPulse(kit, own, pts, rgb, size);
      content.add(p.sprite);
      return p;
    };
    const pulses = [
      mkPulse(arrows[0].pts, [170, 215, 255], 1.6),
      mkPulse(arrows[1].pts, [170, 215, 255], 1.6),
      mkPulse(arrows[2].pts, [255, 218, 130], 1.6),
    ];

    // a second content layer over a card's face, crossfaded in to change what the card says
    const addLayer = (card: { group: Group }, tex: ReturnType<typeof canvasTexture>, cw: number, ch: number, radius: number, depth: number): MeshBasicMaterial => {
      const m = own(
        new MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
      );
      const plane = new Mesh(own(roundedPlane(cw - 0.07, ch - 0.07, Math.max(0.02, radius - 0.035))), m);
      plane.renderOrder = 4;
      plane.position.z = depth / 2 + 0.008;
      card.group.add(plane);
      return m;
    };
    const certActiveTex = own(canvasTexture(drawCertificate(font, copy, true)));
    const certLayer = addLayer(certCard, certActiveTex, CERT_SIZE.w, CERT_SIZE.h, 0.3, 0.1);
    // the medal, revealed last, on its own plane near the certificate's top
    const sealTex = own(canvasTexture(drawSeal(), false));
    const sealMat = own(new MeshBasicMaterial({ map: sealTex, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }));
    const SEAL = 1.0;
    const seal = new Mesh(own(new PlaneGeometry(SEAL, SEAL)), sealMat);
    seal.position.set(0, (0.5 - 146 / CERT_H) * CERT_SIZE.h, 0.1 / 2 + 0.03);
    seal.renderOrder = 5;
    certCard.group.add(seal);

    // short edge glows (the same soft outline the other scenes use)
    const glowTextures = new Map<string, ReturnType<typeof canvasTexture>>();
    const addAck = (card: { group: Group }, cw: number, ch: number, radius: number, depth: number, accent: string, at?: { x: number; y: number }): MeshBasicMaterial => {
      const PX = 200;
      const PAD = 50;
      const key = `${cw.toFixed(3)}x${ch.toFixed(3)}`;
      let tex = glowTextures.get(key);
      if (!tex) {
        tex = own(canvasTexture(drawGlowFrame(cw * PX, ch * PX, radius * PX, PAD, 0.06), false));
        glowTextures.set(key, tex);
      }
      const m = own(new MeshBasicMaterial({ map: tex, color: new Color(accent), transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending, toneMapped: false }));
      const plane = new Mesh(own(new PlaneGeometry(cw + (PAD * 2) / PX, ch + (PAD * 2) / PX)), m);
      plane.renderOrder = 5;
      plane.position.set(at?.x ?? 0, at?.y ?? 0, depth / 2 + 0.02);
      card.group.add(plane);
      return m;
    };
    const ackSim = addAck(simCard, SIM_SIZE.w, SIM_SIZE.h, 0.34, 0.12, "#34d399");
    const ackCert = addAck(certCard, CERT_SIZE.w, CERT_SIZE.h, 0.3, 0.1, "#e5b94e");
    // around the "Coming Soon" pill on the AI card
    const aiPx = AI_SIZE.w / AI_W;
    const pillW = AI_PILL.w * aiPx;
    const pillH = AI_PILL.h * aiPx;
    const pillAt = { x: (AI_PILL.x + 116 + AI_PILL.w / 2 - AI_W / 2) * aiPx, y: (AI_H / 2 - (AI_PILL.y + AI_PILL.h / 2)) * aiPx };
    const ackAi = addAck(aiCard, pillW, pillH, pillH / 2, 0.1, "#8a86ff", pillAt);
    const allAcks = [ackSim, ackCert, ackAi];
    const ackEnv = (m: MeshBasicMaterial) => (p: number) => {
      const rise = 0.18;
      m.opacity = 0.8 * (p < rise ? p / rise : Math.pow(1 - (p - rise) / (1 - rise), 1.6));
    };

    const linear = (t: number) => t;
    const sine = (t: number) => 0.5 - Math.cos(Math.PI * t) / 2;
    // raw story values (0..1); `fade` eases everything back to the starting state on reset
    const story = { play: LESSON_START.play, complete: 0, done3: 0, bar: 0, next4: 0, active: 0, select: 0, press: 0, result: 0, advance: 0, cert: 0, seal: 0, fade: 1 };
    let dirty = true;
    const set = (patch: Partial<typeof story>) => {
      Object.assign(story, patch);
      dirty = true;
    };
    const applyLayers = () => {
      certLayer.opacity = smooth01(smooth01(story.cert)) * story.fade; // steeper than a plain smoothstep: the two layers spend less time half-visible
      sealMat.opacity = smooth01(story.seal) * story.fade;
      const sc = 0.82 + 0.18 * smooth01(story.seal);
      seal.scale.set(sc, sc, 1);
    };
    function smooth01(t: number): number {
      const c = Math.max(0, Math.min(1, t));
      return c * c * (3 - 2 * c);
    }
    const paint = () => {
      const f = story.fade;
      courseProgress.done3 = story.done3 * f;
      courseProgress.bar = story.bar * f;
      courseProgress.next4 = story.next4 * f;
      course.render(courseProgress);
      courseTex.needsUpdate = true;
      lessonProgress.play = LESSON_START.play + (story.play - LESSON_START.play) * f;
      lessonProgress.complete = story.complete * f;
      lesson.render(lessonProgress);
      lessonTex.needsUpdate = true;
      simProgress.active = story.active * f;
      simProgress.select = story.select * f;
      simProgress.press = story.press * f;
      simProgress.result = story.result * f;
      simProgress.advance = story.advance * f;
      sim.render(simProgress);
      simTex.needsUpdate = true;
    };

    // ms on the cycle clock
    const CYCLE_MS = 17200;
    function buildCycle(): Timeline {
      const tl = new Timeline();
      tl.at(0, () => {
        set({ play: LESSON_START.play, complete: 0, done3: 0, bar: 0, next4: 0, active: 0, select: 0, press: 0, result: 0, advance: 0, cert: 0, seal: 0, fade: 1 });
        allAcks.forEach((m) => (m.opacity = 0));
      });

      // LEARN: the course hands the lesson over, and it plays
      tl.add(300, 1200, (p) => pulses[0].setProgress(p), sine);
      tl.add(700, 4200, (p) => set({ play: LESSON_START.play + (1 - LESSON_START.play) * p }), linear);

      // PROGRESS: the lesson completes, Module 3 becomes a check, the course advances and Module 4 opens
      tl.add(4900, 600, (p) => set({ complete: p }), linear);
      tl.add(4900, 900, (p) => set({ done3: p }), linear);
      tl.add(5100, 1000, (p) => set({ bar: p }), linear);
      tl.add(5900, 900, (p) => set({ next4: p }), linear);

      // PRACTICE: attention moves to the simulator; a question comes alive, an answer is chosen, submitted, marked correct
      tl.add(6000, 1200, (p) => pulses[1].setProgress(p), sine);
      tl.add(7000, 700, (p) => set({ active: p }), linear);
      tl.add(7900, 500, (p) => set({ select: p }), linear);
      tl.add(9000, 300, (p) => set({ press: p }), linear);
      tl.add(9300, 300, (p) => set({ press: 1 - p }), linear);
      tl.add(9300, 700, (p) => set({ result: p }), linear);
      tl.add(9300, 1400, ackEnv(ackSim), linear);
      tl.add(10000, 700, (p) => set({ advance: p }), linear);

      // PASS -> COMPLETE: the result travels to the certificate, which comes to life, gold-edged, medal last
      tl.add(10300, 1200, (p) => pulses[2].setProgress(p), sine);
      tl.add(11500, 1200, (p) => set({ cert: p }), linear);
      tl.add(11500, 1600, ackEnv(ackCert), linear);
      tl.add(12200, 800, (p) => set({ seal: p }), linear);

      // the AI Agents Course teaser: one quiet acknowledgement around "Coming Soon"
      tl.add(13300, 1300, ackEnv(ackAi), linear);

      // hold the finished journey, then everything eases back to the starting state
      tl.add(15600, 900, (p) => set({ fade: 1 - p }), easeInOutCubic);
      tl.add(CYCLE_MS - 1, 1, () => {});
      return tl;
    }

    let phase = buildCycle();
    const loop = () => {
      phase = buildCycle();
      phase.whenDone(loop);
    };
    phase.whenDone(loop);

    // the canvases repaint at ~30 fps, and only while something on them is changing
    let sinceDraw = 0;
    tick = (dt: number) => {
      phase.tick(dt);
      applyLayers();
      sinceDraw += dt;
      if (dirty && sinceDraw >= 33) {
        sinceDraw = 0;
        dirty = false;
        paint();
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
    portrait: {
      // the laptop's screen, in world space (content is scaled 1.08 and offset (0.15, 0.7, 0) as a group)
      target: new Vector3(0.15 + 1.08 * LAPTOP_POS[0], 0.7 + 1.08 * (LAPTOP_POS[1] + SCREEN.y), 1.08 * LAPTOP_POS[2]),
      dist: 30,
      yaw: 4,
      pitch: 3,
    },
    dispose() {
      group.traverse((o) => {
        const mm = o as { isMesh?: boolean; geometry?: { dispose(): void } };
        if (mm.isMesh && mm.geometry) mm.geometry.dispose();
      });
      owned.forEach((x) => x.dispose());
    },
  });
}
