import { AdditiveBlending, CatmullRomCurve3, Color, Mesh, MeshBasicMaterial, Sprite, SpriteMaterial, Vector3, type Texture } from "three";
import { lightPoolTexture, type ShowcaseKit } from "./kit";
import { roundedPlane } from "./shapes";

/**
 * A minimal, self-contained sequencer for the AI Agents storytelling pass.
 * Everything here runs inside the existing three.js render loop (mountShowcase
 * calls `tick(dtMs)` once per frame; nothing here touches React state), so no
 * extra re-renders are introduced. A cue is only ever evaluated while the
 * timeline's own clock is inside its [start, start+duration) window, and the
 * clock itself only advances by the `dt` it is given - if the scene stops
 * receiving frames (offscreen, tab hidden), the clock simply stops with it.
 */

export type Ease = (t: number) => number;
export const easeOutCubic: Ease = (t) => 1 - Math.pow(1 - t, 3);
export const easeInOutCubic: Ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOutBack: Ease = (t) => 1 + 2.2 * Math.pow(t - 1, 3) + 1.4 * Math.pow(t - 1, 2);

interface Cue {
  start: number;
  duration: number;
  update: (p: number) => void;
  onStart?: () => void;
  onEnd?: () => void;
  fired?: boolean;
  ended?: boolean;
}

export class Timeline {
  private cues: Cue[] = [];
  private clock = 0;
  private onDone: (() => void) | null = null;
  private done = false;

  /** `duration` in ms. `update(p)` receives eased progress 0..1. */
  add(start: number, duration: number, update: (p: number) => void, ease: Ease = easeOutCubic, onStart?: () => void, onEnd?: () => void): this {
    this.cues.push({ start, duration: Math.max(1, duration), update: (raw) => update(ease(raw)), onStart, onEnd });
    return this;
  }

  /** Fires once, at `at` ms, with no interpolation. */
  at(at: number, fn: () => void): this {
    this.cues.push({ start: at, duration: 1, update: () => {}, onStart: fn });
    return this;
  }

  whenDone(fn: () => void): this {
    this.onDone = fn;
    return this;
  }

  /** Advances the clock by dtMs. Returns true while any cue is still pending or active. */
  tick(dtMs: number): boolean {
    this.clock += dtMs;
    let pending = false;
    for (const c of this.cues) {
      if (c.ended) continue;
      const rel = this.clock - c.start;
      if (rel < 0) {
        pending = true;
        continue;
      }
      if (!c.fired) {
        c.fired = true;
        c.onStart?.();
      }
      const p = Math.min(1, rel / c.duration);
      c.update(p);
      if (p >= 1) {
        c.ended = true;
        c.onEnd?.();
      } else {
        pending = true;
      }
    }
    if (!pending && !this.done) {
      this.done = true;
      this.onDone?.();
    }
    return pending;
  }

  elapsed(): number {
    return this.clock;
  }
}

type Own = <T extends { dispose(): void }>(x: T) => T;

/**
 * One neutral white radial-gradient texture, shared by every glow and pulse in
 * the scene: colour comes from each material's own `color` (which multiplies
 * the map), so a single texture and a single GPU upload serves all of them
 * instead of one canvas+texture per instance.
 */
const sharedGlowTex = new WeakMap<ShowcaseKit, Texture>();
function glowTexture(kit: ShowcaseKit): Texture {
  let tex = sharedGlowTex.get(kit);
  if (!tex) {
    tex = kit.track(lightPoolTexture([255, 255, 255], 1));
    sharedGlowTex.set(kit, tex);
  }
  return tex;
}

/**
 * A reusable additive glow, shared by every "activation" effect in this scene
 * (card illumination, checkmark acknowledgement, orb presence): one small
 * textured plane whose opacity is driven by a Timeline cue. Built once per
 * element and left in the scene at opacity 0 until played. `own` registers the
 * geometry/material this creates with the caller's per-scene disposal list.
 */
export function buildGlow(kit: ShowcaseKit, own: Own, size: number, rgb: [number, number, number]): Mesh {
  const mat = own(
    new MeshBasicMaterial({
      map: glowTexture(kit),
      color: new Color(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255),
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: AdditiveBlending,
      toneMapped: false,
    }),
  );
  const mesh = new Mesh(own(roundedPlane(size, size, size / 2)), mat);
  mesh.renderOrder = 5;
  // Flagged so a parent's generic "collect my body meshes" traversal (e.g. the
  // phone's intro fade-in) can skip glows - they manage their own opacity and
  // must never be swept into a whole-object fade.
  mesh.userData.isGlow = true;
  return mesh;
}

/**
 * A small luminous dot that rides a static trail's exact path (the same
 * Catmull-Rom curve `tapeGeometry` builds from the same points), so "a pulse
 * travels along the trail" without moving or re-colouring the trail itself.
 */
export interface TrailPulse {
  sprite: Sprite;
  /** progress 0..1 -> position on the curve + a fade-in/out envelope */
  setProgress(p: number): void;
}

export function createTrailPulse(kit: ShowcaseKit, own: Own, points: Vector3[], rgb: [number, number, number], size = 0.55): TrailPulse {
  const curve = new CatmullRomCurve3(points, false, "centripetal", 0.5);
  const material = own(
    new SpriteMaterial({
      map: glowTexture(kit),
      color: new Color(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255),
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: AdditiveBlending,
      toneMapped: false,
    }),
  );
  const sprite = new Sprite(material);
  own({ dispose: () => sprite.geometry.dispose() });
  sprite.scale.setScalar(size);
  sprite.renderOrder = 6;
  const tmp = new Vector3();
  return {
    sprite,
    setProgress(p: number) {
      const cp = Math.min(0.999, Math.max(0, p));
      curve.getPointAt(cp, tmp);
      sprite.position.copy(tmp);
      // fade in over the first 12% and out over the last 20% of travel
      const fadeIn = Math.min(1, p / 0.12);
      const fadeOut = p > 0.8 ? Math.max(0, 1 - (p - 0.8) / 0.2) : 1;
      material.opacity = Math.min(fadeIn, fadeOut);
    },
  };
}
