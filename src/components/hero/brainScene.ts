import {
  AdditiveBlending, BufferAttribute, BufferGeometry, CanvasTexture, CircleGeometry, Color, DoubleSide, Group,
  LineBasicMaterial, LineSegments, Mesh, MeshBasicMaterial, PerspectiveCamera, Points, PointsMaterial,
  RingGeometry, Scene, Sprite, SpriteMaterial, WebGLRenderer,
} from "three";
import { buildBrainNetwork } from "@/lib/brainShape";

/**
 * The 3D hero scene. Loaded on demand (dynamic import) only for desktop-sized
 * screens with WebGL and no reduced-motion preference, so it is never part of
 * the initial page load. Renders only while on screen and the tab is visible,
 * at a capped pixel ratio and frame rate, and releases every GPU resource on
 * dispose().
 */

export interface BrainSceneHandle {
  dispose(): void;
  setPointer(x: number, y: number): void;
}

const MAX_FPS = 45;
const BASE_YAW = -1.15;

function glowTexture(): CanvasTexture {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.25, "rgba(255,255,255,0.55)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new CanvasTexture(canvas);
}

export async function mountBrainScene(host: HTMLElement, onFail: () => void): Promise<BrainSceneHandle> {
  const renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: "default" });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  const canvas = renderer.domElement;
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;";
  host.appendChild(canvas);

  const scene = new Scene();
  const camera = new PerspectiveCamera(35, 1, 0.1, 50);
  camera.position.set(0, 0.6, 5.4);
  camera.lookAt(0, -0.3, 0);

  const disposables: { dispose(): void }[] = [];
  const track = <T extends { dispose(): void }>(o: T): T => (disposables.push(o), o);

  const network = buildBrainNetwork(900, 7, 3);
  const count = network.positions.length / 3;
  const top = new Color(0x93e5ff), mid = new Color(0x3b82f6), low = new Color(0x6366f1);
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const h = network.heights[i];
    const c = h > 0.5 ? mid.clone().lerp(top, (h - 0.5) * 2) : low.clone().lerp(mid, h * 2);
    colors.set([c.r, c.g, c.b], i * 3);
  }

  const brain = new Group();
  scene.add(brain);

  const pointGeo = track(new BufferGeometry());
  pointGeo.setAttribute("position", new BufferAttribute(network.positions, 3));
  pointGeo.setAttribute("color", new BufferAttribute(colors, 3));
  const sprite = track(glowTexture());
  const pointMat = track(new PointsMaterial({ size: 0.085, map: sprite, vertexColors: true, transparent: true, depthWrite: false, blending: AdditiveBlending, opacity: 0.95 }));
  brain.add(new Points(pointGeo, pointMat));

  const linePositions = new Float32Array(network.edges.length * 3);
  const lineColors = new Float32Array(network.edges.length * 3);
  for (let e = 0; e < network.edges.length; e++) {
    const n = network.edges[e];
    linePositions.set([network.positions[n * 3], network.positions[n * 3 + 1], network.positions[n * 3 + 2]], e * 3);
    lineColors.set([colors[n * 3], colors[n * 3 + 1], colors[n * 3 + 2]], e * 3);
  }
  const lineGeo = track(new BufferGeometry());
  lineGeo.setAttribute("position", new BufferAttribute(linePositions, 3));
  lineGeo.setAttribute("color", new BufferAttribute(lineColors, 3));
  const lineMat = track(new LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.42, depthWrite: false, blending: AdditiveBlending }));
  brain.add(new LineSegments(lineGeo, lineMat));

  // Soft halo behind the brain.
  const haloMat = track(new SpriteMaterial({ map: sprite, color: 0x2563eb, transparent: true, opacity: 0.32, depthWrite: false, blending: AdditiveBlending }));
  const halo = new Sprite(haloMat);
  halo.scale.set(4.6, 4.6, 1);
  halo.position.set(0, 0, -0.6);
  scene.add(halo);

  // Pedestal rings and a soft floor glow.
  const rings: Mesh[] = [];
  [[0.95, 0.975, 0.6], [1.22, 1.24, 0.36], [1.5, 1.515, 0.2]].forEach(([inner, outer, opacity]) => {
    const geo = track(new RingGeometry(inner, outer, 96));
    const mat = track(new MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity, side: DoubleSide, depthWrite: false, blending: AdditiveBlending }));
    const ring = new Mesh(geo, mat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -1.15;
    scene.add(ring);
    rings.push(ring);
  });
  const floorGeo = track(new CircleGeometry(1.5, 48));
  const floorMat = track(new MeshBasicMaterial({ map: sprite, color: 0x1d4ed8, transparent: true, opacity: 0.45, depthWrite: false, blending: AdditiveBlending }));
  const floor = new Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.16;
  scene.add(floor);

  let width = 0, height = 0;
  const resize = () => {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h || (w === width && h === height)) return;
    width = w; height = h;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  resize();

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  let raf = 0, running = false, onScreen = true, last = 0, elapsed = 0, frames = 0;

  const tick = (now: number) => {
    raf = requestAnimationFrame(tick);
    const dt = now - last;
    if (dt < 1000 / MAX_FPS) return;
    last = now;
    elapsed += Math.min(dt, 100) / 1000;

    pointer.x += (pointer.tx - pointer.x) * 0.06;
    pointer.y += (pointer.ty - pointer.y) * 0.06;

    // Lateral three-quarter view (front of the brain toward the left), gently swaying.
    brain.rotation.y = BASE_YAW + Math.sin(elapsed * 0.22) * 0.35 + pointer.x * 0.3;
    brain.rotation.x = pointer.y * 0.14 + Math.sin(elapsed * 0.31) * 0.03;
    brain.position.y = Math.sin(elapsed * 0.7) * 0.035;
    pointMat.size = 0.085 + 0.007 * Math.sin(elapsed * 1.4);
    halo.material.opacity = 0.3 + 0.03 * Math.sin(elapsed * 0.9);
    rings.forEach((ring, i) => (ring.rotation.z = elapsed * (0.05 + i * 0.03) * (i % 2 ? -1 : 1)));

    renderer.render(scene, camera);
    frames++;
    if (frames === 2) host.dataset.brain3d = "ready";
    if (frames % 20 === 0) {
      host.dataset.frames = String(frames);
      host.dataset.pointer = `${pointer.x.toFixed(2)},${pointer.y.toFixed(2)}`;
    }
  };

  const sync = () => {
    const shouldRun = onScreen && !document.hidden;
    if (shouldRun && !running) {
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    } else if (!shouldRun && running) {
      running = false;
      cancelAnimationFrame(raf);
    }
  };
  const io = new IntersectionObserver((entries) => {
    onScreen = entries[entries.length - 1].isIntersecting;
    sync();
  });
  io.observe(host);
  document.addEventListener("visibilitychange", sync);

  const onLost = (e: Event) => {
    e.preventDefault();
    onFail();
  };
  canvas.addEventListener("webglcontextlost", onLost);
  sync();

  return {
    setPointer(x, y) {
      pointer.tx = x;
      pointer.ty = y;
    },
    dispose() {
      running = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", sync);
      canvas.removeEventListener("webglcontextlost", onLost);
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
      delete host.dataset.brain3d;
      delete host.dataset.frames;
      delete host.dataset.pointer;
    },
  };
}
