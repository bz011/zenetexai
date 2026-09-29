import {
  ACESFilmicToneMapping,
  Mesh,
  MeshBasicMaterial,
  OrthographicCamera,
  PMREMGenerator,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
  type Texture,
} from "three";
import { TextureLoader } from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { coverFit, createShowcaseKit, type ShowcaseKit } from "./kit";
import { buildAcademyScene } from "./scenes/academy";
import { buildAgentsScene } from "./scenes/agents";
import { buildDataScene } from "./scenes/data";
import { buildMlScene } from "./scenes/ml";
import type { ShowcaseScene } from "./scenes/types";
import type { ShowcaseServiceId } from "./showcaseParam";
import { loadUiFont, type UiFont } from "./uiFont";
import type { Lang, Translations } from "@/lib/translations";

/** The approved cinematic plate: a real photo/render, used as the shared, baked environment behind every scene. */
const BACKGROUND_PLATE = "/showcase/plate-agents.webp";
const PLATE_ASPECT = 1672 / 941;

/**
 * ONE renderer for the whole showcase. Scenes are built lazily on first
 * selection, cached, and toggled by visibility. Rendering is on demand and
 * pauses off screen. The canvas is presentation and never holds content.
 *
 * Switching services is a short dissolve, not a cut: the outgoing scene dissolves
 * into the baked plate behind it (a screen-space overlay that re-draws the plate
 * over the scene with rising opacity, so it is pixel-identical to the
 * background and can never flash) while the camera eases back a little; the next
 * scene resolves the same way in reverse.
 *
 * Desktop pointer response is a small, damped camera orbit (no card ever chases
 * the cursor), neutral when the pointer is outside the stage. On portrait
 * screens the desktop composition is far too wide to show at readable size, so
 * the camera eases between a few close framings of the same scene ("shots"), in
 * step with the scene's own story clock.
 */

const MAX_YAW = (4.5 * Math.PI) / 180;
const MAX_PITCH = (2.4 * Math.PI) / 180;
/** how quickly the pointer response settles (ms time constant) */
const POINTER_TAU = 150;
/** dissolve out / in, ms: short, so a switch always feels immediate */
const OUT_MS = 260;
const IN_MS = 420;
/** the camera eases back by this fraction of its distance at full dissolve */
const DOLLY = 0.05;
/** below this host aspect (w/h) the portrait framing is used */
const TALL_ASPECT = 0.85;
const PORTRAIT_DESIGN_ASPECT = 0.62;

export interface ShowcaseHandle {
  setScene(id: ShowcaseServiceId): void;
  dispose(): void;
}

export interface MountOptions {
  /** desktop pointer response (fine pointer, motion allowed) */
  parallax: boolean;
  reducedMotion: boolean;
  /** touch swipe between services (horizontal swipes only; vertical scrolling is untouched) */
  onSwipe?: (dir: 1 | -1) => void;
  /** current site language - decides the canvas font family/direction and which copy each scene draws */
  lang: Lang;
  copy: Translations["showcase"];
}

const smoothstep = (t: number): number => {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
};

export default async function mountShowcase(
  host: HTMLElement,
  initial: ShowcaseServiceId,
  opts: MountOptions,
  onLost: () => void,
): Promise<ShowcaseHandle> {
  const font = await loadUiFont(opts.lang);
  const coarse = window.matchMedia("(pointer: coarse)").matches;

  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;pointer-events:none";
  host.prepend(canvas);

  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, stencil: true, powerPreference: "high-performance" });
  renderer.autoClear = false; // cleared by hand each frame: the dissolve overlay is drawn after the scene
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
  scene.environment = envRT.texture;
  scene.environmentIntensity = 0.85;
  pmrem.dispose();

  // The plate is the baked background, and also the dissolve overlay (same
  // texture, same cover-fit, drawn last with opacity), so a dissolved scene is
  // exactly the empty plate.
  let plateTex: Texture | null = null;
  const overlayScene = new Scene();
  const overlayCam = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const overlayGeo = new PlaneGeometry(2, 2);
  let overlayMat: MeshBasicMaterial | null = null;
  new TextureLoader().loadAsync(BACKGROUND_PLATE).then((t) => {
    if (disposed) return t.dispose();
    t.colorSpace = SRGBColorSpace;
    plateTex = t;
    scene.background = t;
    overlayMat = new MeshBasicMaterial({ map: t, transparent: true, opacity: 0, depthTest: false, depthWrite: false, toneMapped: false });
    const quad = new Mesh(overlayGeo, overlayMat);
    quad.frustumCulled = false;
    overlayScene.add(quad);
    resize();
    return t;
  }).catch(() => {
    /* keep the transparent canvas over the page background; switches then simply cut */
  });

  const kit = createShowcaseKit();
  const camera = new PerspectiveCamera(26, 1, 0.5, 200);

  const built = new Map<ShowcaseServiceId, Promise<ShowcaseScene>>();
  // Every scene that has FINISHED building, independent of whether it is still the one wanted: a click can be
  // superseded by another before its build resolves, so "the last promise to resolve" is not reliably "the last one
  // requested" - looking the target up here each frame, instead of trusting a single stashed "ready" scene, is what
  // keeps rapid switching (a user clicking through several tabs before the first switch finishes) from stranding the
  // showcase mid-dissolve with nothing left to swap in.
  const settled = new Map<ShowcaseServiceId, ShowcaseScene>();
  let current: ShowcaseScene | null = null;
  let currentId: ShowcaseServiceId | null = null;
  let wantedId: ShowcaseServiceId | null = null;
  /** 0 = scene fully shown, 1 = fully dissolved into the plate */
  let fade = 0;
  const cam = { yaw: 0, pitch: 0, ty: 0, tp: 0 };
  let w = 1;
  let h = 1;
  let raf = 0;
  let disposed = false;
  let visible = true;
  let first = true;
  const lookAt = new Vector3();

  function ensure(id: ShowcaseServiceId): Promise<ShowcaseScene> | null {
    const have = built.get(id);
    if (have) return have;
    type Builder = (kit: ShowcaseKit, font: UiFont, reducedMotion: boolean, copy: Translations["showcase"]) => Promise<ShowcaseScene>;
    let builder: Builder | null = null;
    if (id === "agents") builder = buildAgentsScene;
    else if (id === "data") builder = buildDataScene;
    else if (id === "ml") builder = buildMlScene;
    else if (id === "academy") builder = buildAcademyScene;
    if (!builder) return null;
    const p = builder(kit, font, opts.reducedMotion, opts.copy).then((s) => {
      s.group.visible = false;
      scene.add(s.group);
      s.lights.forEach((l) => {
        l.visible = false;
        scene.add(l);
      });
      settled.set(id, s);
      return s;
    });
    built.set(id, p);
    return p;
  }

  function applyScene(next: ShowcaseScene, id: ShowcaseServiceId): void {
    if (current) {
      current.group.visible = false;
      current.lights.forEach((l) => (l.visible = false));
    }
    current = next;
    currentId = id;
    next.group.visible = true;
    next.lights.forEach((l) => (l.visible = true));
    camera.fov = next.camera.fov;
    camera.updateProjectionMatrix();
    scene.environmentIntensity = next.environmentIntensity ?? 0.85;
  }

  function setScene(id: ShowcaseServiceId): void {
    const pending = ensure(id);
    if (!pending || id === wantedId) return;
    wantedId = id;
    if (!current) {
      pending.then((next) => {
        if (disposed || current) return; // unmounted, or a later call already became the first scene
        applyScene(next, id); // the very first scene: nothing to dissolve
        fade = 0;
        schedule();
      });
    }
    schedule();
  }

  function place() {
    if (!current) return;
    const c = current.camera;
    const p = current.portrait;
    const tall = p && camera.aspect < TALL_ASPECT;
    const tx = tall ? p.target.x : c.target.x;
    const ty0 = tall ? p.target.y : c.target.y;
    const tz = tall ? p.target.z : c.target.z;
    const dist = tall ? p.dist : c.dist;
    const designAspect = tall ? PORTRAIT_DESIGN_ASPECT : c.designAspect;
    const yawDeg = tall ? p.yaw ?? c.yaw : c.yaw;
    const pitchDeg = tall ? p.pitch ?? c.pitch : c.pitch;
    const e = smoothstep(fade);
    const ty = ty0 + 0.3 * e; // the dissolving scene settles very slightly
    const yaw = (yawDeg * Math.PI) / 180 + cam.yaw;
    const pitch = (pitchDeg * Math.PI) / 180 + cam.pitch;
    // narrower hosts step back so nothing crops; the transition eases the camera back a touch
    const d = dist * Math.max(1, designAspect / camera.aspect) * (1 + DOLLY * e);
    camera.position.set(tx - Math.sin(yaw) * d * Math.cos(pitch), ty + Math.sin(pitch) * d, tz + Math.cos(yaw) * d * Math.cos(pitch));
    lookAt.set(tx, ty, tz);
    camera.lookAt(lookAt);
    camera.updateMatrixWorld();
  }

  let lastFrameTime = 0;
  function frame(now: number) {
    raf = 0;
    if (disposed || !current) return;
    // Capped so a tab coming back from background/offscreen doesn't replay a
    // huge chunk of animation in one jump; the timeline just resumes from
    // roughly where it left off instead.
    const dt = lastFrameTime ? Math.min(50, now - lastFrameTime) : 16.7;
    lastFrameTime = now;

    // pointer response: damped by frame time, so it feels the same at any frame rate
    const k = 1 - Math.exp(-dt / POINTER_TAU);
    cam.yaw += (cam.ty - cam.yaw) * k;
    cam.pitch += (cam.tp - cam.pitch) * k;

    // service switch: dissolve out, swap once the next scene is ready, dissolve in
    let switching = false;
    if (wantedId !== currentId) {
      switching = true;
      fade = Math.min(1, fade + dt / OUT_MS);
      const ready = wantedId ? settled.get(wantedId) : undefined;
      if (fade >= 1 && ready) {
        applyScene(ready, wantedId as ShowcaseServiceId);
      }
    } else if (fade > 0) {
      fade = Math.max(0, fade - dt / IN_MS);
    }

    place();
    const stillAnimating = current.tick?.(dt) ?? false;
    renderer.clear();
    renderer.render(scene, camera);
    if (overlayMat && fade > 0.001) {
      overlayMat.opacity = smoothstep(fade);
      renderer.render(overlayScene, overlayCam);
    }
    host.dataset.calls = String(renderer.info.render.calls);
    host.dataset.tris = String(renderer.info.render.triangles);
    host.dataset.textures = String(renderer.info.memory.textures);
    host.dataset.geometries = String(renderer.info.memory.geometries);
    if (first) {
      first = false;
      let meshes = 0;
      let tris = 0;
      scene.traverse((o) => {
        const m = o as Mesh;
        if (!m.isMesh || !m.visible) return;
        meshes++;
        const g = m.geometry;
        tris += (g.index ? g.index.count : g.attributes.position.count) / 3;
      });
      host.dataset.meshes = String(meshes);
      host.dataset.sceneTris = String(Math.round(tris));
      host.dataset.showcase = currentId ?? "";
    }
    host.dataset.scene = currentId ?? "";
    if (stillAnimating || switching || fade > 0 || Math.abs(cam.ty - cam.yaw) > 0.0004 || Math.abs(cam.tp - cam.pitch) > 0.0004) schedule();
  }
  function schedule() {
    if (!raf && visible && !disposed) raf = requestAnimationFrame(frame);
  }

  /**
   * Pixel ratio: capped, and reduced further when the canvas is large, so a
   * Retina desktop or a phone never renders more pixels per frame than the
   * (mostly transparent, blended) scene is worth.
   */
  function pixelRatio(): number {
    const dpr = window.devicePixelRatio || 1;
    const cap = coarse ? 1.5 : 2;
    const budget = coarse ? 2.2e6 : 3.4e6; // device pixels per frame
    return Math.max(0.75, Math.min(dpr, cap, Math.sqrt(budget / (w * h))));
  }

  function resize() {
    const r = host.getBoundingClientRect();
    w = Math.max(1, r.width);
    h = Math.max(1, r.height);
    renderer.setPixelRatio(pixelRatio());
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    if (plateTex) coverFit(plateTex, w / h, PLATE_ASPECT);
    host.dataset.dpr = renderer.getPixelRatio().toFixed(2);
    schedule();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();

  // Pointer response: a small orbit of the whole showcase, relative to the stage, neutral outside it.
  const neutral = () => {
    cam.ty = 0;
    cam.tp = 0;
    schedule();
  };
  const onMove = (e: PointerEvent) => {
    if (!opts.parallax || e.pointerType === "touch") return;
    const r = host.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / Math.max(1, r.width)) * 2 - 1;
    const ny = ((e.clientY - r.top) / Math.max(1, r.height)) * 2 - 1;
    if (Math.abs(nx) > 1 || Math.abs(ny) > 1) return neutral();
    cam.ty = nx * MAX_YAW;
    cam.tp = ny * MAX_PITCH;
    schedule();
  };
  if (opts.parallax) {
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("mouseleave", neutral);
    window.addEventListener("blur", neutral);
  }

  // Touch swipe between services: horizontal, quick and clearly more sideways than down - the page keeps its vertical scroll.
  const swipeEl = host.parentElement ?? host;
  let swipeId = -1;
  let sx = 0;
  let sy = 0;
  let st = 0;
  const onDown = (e: PointerEvent) => {
    if (e.pointerType !== "touch") return;
    swipeId = e.pointerId;
    sx = e.clientX;
    sy = e.clientY;
    st = performance.now();
  };
  const onUp = (e: PointerEvent) => {
    if (e.pointerId !== swipeId) return;
    swipeId = -1;
    const dx = e.clientX - sx;
    const dy = e.clientY - sy;
    if (Math.abs(dx) > 60 && Math.abs(dx) > 1.7 * Math.abs(dy) && performance.now() - st < 800) opts.onSwipe?.(dx < 0 ? 1 : -1);
  };
  const onCancel = () => {
    swipeId = -1;
  };
  if (opts.onSwipe) {
    swipeEl.addEventListener("pointerdown", onDown, { passive: true });
    swipeEl.addEventListener("pointerup", onUp, { passive: true });
    swipeEl.addEventListener("pointercancel", onCancel, { passive: true });
  }

  const io = new IntersectionObserver((entries) => {
    visible = entries.some((e) => e.isIntersecting);
    if (visible) {
      lastFrameTime = 0; // do not count the time spent off screen
      schedule();
    }
  });
  io.observe(host);

  const onContextLost = (e: Event) => {
    e.preventDefault();
    onLost();
  };
  canvas.addEventListener("webglcontextlost", onContextLost);

  setScene(initial);

  return {
    setScene,
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("mouseleave", neutral);
      window.removeEventListener("blur", neutral);
      swipeEl.removeEventListener("pointerdown", onDown);
      swipeEl.removeEventListener("pointerup", onUp);
      swipeEl.removeEventListener("pointercancel", onCancel);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      built.forEach((p) => p.then((s) => s.dispose()).catch(() => {}));
      plateTex?.dispose();
      overlayMat?.dispose();
      overlayGeo.dispose();
      kit.dispose();
      envRT.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
      delete host.dataset.showcase;
    },
  };
}
