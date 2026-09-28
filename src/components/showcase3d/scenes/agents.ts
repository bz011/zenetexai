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
  type Material,
  type Texture,
} from "three";
import { buildCard, loadPhoneModel, PHONE_MODEL, type CardBuilt } from "../devices";
import { canvasTexture, lightPoolTexture, reflectionMaterial, softShadowTexture, vignetteTexture, type ShowcaseKit } from "../kit";
import { roundedPlane } from "../shapes";
import { glowTrail, ramp, trailPoints } from "../ribbon";
import { buildGlow, createTrailPulse, easeInOutCubic, Timeline, type TrailPulse } from "../anim";
import type { UiFont } from "../uiFont";
import {
  PHONE_EMPTY,
  PHONE_FULL,
  createPhoneScreen,
  drawCalendarCard,
  drawGlowFrame,
  drawInputCard,
  drawResultChip,
  drawSheen,
  type PhoneProgress,
} from "./agentsUi";
import type { ShowcaseScene } from "./types";

/**
 * SCENE 1 - AI AGENTS. A real phone (see devices.ts / the attribution doc)
 * shows the conversation and the decision only; the confirmed action lives on
 * the right, as one output cluster. Four inputs float, staggered in 3D, on
 * the left. Static glow trails carry the eye across the gap; a small pulse
 * rides each trail during the story. No opaque platform: the approved
 * cinematic plate (loaded once, in mountShowcase) is the stage.
 *
 * Motion is one repeating story that reads as cause and effect: a customer
 * request travels in from Messages, the assistant reads it and consults
 * Documents, offers times, the customer picks one (again through Messages),
 * the assistant books it in the calendar, and only then do the two result
 * cards activate. It is told by small pulses riding the existing trails, by
 * the phone conversation fading and rising into place, and by content
 * crossfades and short edge glows on the cards - never by a card, the phone
 * or a light changing brightness, and nothing ever moves. Under reduced
 * motion none of this builds at all - the static, fully-resolved frame is
 * shown immediately.
 */

const PHONE_H = 10.6;
const PHONE_W = PHONE_H * (PHONE_MODEL.size.w / PHONE_MODEL.size.h);
const GROUND_Y = -5.35;
/** ~17% smaller on screen than the approved frame (final polish pass): moved deeper in Z rather than scaled, so material/lighting response is unchanged */
const PHONE_Z = -10.2;
/** yaw ~20 degrees, roll ~6.5 degrees - read against the approved reference */
const PHONE_ROT: [number, number, number] = [0.02, -0.35, 0.114];

const BLUE: [number, number, number] = [0.145, 0.388, 0.922];
const CYAN: [number, number, number] = [0.133, 0.827, 0.933];
const VIOLET: [number, number, number] = [0.56, 0.36, 0.93];
/** the pulse colour, 0..255 (createTrailPulse takes 8-bit channels) */
const PULSE_RGB: [number, number, number] = [158, 199, 255];

interface InputSpec {
  kind: "messages" | "email" | "website" | "documents";
  title: string;
  subtitle: string;
  accent: string;
  pos: [number, number, number];
  rot: [number, number, number];
  scale: number;
}

// Staggered like objects drifting through the room toward the phone: no
// shared x, no shared z, no even vertical rhythm - each card its own depth,
// tilt and roll. Pulled inward from the previous pass so every card - the
// Messages card especially - sits fully inside the viewport at 1440x900,
// clear of the header and both edges. Copy is one clear word each.
const INPUTS: InputSpec[] = [
  { kind: "messages", title: "Messages", subtitle: "Customer request", accent: "#60a5fa", pos: [-7.5, 3.75, 2.0], rot: [0.03, -0.22, 0.05], scale: 0.96 },
  { kind: "email", title: "Email", subtitle: "New inquiry", accent: "#60a5fa", pos: [-6.5, 2.0, -0.35], rot: [0.02, -0.14, -0.03], scale: 0.9 },
  { kind: "website", title: "Website", subtitle: "Booking request", accent: "#38d6ee", pos: [-7.8, 0.2, 1.0], rot: [0.015, -0.26, 0.04], scale: 0.94 },
  { kind: "documents", title: "Documents", subtitle: "Knowledge", accent: "#38d6ee", pos: [-6.4, -1.8, -0.9], rot: [0.01, -0.16, -0.045], scale: 0.84 },
];

/** Header orb centre in the phone-screen canvas (944 x 2115) - see agentsUi.ts's drawPhoneScreen header layout. */
const ORB_PX = { x: 118, y: 214 };
/** Offset from a textured face's centre, in world units, for a point given in that texture's pixel space. */
function pixelOffset(px: number, py: number, canvasW: number, canvasH: number, faceW: number, faceH: number): Vector3 {
  return new Vector3((px / canvasW - 0.5) * faceW, (0.5 - py / canvasH) * faceH, 0);
}

/** `Mesh.material` is typed as Material | Material[]; buildCard always assigns exactly one. */
function mat(m: Mesh): Material {
  return m.material as Material;
}

/** A rounded face-sized plane laid just in front of a card's face: a second layer of content that is crossfaded in. */
const OVERLAY_Z = 0.008;

export function buildAgentsScene(kit: ShowcaseKit, font: UiFont, reducedMotion: boolean): Promise<ShowcaseScene> {
  return loadPhoneModel(PHONE_H).then((phone) => {
    const group = new Group();
    const lights: Light[] = [];
    const owned: { dispose(): void }[] = [];
    const own = <T extends { dispose(): void }>(x: T): T => (owned.push(x), x);
    owned.push(phone);

    // ── phone: conversation + decision only ──
    phone.group.rotation.set(...PHONE_ROT);
    phone.group.position.set(0, GROUND_Y + PHONE_H / 2 + 0.02, PHONE_Z);
    group.add(phone.group);

    // The phone screen is a live canvas (see createPhoneScreen): animated, it
    // starts empty and the cycle fills the conversation in; reduced motion
    // paints the finished conversation once.
    const phoneUi = createPhoneScreen(font);
    const phoneProgress: PhoneProgress = { ...(reducedMotion ? PHONE_FULL : PHONE_EMPTY) };
    phoneUi.render(phoneProgress);
    const screenTex = kit.track(canvasTexture(phoneUi.canvas));

    const sheenTex = kit.track(canvasTexture(drawSheen(), false));

    // the UI overlay: a child of the SAME wrapper the model scale lives on, so
    // it sits exactly on the model's own measured screen rectangle (see the
    // attribution doc) and inherits the phone's position/rotation for free.
    const { screen } = PHONE_MODEL;
    const sw = screen.w * 0.895;
    const sh = screen.h * 0.928;
    const faceY = screen.y - screen.h * 0.018;
    const screenMat = own(new MeshBasicMaterial({ map: screenTex, transparent: true, toneMapped: false }));
    const screenFace = new Mesh(own(roundedPlane(sw, sh, sw * 0.075)), screenMat);
    screenFace.position.set(screen.x, faceY, screen.z + 0.00016);
    phone.group.add(screenFace);
    const sheenMat = own(
      new MeshBasicMaterial({ map: sheenTex, transparent: true, blending: AdditiveBlending, depthWrite: false, toneMapped: false }),
    );
    const sheenFace = new Mesh(own(roundedPlane(sw, sh, sw * 0.075)), sheenMat);
    sheenFace.position.set(screen.x, faceY, screen.z + 0.0002);
    phone.group.add(sheenFace);

    // very faint reflection under the phone. A live-synced copy (not a
    // one-time clone) so it always matches the phone's current transform,
    // including the small depth settle the intro animates.
    const mirror = new Group();
    mirror.scale.y = -1;
    mirror.position.y = 2 * GROUND_Y;
    const echo = phone.group.clone(true);
    echo.traverse((o) => {
      const m = o as Mesh;
      if (!m.isMesh) return;
      m.castShadow = false;
      m.material = own(reflectionMaterial(m.material as Material, GROUND_Y, 4.2, 0.12));
    });
    mirror.add(echo);
    group.add(mirror);

    const phoneLocal = (px: number, py: number, zEps: number): Vector3 =>
      new Vector3(screen.x, faceY, screen.z + zEps).add(pixelOffset(px, py, 944, 2115, sw, sh));

    // ── acknowledgement glows: a short edge glow on a card, tinted per use ──
    const ackTextures = new Map<string, Texture>();
    /** an additive edge-glow plane on the card's face; returns its material (opacity 0 until driven) */
    function addAck(card: CardBuilt, cw: number, ch: number, radius: number, depth: number, accent: string): MeshBasicMaterial {
      const PX = 200; // canvas px per world unit
      const PAD = 50;
      const key = `${cw}x${ch}`;
      let tex = ackTextures.get(key);
      if (!tex) {
        tex = kit.track(canvasTexture(drawGlowFrame(cw * PX, ch * PX, radius * PX, PAD, 0.06), false));
        ackTextures.set(key, tex);
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
    }
    /** a second content layer over a card's face, faded in to change what the card says without touching the card itself */
    function addLayer(card: CardBuilt, tex: Texture, cw: number, ch: number, radius: number, depth: number): MeshBasicMaterial {
      const m = own(
        new MeshBasicMaterial({
          map: tex,
          transparent: true,
          opacity: 0,
          depthWrite: false,
          toneMapped: false,
          polygonOffset: true,
          polygonOffsetFactor: -2,
          polygonOffsetUnits: -2,
        }),
      );
      const plane = new Mesh(own(roundedPlane(cw - 0.07, ch - 0.07, Math.max(0.02, radius - 0.035))), m);
      plane.renderOrder = 4;
      plane.userData.isGlow = true;
      plane.position.z = depth / 2 + OVERLAY_Z;
      card.group.add(plane);
      return m;
    }

    // ── left: business inputs, floating through the room toward the phone ──
    const inputCards: CardBuilt[] = [];
    const inputLanes: { toPhone: Vector3[] }[] = [];
    INPUTS.forEach((spec, i) => {
      const tex = kit.track(canvasTexture(drawInputCard(font, spec.kind, spec.title, spec.subtitle, spec.accent)));
      const card = buildCard(kit, tex, 3.1, 1.96, 0.28, 0.08);
      owned.push(...card.owned);
      card.group.position.set(...spec.pos);
      card.group.rotation.set(...spec.rot);
      card.group.scale.setScalar(spec.scale);
      group.add(card.group);
      inputCards.push(card);

      // static trail: unchanged geometry, each input on its own path (see the checkpoint report)
      const anchor = new Vector3(spec.pos[0] + 1.3, spec.pos[1] - 0.1, spec.pos[2]);
      const target = new Vector3(-PHONE_W / 2 + 0.35, 3.4 - i * 1.55, PHONE_Z - 1.0 - i * 0.05);
      glowTrail(anchor, target, ramp(BLUE, i % 2 ? CYAN : VIOLET), 0.13).forEach((m) => group.add(m));
      inputLanes.push({ toPhone: trailPoints(anchor, target) });
    });

    // ── right: one output cluster - the calendar, with two results nested at its corner ──
    // Animated, each starts dormant (the calendar's 10:00 slot is open, the result cards are muted)
    // and a second layer is faded in when the story reaches it; reduced motion shows the finished cards.
    const CAL_W = 4.9;
    const CAL_H = 3.528;
    const CAL_DEPTH = 0.1;
    const calTex = kit.track(canvasTexture(drawCalendarCard(font, reducedMotion ? "full" : "shell")));
    const cal = buildCard(kit, calTex, CAL_W, CAL_H, 0.32, CAL_DEPTH);
    owned.push(...cal.owned);
    const calPos: [number, number, number] = [8.3, 2.35, -0.6];
    cal.group.position.set(...calPos);
    cal.group.rotation.set(0.015, 0.3, -0.02);
    group.add(cal.group);
    const results: { pos: [number, number, number]; rot: [number, number, number]; title: string; subtitle: string }[] = [
      { pos: [9.5, -0.35, -1.15], rot: [0.01, 0.26, -0.03], title: "Confirmation sent", subtitle: "Email + message" },
      { pos: [8.55, -1.85, -1.65], rot: [0.008, 0.28, -0.035], title: "Customer notified", subtitle: "Reminder scheduled" },
    ];
    const RES_W = 3.35;
    const RES_H = 1.42;
    const RES_DEPTH = 0.08;
    const resultCards: CardBuilt[] = [];
    const resultLanes: { fromPhone: Vector3[] }[] = [];
    results.forEach((r) => {
      const tex = kit.track(canvasTexture(drawResultChip(font, r.title, r.subtitle, reducedMotion)));
      const card = buildCard(kit, tex, RES_W, RES_H, 0.26, RES_DEPTH);
      owned.push(...card.owned);
      card.group.position.set(...r.pos);
      card.group.rotation.set(...r.rot);
      group.add(card.group);
      resultCards.push(card);
      const i = resultCards.length - 1;
      const source = new Vector3(PHONE_W / 2 - 0.45, 2.4 - (i + 1) * 1.7, PHONE_Z - 0.6);
      const anchor = new Vector3(r.pos[0] - 1.35, r.pos[1], r.pos[2]);
      resultLanes.push({ fromPhone: trailPoints(source, anchor) });
      glowTrail(source, anchor, ramp(BLUE, CYAN), 0.15).forEach((m) => group.add(m));
    });
    // the calendar's own trail (phone -> calendar)
    const calSource = new Vector3(PHONE_W / 2 - 0.45, 2.4, PHONE_Z - 0.6);
    const calAnchor = new Vector3(calPos[0] - 1.95, calPos[1] - 0.2, calPos[2]);
    glowTrail(calSource, calAnchor, ramp(BLUE, CYAN), 0.15).forEach((m) => group.add(m));
    const calLane = trailPoints(calSource, calAnchor);

    // the orb's presence: a fixed, non-animated glow - constant brightness,
    // exactly like the approved static frame. No breathing, no pulsing: any
    // continuously-varying intensity here reads as the whole-object flash
    // this scene must never have.
    const orbGlow = buildGlow(kit, own, 2.0, [110, 170, 255]);
    orbGlow.position.copy(phoneLocal(ORB_PX.x, ORB_PX.y, 0.0009));
    phone.group.add(orbGlow);
    (mat(orbGlow) as MeshBasicMaterial).opacity = 0.14;

    // ── grounding only: contact shadow, a faint cool pool, no opaque disc ──
    const shadowTex = kit.track(softShadowTexture());
    const contactShadow = new Mesh(
      own(new PlaneGeometry(6.0, 2.8)),
      own(new MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0.55, depthWrite: false, toneMapped: false })),
    );
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.set(0.1, GROUND_Y + 0.02, 0.1);
    contactShadow.renderOrder = -1;
    group.add(contactShadow);

    const poolTex = kit.track(lightPoolTexture([56, 130, 240], 0.22));
    const pool = new Mesh(
      own(new PlaneGeometry(10, 6)),
      own(new MeshBasicMaterial({ map: poolTex, transparent: true, depthWrite: false, toneMapped: false })),
    );
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(0.3, GROUND_Y + 0.03, PHONE_Z + 0.2);
    pool.renderOrder = -2;
    group.add(pool);

    // a soft dark fade behind the phone, so the plate separates from the hero
    const vignetteTex = kit.track(vignetteTexture(0.4));
    const vignette = new Mesh(
      own(new PlaneGeometry(20, 16)),
      own(new MeshBasicMaterial({ map: vignetteTex, transparent: true, depthWrite: false, toneMapped: false, side: DoubleSide })),
    );
    vignette.position.set(0, 1.2, PHONE_Z - 3.6);
    vignette.renderOrder = -4;
    group.add(vignette);

    // ── lighting: cool key/rim, a warm light on the left objects, cool on the right ──
    const key = new DirectionalLight(0xe7edff, 1.7);
    key.position.set(-6, 10, 11);
    const rimR = new DirectionalLight(0x6ea8ff, 2.4);
    rimR.position.set(9, 4, -8);
    const warmLeft = new PointLight(0xffa85e, 3.2, 13, 2);
    warmLeft.position.set(-9.5, 2, 5);
    const coolRight = new PointLight(0x38d6ee, 5, 14, 2);
    coolRight.position.set(9, 0.5, 3);
    lights.push(key, rimR, warmLeft, coolRight);

    // ── animation: one repeating story, REQUEST -> UNDERSTAND -> DECIDE -> ACT -> CONFIRM ──
    let tick: ((dtMs: number) => boolean) | undefined;
    if (!reducedMotion) {
      // Every material sits at its final, constant appearance from the very
      // first frame: nothing here ever animates a card's, the phone's or a
      // light's brightness, and nothing moves. Cards change what they say by
      // crossfading a second content layer in; they acknowledge with a short
      // edge glow.
      sheenMat.opacity = 0.5;
      mat(cal.body).opacity = 0.94;
      mat(cal.face).opacity = 0.96;
      inputCards.forEach((c) => {
        mat(c.body).opacity = 1;
        mat(c.face).opacity = 1;
      });
      resultCards.forEach((c) => {
        mat(c.body).opacity = 0.94;
        mat(c.face).opacity = 0.96;
      });

      const PULSE = PULSE_RGB;
      const PULSE_OUT: [number, number, number] = [150, 240, 255];
      const mkPulse = (pts: Vector3[], rgb: [number, number, number], size: number): TrailPulse => {
        const pulse = createTrailPulse(kit, own, pts, rgb, size);
        group.add(pulse.sprite);
        return pulse;
      };
      const reversed = (pts: Vector3[]): Vector3[] => pts.slice().reverse();
      const msgPulse = mkPulse(inputLanes[0].toPhone, PULSE, 0.95); // Messages -> phone (used twice: request, then the customer's pick)
      const docQuery = mkPulse(reversed(inputLanes[3].toPhone), PULSE, 0.95); // phone -> Documents
      const docReply = mkPulse(inputLanes[3].toPhone, PULSE, 0.95); // Documents -> phone
      const calPulse = mkPulse(calLane, PULSE, 1.3); // phone -> calendar (the booking action)
      const outPulses = resultLanes.map((l) => mkPulse(l.fromPhone, PULSE_OUT, 1.4)); // phone -> result cards

      // dormant -> active content layers
      const calIdle = addLayer(cal, kit.track(canvasTexture(drawCalendarCard(font, "idle"))), CAL_W, CAL_H, 0.32, CAL_DEPTH);
      calIdle.opacity = 1;
      const calBooked = addLayer(cal, kit.track(canvasTexture(drawCalendarCard(font, "booked"))), CAL_W, CAL_H, 0.32, CAL_DEPTH);
      const calFooter = addLayer(cal, kit.track(canvasTexture(drawCalendarCard(font, "footer"))), CAL_W, CAL_H, 0.32, CAL_DEPTH);
      const chipActive = resultCards.map((c, i) =>
        addLayer(c, kit.track(canvasTexture(drawResultChip(font, results[i].title, results[i].subtitle, true))), RES_W, RES_H, 0.26, RES_DEPTH),
      );
      const layers = { calBooked: 0, calFooter: 0, chip0: 0, chip1: 0 };
      /** slot change: the open slot fades out and the booking fades in right behind it (a tiny overlap, so the slot never goes empty) - and back again on reset */
      const xOut = (p: number) => Math.max(0, Math.min(1, 1 - p / 0.4));
      const xIn = (p: number) => Math.max(0, Math.min(1, (p - 0.3) / 0.7));
      /** content layers follow their story values, and fade with the chat on reset */
      const applyLayers = () => {
        const f = phoneProgress.fade;
        const booked = layers.calBooked * f;
        calIdle.opacity = xOut(booked);
        calBooked.opacity = xIn(booked);
        calFooter.opacity = layers.calFooter * f;
        chipActive[0].opacity = layers.chip0 * f;
        chipActive[1].opacity = layers.chip1 * f;
      };

      // short edge glows
      const ackMsg = addAck(inputCards[0], 3.1, 1.96, 0.28, 0.08, INPUTS[0].accent);
      const ackDocs = addAck(inputCards[3], 3.1, 1.96, 0.28, 0.08, INPUTS[3].accent);
      const ackCal = addAck(cal, CAL_W, CAL_H, 0.32, CAL_DEPTH, "#60a5fa");
      const ackChips = resultCards.map((c) => addAck(c, RES_W, RES_H, 0.26, RES_DEPTH, "#22d3ee"));
      const allAcks = [ackMsg, ackDocs, ackCal, ...ackChips];
      const ackEnv = (m: MeshBasicMaterial) => (p: number) => {
        const rise = 0.18;
        m.opacity = 0.8 * (p < rise ? p / rise : Math.pow(1 - (p - rise) / (1 - rise), 1.6));
      };

      const linear = (t: number) => t;
      const sine = (t: number) => 0.5 - Math.cos(Math.PI * t) / 2;
      let phoneDirty = false;
      const setPhone = (patch: Partial<PhoneProgress>) => {
        Object.assign(phoneProgress, patch);
        phoneDirty = true;
      };

      function buildCycle(): Timeline {
        const tl = new Timeline();
        tl.at(0, () => {
          Object.assign(phoneProgress, PHONE_EMPTY);
          phoneDirty = true;
          layers.calBooked = layers.calFooter = layers.chip0 = layers.chip1 = 0;
          allAcks.forEach((m) => (m.opacity = 0));
        });

        // 1. REQUEST - a customer message travels Messages -> phone and appears in the chat
        tl.add(400, 1300, ackEnv(ackMsg), linear);
        tl.add(450, 1100, (p) => msgPulse.setProgress(p), sine);
        tl.add(1500, 400, (p) => setPhone({ status: p }), linear); // "Reading request…"
        tl.add(1550, 450, (p) => setPhone({ request: p }), linear);

        // 2. UNDERSTAND - the assistant is working (typing dots), and consults Documents
        tl.add(2050, 400, (p) => setPhone({ thinking: p }), linear);
        tl.add(2500, 400, (p) => setPhone({ status: 1 + p }), linear); // "Searching knowledge…"
        tl.add(2500, 1000, (p) => docQuery.setProgress(p), sine);
        tl.add(3400, 1300, ackEnv(ackDocs), linear);
        tl.add(3600, 1000, (p) => docReply.setProgress(p), sine);
        tl.add(4600, 400, (p) => setPhone({ status: 2 + p }), linear); // back to "Online"
        tl.add(4650, 500, (p) => setPhone({ reply: p }), linear);
        tl.add(5300, 900, (p) => setPhone({ chips: p }), linear);

        // 3. DECIDE - the customer picks 10:00 (through Messages again)
        tl.add(6400, 1300, ackEnv(ackMsg), linear);
        tl.add(6450, 1050, (p) => msgPulse.setProgress(p), sine);
        tl.add(7500, 350, (p) => setPhone({ select: p }), linear);
        tl.add(7800, 450, (p) => setPhone({ choice: p }), linear);

        // 4. ACT - verify availability, then the booking action goes to the calendar
        tl.add(8400, 400, (p) => setPhone({ status: 3 + p }), linear); // "Verifying availability…"
        tl.add(8400, 450, (p) => setPhone({ verify: p }), linear);
        tl.add(8850, 1300, (p) => setPhone({ work: 0.6 * p }), sine);
        tl.add(10250, 400, (p) => setPhone({ status: 4 + p }), linear); // "Booking appointment…"
        tl.add(10250, 500, (p) => setPhone({ booking: p }), linear);
        tl.add(10250, 1200, (p) => setPhone({ work: 0.6 + 0.4 * p }), sine);
        tl.add(10500, 1000, (p) => calPulse.setProgress(p), sine);
        tl.add(11500, 800, (p) => (layers.calBooked = p), linear); // the slot fills in
        tl.add(11500, 1500, ackEnv(ackCal), linear);
        tl.add(11700, 400, (p) => setPhone({ status: 5 + p }), linear); // back to "Online"
        tl.add(11700, 700, (p) => setPhone({ done: p }), linear); // "You're booked"

        // 5. CONFIRM - only now do the two results go out
        outPulses.forEach((op, i) => {
          const t = 12600 + i * 350;
          tl.add(t, 900, (pp) => op.setProgress(pp), sine);
          tl.add(t + 900, 500, (pp) => (i === 0 ? (layers.chip0 = pp) : (layers.chip1 = pp)), linear);
          tl.add(t + 900, 1300, ackEnv(ackChips[i]), linear);
        });
        tl.add(13500, 500, (p) => (layers.calFooter = p), linear);

        // 6. hold the finished frame, then fade everything back to the clean start
        tl.add(16000, 900, (p) => setPhone({ fade: 1 - p }), easeInOutCubic);
        tl.add(CYCLE_MS - 1, 1, () => {});
        return tl;
      }
      const CYCLE_MS = 17000;

      let phase = buildCycle();
      const loop = () => {
        phase = buildCycle();
        phase.whenDone(loop);
      };
      phase.whenDone(loop);

      // the phone canvas is repainted at ~30 fps, and only while something on it is changing
      let sinceDraw = 0;
      tick = (dt: number) => {
        echo.position.copy(phone.group.position);
        echo.rotation.copy(phone.group.rotation);
        phase.tick(dt);
        phoneProgress.clock += dt;
        if (phoneProgress.thinking > 0 && phoneProgress.reply < 1) phoneDirty = true; // the typing dots move
        applyLayers();
        sinceDraw += dt;
        if (phoneDirty && sinceDraw >= 33) {
          sinceDraw = 0;
          phoneDirty = false;
          phoneUi.render(phoneProgress);
          screenTex.needsUpdate = true;
        }
        return true;
      };
    } else {
      // reduced motion: keep the reflection in sync in case anything else ever moves the phone
      const staticTick = (): boolean => {
        echo.position.copy(phone.group.position);
        echo.rotation.copy(phone.group.rotation);
        return false;
      };
      tick = staticTick;
    }

    return {
      group,
      anchors: {},
      lights,
      camera: { fov: 24, dist: 30, target: new Vector3(0, -0.7, 0), yaw: 4, pitch: 3, designAspect: 1.6 },
      tick,
      dispose() {
        group.traverse((o) => {
          const m = o as Mesh;
          if (m.isMesh) m.geometry.dispose();
        });
        owned.forEach((x) => x.dispose());
      },
    };
  });
}
