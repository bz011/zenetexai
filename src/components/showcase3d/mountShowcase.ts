import {
  ACESFilmicToneMapping,
  PMREMGenerator,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
  type Mesh,
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

/** The approved cinematic plate: a real photo/render, used as the shared, baked environment behind every scene. */
const BACKGROUND_PLATE = "/showcase/plate-agents.webp";
const PLATE_ASPECT = 1672 / 941;

/**
 * ONE renderer for the whole showcase. Scenes are built lazily on first
 * selection, cached, and toggled by visibility; selecting a scene applies its
 * camera immediately (no transition yet). Look-dev only: the sole motion is
 * pointer parallax of about +-3 degrees - no auto-rotation, no idle loop.
 * Rendering is on demand and pauses off screen. Labels are HTML elements that
 * this only positions; the canvas is presentation and never holds content.
 */

const MAX_YAW = (3 * Math.PI) / 180;
const MAX_PITCH = (2 * Math.PI) / 180;

export interface ShowcaseHandle {
  setScene(id: ShowcaseServiceId): void;
  dispose(): void;
}

export default async function mountShowcase(
  host: HTMLElement,
  initial: ShowcaseServiceId,
  opts: { parallax: boolean; reducedMotion: boolean },
  onLost: () => void,
): Promise<ShowcaseHandle> {
  const font = await loadUiFont();

  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;pointer-events:none";
  host.prepend(canvas);

  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
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

  // The approved plate is the baked background: loaded once, shared by every
  // scene. Cover-fit (like CSS background-size: cover) is reapplied on every
  // resize so the phone never separates from its environment.
  let plateTex: Texture | null = null;
  new TextureLoader().loadAsync(BACKGROUND_PLATE).then((t) => {
    if (disposed) return t.dispose();
    t.colorSpace = SRGBColorSpace;
    plateTex = t;
    scene.background = t;
    resize();
    return t;
  }).catch(() => {
    /* keep the transparent canvas over the page background */
  });

  const kit = createShowcaseKit();
  const camera = new PerspectiveCamera(26, 1, 0.5, 200);

  const built = new Map<ShowcaseServiceId, Promise<ShowcaseScene>>();
  let current: ShowcaseScene | null = null;
  let currentId: ShowcaseServiceId | null = null;
  const cam = { yaw: 0, pitch: 0, ty: 0, tp: 0 };
  let distScale = 1;
  let w = 1;
  let h = 1;
  let raf = 0;
  let disposed = false;
  let visible = true;
  let first = true;
  const tmp = new Vector3();

  function ensure(id: ShowcaseServiceId): Promise<ShowcaseScene> | null {
    const have = built.get(id);
    if (have) return have;
    type Builder = (kit: ShowcaseKit, font: UiFont, reducedMotion: boolean) => Promise<ShowcaseScene>;
    let builder: Builder | null = null;
    if (id === "agents") builder = buildAgentsScene;
    else if (id === "data") builder = buildDataScene;
    else if (id === "ml") builder = buildMlScene;
    else if (id === "academy") builder = buildAcademyScene;
    if (!builder) return null; // other scenes are not built at this checkpoint
    const p = builder(kit, font, opts.reducedMotion).then((s) => {
      s.group.visible = false;
      scene.add(s.group);
      s.lights.forEach((l) => {
        l.visible = false;
        scene.add(l);
      });
      return s;
    });
    built.set(id, p);
    return p;
  }

  function setScene(id: ShowcaseServiceId): void {
    const pending = ensure(id);
    if (!pending || id === currentId) return;
    currentId = id;
    pending.then((next) => {
      if (disposed || currentId !== id) return; // superseded or unmounted while loading
      if (current) {
        current.group.visible = false;
        current.lights.forEach((l) => (l.visible = false));
      }
      current = next;
      next.group.visible = true;
      next.lights.forEach((l) => (l.visible = true));
      camera.fov = next.camera.fov;
      distScale = Math.max(1, next.camera.designAspect / camera.aspect);
      camera.updateProjectionMatrix();
      schedule();
    });
  }

  function place() {
    if (!current) return;
    const c = current.camera;
    const yaw = ((c.yaw * Math.PI) / 180) + cam.yaw;
    const pitch = ((c.pitch * Math.PI) / 180) + cam.pitch;
    const d = c.dist * distScale;
    camera.position.set(
      c.target.x - Math.sin(yaw) * d * Math.cos(pitch),
      c.target.y + Math.sin(pitch) * d,
      c.target.z + Math.cos(yaw) * d * Math.cos(pitch),
    );
    camera.lookAt(c.target);
    camera.updateMatrixWorld();
  }

  const labels = [...host.querySelectorAll<HTMLElement>("[data-anchor]")];
  function projectLabels() {
    if (!current) return;
    for (const el of labels) {
      const a = current.anchors[el.dataset.anchor ?? ""];
      if (!a) continue;
      tmp.copy(a).project(camera);
      el.style.transform = `translate3d(${((tmp.x + 1) / 2) * w}px, ${((1 - tmp.y) / 2) * h}px, 0)`;
      el.style.opacity = "1";
    }
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
    cam.yaw += (cam.ty - cam.yaw) * 0.08;
    cam.pitch += (cam.tp - cam.pitch) * 0.08;
    place();
    const stillAnimating = current.tick?.(dt) ?? false;
    renderer.render(scene, camera);
    projectLabels();
    host.dataset.calls = String(renderer.info.render.calls);
    host.dataset.tris = String(renderer.info.render.triangles);
    host.dataset.textures = String(renderer.info.memory.textures);
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
    if (stillAnimating || Math.abs(cam.ty - cam.yaw) > 0.0004 || Math.abs(cam.tp - cam.pitch) > 0.0004) schedule();
  }
  function schedule() {
    if (!raf && visible && !disposed) raf = requestAnimationFrame(frame);
  }

  function resize() {
    const r = host.getBoundingClientRect();
    w = Math.max(1, r.width);
    h = Math.max(1, r.height);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    distScale = current ? Math.max(1, current.camera.designAspect / camera.aspect) : 1; // narrower host: step back so nothing crops
    camera.updateProjectionMatrix();
    if (plateTex) coverFit(plateTex, w / h, PLATE_ASPECT);
    schedule();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();

  const onMove = (e: PointerEvent) => {
    if (!opts.parallax) return;
    cam.ty = ((e.clientX / window.innerWidth) * 2 - 1) * MAX_YAW;
    cam.tp = ((e.clientY / window.innerHeight) * 2 - 1) * MAX_PITCH;
    schedule();
  };
  window.addEventListener("pointermove", onMove, { passive: true });

  const io = new IntersectionObserver((entries) => {
    visible = entries.some((e) => e.isIntersecting);
    if (visible) schedule();
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
      canvas.removeEventListener("webglcontextlost", onContextLost);
      built.forEach((p) => p.then((s) => s.dispose()).catch(() => {}));
      plateTex?.dispose();
      kit.dispose();
      envRT.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
      delete host.dataset.showcase;
    },
  };
}
