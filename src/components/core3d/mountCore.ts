import {
  ACESFilmicToneMapping,
  DirectionalLight,
  Group,
  Mesh,
  PCFShadowMap,
  PMREMGenerator,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import type { CoreVariant, CoreView } from "./coreParam";
import { createKit } from "./materials";
import { buildAperturePlate } from "./variants/apertureStack";
import { buildModularCore } from "./variants/modularCore";
import { buildPrecisionStack } from "./variants/precisionStack";
import type { CoreBuild } from "./variants/types";

/**
 * Look-dev mount for the Intelligence Core. One scene, three product-design
 * treatments (see variants/). Deliberately NO choreography: the only motion is
 * pointer parallax (a wide, damped camera orbit) so depth can be judged.
 * Rendering is on demand - a frame is drawn only while the camera is moving.
 *
 * Text is never drawn in WebGL: the labels are HTML elements the mount only
 * positions by projecting scene anchors to screen coordinates.
 */

const FOV = 24;
const MAX_YAW = 0.34; // ~19 degrees each way
const MAX_PITCH = 0.1;

export interface CoreHandle {
  dispose: () => void;
}

const BUILDERS = { A: buildPrecisionStack, B: buildAperturePlate, C: buildModularCore } as const;

export default function mountCore(
  host: HTMLElement,
  variant: CoreVariant,
  view: CoreView,
  opts: { parallax: boolean },
  onLost: () => void,
): CoreHandle {
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
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;

  const scene = new Scene();

  // Studio lighting from a procedurally generated room: no HDR file, no request.
  const pmrem = new PMREMGenerator(renderer);
  const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
  scene.environment = envRT.texture;
  scene.environmentIntensity = 1.0;
  pmrem.dispose();

  const kit = createKit();
  const build: CoreBuild = BUILDERS[variant](kit);
  const root = new Group();
  root.add(build.group);
  scene.add(root);
  build.lights.forEach((l) => scene.add(l));

  // Key light casts the soft shadows that separate the stages; a cool rim from
  // behind defines the silhouette against the dark page.
  const key = new DirectionalLight(0xe6eeff, 3.4);
  key.position.set(-9, 12, 10);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -10;
  key.shadow.camera.right = 10;
  key.shadow.camera.top = 8;
  key.shadow.camera.bottom = -8;
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 40;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.02;
  key.shadow.radius = 4;
  scene.add(key);
  const rim = new DirectionalLight(0x6ea8ff, 3.0);
  rim.position.set(9, 5, -10);
  scene.add(rim);

  const camera = new PerspectiveCamera(FOV, 1, 1, 200);
  const dist = view === "detail" ? build.frame.dist * 0.55 : build.frame.dist;
  const target = build.frame.target.clone();
  if (view === "detail") target.set(-0.5, 0, 0.6);
  const yaw0 = (build.frame.yaw * Math.PI) / 180;
  const pitch0 = (build.frame.pitch * Math.PI) / 180;
  const cam = { yaw: 0, pitch: 0, ty: 0, tp: 0 };
  // The scene is composed for a ~0.93 (w/h) host. On wider hosts the camera moves
  // in so the object keeps its presence instead of shrinking into the canvas.
  let distScale = 1;

  const labels = [...host.querySelectorAll<HTMLElement>("[data-anchor]")];
  const tmp = new Vector3();

  function place() {
    const yaw = yaw0 + cam.yaw;
    const pitch = pitch0 + cam.pitch;
    const d = dist * distScale;
    camera.position.set(
      target.x - Math.sin(yaw) * d * Math.cos(pitch),
      target.y + Math.sin(pitch) * d,
      target.z + Math.cos(yaw) * d * Math.cos(pitch),
    );
    camera.lookAt(target);
    camera.updateMatrixWorld();
  }

  let raf = 0;
  let disposed = false;
  let visible = true;
  let first = true;
  let w = 1;
  let h = 1;

  function projectLabels() {
    if (view === "detail") return; // labels are for the full composition only
    for (const el of labels) {
      const a = build.anchors[el.dataset.anchor ?? ""];
      if (!a) continue;
      tmp.copy(a).project(camera);
      el.style.transform = `translate3d(${((tmp.x + 1) / 2) * w}px, ${((1 - tmp.y) / 2) * h}px, 0)`;
      el.style.opacity = "1";
    }
  }

  function stats() {
    let meshes = 0;
    let tris = 0;
    scene.traverse((o) => {
      const m = o as Mesh;
      if (!m.isMesh) return;
      meshes++;
      const g = m.geometry;
      tris += (g.index ? g.index.count : g.attributes.position.count) / 3;
    });
    host.dataset.meshes = String(meshes);
    host.dataset.sceneTris = String(Math.round(tris));
    host.dataset.lights = String(build.lights.length + 2);
  }

  function frame() {
    raf = 0;
    if (disposed) return;
    cam.yaw += (cam.ty - cam.yaw) * 0.09;
    cam.pitch += (cam.tp - cam.pitch) * 0.09;
    place();
    renderer.render(scene, camera);
    projectLabels();
    host.dataset.calls = String(renderer.info.render.calls);
    host.dataset.tris = String(renderer.info.render.triangles);
    if (first) {
      first = false;
      stats();
      host.dataset.core = variant;
    }
    if (Math.abs(cam.ty - cam.yaw) > 0.0005 || Math.abs(cam.tp - cam.pitch) > 0.0005) schedule();
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
    distScale = Math.min(1, Math.max(0.87, 0.93 / camera.aspect));
    camera.updateProjectionMatrix();
    schedule();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();

  const onMove = (e: PointerEvent) => {
    if (!opts.parallax) return;
    const nx = (e.clientX / window.innerWidth) * 2 - 1;
    const ny = (e.clientY / window.innerHeight) * 2 - 1;
    cam.ty = nx * MAX_YAW;
    cam.tp = ny * MAX_PITCH;
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

  place();
  schedule();

  return {
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      scene.traverse((o) => {
        const m = o as Mesh;
        if (m.isMesh) m.geometry.dispose();
      });
      kit.dispose();
      envRT.dispose();
      key.shadow.map?.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
      delete host.dataset.core;
    },
  };
}
