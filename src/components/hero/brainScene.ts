import {
  AdditiveBlending, AmbientLight, BackSide, BufferAttribute, BufferGeometry, CanvasTexture, CircleGeometry, Color,
  CylinderGeometry, DirectionalLight, DoubleSide, FrontSide, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial,
  PerspectiveCamera, PointLight, Points, RingGeometry, Scene, ShaderMaterial, Sprite, SpriteMaterial, TorusGeometry, WebGLRenderer,
} from "three";
import { buildBrainMesh, type BrainPart } from "@/lib/brainMesh";

/**
 * The 3D hero scene: a procedurally generated, holographic-style cortex on a
 * lit pedestal. Loaded on demand (dynamic import) only for desktop-sized
 * screens with WebGL and no reduced-motion preference, so it is never part of
 * the initial page load. Renders only while on screen and the tab is visible,
 * at a capped pixel ratio and frame rate, and releases every GPU resource on
 * dispose().
 */

export interface BrainSceneHandle {
  dispose(): void;
  setPointer(x: number, y: number): void;
}

const MAX_FPS = 60;
const FALLBACK_FPS = 30;
const BASE_YAW = -1.38; // lateral three-quarter view, front of the brain toward the left
const PEDESTAL_Y = -1.3;

const VERTEX = /* glsl */ `
  attribute float aFold;
  varying vec3 vN;
  varying vec3 vV;
  varying float vFold;
  varying float vY;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal);
    vV = -mv.xyz;
    vFold = aFold;
    vY = position.y;
    gl_Position = projectionMatrix * mv;
  }
`;

const FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uBack;
  varying vec3 vN;
  varying vec3 vV;
  varying float vFold;
  varying float vY;
  void main() {
    vec3 N = normalize(vN);
    vec3 V = normalize(vV);
    if (uBack > 0.5) N = -N;
    float ndv = clamp(dot(N, V), 0.0, 1.0);
    float fres = pow(1.0 - ndv, 2.3);
    float crest = smoothstep(0.30, 0.95, vFold);
    float groove = 1.0 - smoothstep(0.0, 0.38, vFold);

    vec3 L1 = normalize(vec3(-0.45, 0.75, 0.55));
    vec3 L2 = normalize(vec3(0.75, -0.25, 0.45));
    float d1 = clamp(dot(N, L1), 0.0, 1.0);
    float d2 = clamp(dot(N, L2), 0.0, 1.0);

    vec3 deep = vec3(0.012, 0.045, 0.20);
    vec3 mid = vec3(0.10, 0.36, 0.98);
    vec3 hi = vec3(0.62, 0.92, 1.0);

    vec3 col = deep + mid * (0.08 + 0.72 * d1) * mix(0.32, 1.0, crest) + vec3(0.16, 0.30, 0.95) * d2 * 0.2;
    col += hi * fres * 1.15;
    col *= 1.0 - 0.7 * groove;

    float vein = 1.0 - smoothstep(0.0, 0.09, abs(vFold - 0.36));
    col += vec3(0.22, 0.68, 1.0) * vein * (0.5 + 0.18 * sin(uTime * 0.7 + vY * 3.5));
    col += hi * pow(crest, 4.0) * 0.16 * (0.4 + 0.6 * d1);

    float a = 0.5 + fres * 0.42 + crest * 0.05;
    if (uBack > 0.5) {
      col *= 0.7;
      a = 0.3 + fres * 0.35;
    }
    gl_FragColor = vec4(col, a);
  }
`;

const SHELL_FRAGMENT = /* glsl */ `
  varying vec3 vN;
  varying vec3 vV;
  varying float vFold;
  varying float vY;
  void main() {
    float ndv = clamp(dot(normalize(vN), normalize(vV)), 0.0, 1.0);
    float rim = pow(1.0 - ndv, 3.2);
    gl_FragColor = vec4(vec3(0.30, 0.65, 1.0) * rim * 0.75, rim * 0.5);
  }
`;

const SPARK_VERTEX = /* glsl */ `
  attribute float aPhase;
  uniform float uTime;
  uniform float uScale;
  varying float vA;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float tw = 0.5 + 0.5 * sin(uTime * 1.3 + aPhase * 6.2831);
    vA = 0.25 + 0.75 * tw;
    gl_PointSize = uScale * (0.55 + 0.6 * tw) / -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;
const SPARK_FRAGMENT = /* glsl */ `
  varying float vA;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float g = smoothstep(1.0, 0.0, d);
    gl_FragColor = vec4(vec3(0.6, 0.9, 1.0) * g, g * g * vA);
  }
`;

function radialTexture(stops: [number, string][], size = 128): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  stops.forEach(([o, c]) => g.addColorStop(o, c));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new CanvasTexture(canvas);
}

function beamTexture(): CanvasTexture {
  const w = 64, h = 256;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  const v = ctx.createLinearGradient(0, 0, 0, h);
  v.addColorStop(0, "rgba(255,255,255,0)");
  v.addColorStop(0.55, "rgba(255,255,255,0.55)");
  v.addColorStop(1, "rgba(255,255,255,0.9)");
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = "destination-in";
  const hgrad = ctx.createLinearGradient(0, 0, w, 0);
  hgrad.addColorStop(0, "rgba(0,0,0,0)");
  hgrad.addColorStop(0.5, "rgba(0,0,0,1)");
  hgrad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = hgrad;
  ctx.fillRect(0, 0, w, h);
  return new CanvasTexture(canvas);
}

const nextTask = () => new Promise<void>((r) => setTimeout(r, 0));

export async function mountBrainScene(host: HTMLElement, onFail: () => void): Promise<BrainSceneHandle> {
  const renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: "default" });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  const canvas = renderer.domElement;
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;";
  host.appendChild(canvas);

  const scene = new Scene();
  const camera = new PerspectiveCamera(34, 1, 0.1, 50);
  camera.position.set(0, 0.16, 6.0);
  camera.lookAt(0, -0.2, 0);

  const disposables: { dispose(): void }[] = [];
  const track = <T extends { dispose(): void }>(o: T): T => (disposables.push(o), o);

  // ── Brain surface (built in slices so no single task blocks the page) ──────
  const mesh = buildBrainMesh(6, 11);
  await nextTask();

  const brain = new Group();
  brain.position.y = 0.12;
  scene.add(brain);

  const uniforms = { uTime: { value: 0 }, uBack: { value: 0 } };
  const backUniforms = { uTime: uniforms.uTime, uBack: { value: 1 } };
  const frontMat = track(new ShaderMaterial({ vertexShader: VERTEX, fragmentShader: FRAGMENT, uniforms, transparent: true, side: FrontSide, depthWrite: true }));
  const backMat = track(new ShaderMaterial({ vertexShader: VERTEX, fragmentShader: FRAGMENT, uniforms: backUniforms, transparent: true, side: BackSide, depthWrite: false, blending: AdditiveBlending }));

  const shellMat = track(new ShaderMaterial({ vertexShader: VERTEX, fragmentShader: SHELL_FRAGMENT, transparent: true, side: FrontSide, depthWrite: false, blending: AdditiveBlending }));
  const addPart = (part: BrainPart, shell = false) => {
    const geo = track(new BufferGeometry());
    geo.setAttribute("position", new BufferAttribute(part.positions, 3));
    geo.setAttribute("aFold", new BufferAttribute(part.folds, 1));
    geo.setIndex(new BufferAttribute(part.indices, 1));
    geo.computeVertexNormals();
    const back = new Mesh(geo, backMat);
    back.renderOrder = 1;
    const front = new Mesh(geo, frontMat);
    front.renderOrder = 2;
    brain.add(back, front);
    if (shell) {
      const glowShell = new Mesh(geo, shellMat);
      glowShell.scale.setScalar(1.035);
      glowShell.renderOrder = 3;
      brain.add(glowShell);
    }
  };
  for (const part of [...mesh.hemispheres, mesh.cerebellum, mesh.stem]) {
    addPart(part, mesh.hemispheres.includes(part));
    await nextTask();
  }

  // Synapse sparks: a few dozen points twinkling on gyrus crests.
  const sparkPos: number[] = [], sparkPhase: number[] = [];
  let seed = 5;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (const part of mesh.hemispheres) {
    for (let tries = 0, got = 0; tries < 4000 && got < 40; tries++) {
      const i = Math.floor(rnd() * part.folds.length);
      if (part.folds[i] > 0.9) {
        sparkPos.push(part.positions[i * 3] * 1.012, part.positions[i * 3 + 1] * 1.012, part.positions[i * 3 + 2] * 1.012);
        sparkPhase.push(rnd());
        got++;
      }
    }
  }
  const sparkGeo = track(new BufferGeometry());
  sparkGeo.setAttribute("position", new BufferAttribute(new Float32Array(sparkPos), 3));
  sparkGeo.setAttribute("aPhase", new BufferAttribute(new Float32Array(sparkPhase), 1));
  const sparkMat = track(new ShaderMaterial({
    vertexShader: SPARK_VERTEX, fragmentShader: SPARK_FRAGMENT, transparent: true, depthWrite: false, blending: AdditiveBlending,
    uniforms: { uTime: uniforms.uTime, uScale: { value: 60 } },
  }));
  const sparks = new Points(sparkGeo, sparkMat);
  sparks.renderOrder = 3;
  brain.add(sparks);

  // ── Light: halo, beam and floor pool ───────────────────────────────────────
  const haloTex = track(radialTexture([[0, "rgba(255,255,255,1)"], [0.3, "rgba(255,255,255,0.35)"], [1, "rgba(255,255,255,0)"]]));
  const halo = new Sprite(track(new SpriteMaterial({ map: haloTex, color: 0x1d4ed8, transparent: true, opacity: 0.34, depthWrite: false, blending: AdditiveBlending })));
  halo.scale.set(5.2, 5.2, 1);
  halo.position.set(0, 0.0, -1.1);
  scene.add(halo);

  const beamTex = track(beamTexture());
  const beam = new Sprite(track(new SpriteMaterial({ map: beamTex, color: 0x38bdf8, transparent: true, opacity: 0.2, depthWrite: false, blending: AdditiveBlending })));
  beam.scale.set(1.2, 1.9, 1);
  beam.position.set(0, PEDESTAL_Y + 1.05, -0.3);
  scene.add(beam);

  const poolMat = track(new MeshBasicMaterial({ map: haloTex, color: 0x2f8bff, transparent: true, opacity: 0.55, depthWrite: false, blending: AdditiveBlending }));
  const pool = new Mesh(track(new CircleGeometry(1.35, 64)), poolMat);
  pool.rotation.x = -Math.PI / 2;
  pool.position.y = PEDESTAL_Y + 0.31;
  scene.add(pool);

  // ── Pedestal: three lit tiers with glowing rims ────────────────────────────
  scene.add(new AmbientLight(0x1b2a55, 1.1));
  const key = new DirectionalLight(0x9fd0ff, 1.4);
  key.position.set(-2.5, 4, 3);
  scene.add(key);
  const glow = new PointLight(0x3b9cff, 9, 9, 1.6);
  glow.position.set(0, PEDESTAL_Y + 0.9, 1.4);
  scene.add(glow);

  const tierMat = track(new MeshStandardMaterial({ color: 0x0a1330, metalness: 0.75, roughness: 0.32 }));
  const rimMat = track(new MeshBasicMaterial({ color: 0x4cc4ff, transparent: true, opacity: 0.85, blending: AdditiveBlending, depthWrite: false }));
  const pedestal = new Group();
  const tiers: [number, number, number][] = [ // [top radius, height, y]
    [1.5, 0.18, PEDESTAL_Y],
    [1.18, 0.14, PEDESTAL_Y + 0.16],
    [0.86, 0.12, PEDESTAL_Y + 0.29],
  ];
  const rims: Mesh[] = [];
  tiers.forEach(([radius, height, y]) => {
    const body = new Mesh(track(new CylinderGeometry(radius, radius * 1.05, height, 120)), tierMat);
    body.position.y = y;
    pedestal.add(body);
    const rim = new Mesh(track(new TorusGeometry(radius, 0.011, 8, 160)), rimMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = y + height / 2;
    pedestal.add(rim);
    rims.push(rim);
  });
  const topY = PEDESTAL_Y + 0.29 + 0.06;
  const topGlow = new Mesh(track(new CircleGeometry(0.84, 96)), track(new MeshBasicMaterial({ map: haloTex, color: 0x1f6bff, transparent: true, opacity: 0.85, depthWrite: false, blending: AdditiveBlending })));
  topGlow.rotation.x = -Math.PI / 2;
  topGlow.position.y = topY + 0.004;
  pedestal.add(topGlow);
  const rings: Mesh[] = [];
  [[0.46, 0.47, 0.5], [0.66, 0.672, 0.3]].forEach(([inner, outer, opacity]) => {
    const ring = new Mesh(track(new RingGeometry(inner, outer, 128)), track(new MeshBasicMaterial({ color: 0x53c7ff, transparent: true, opacity, side: DoubleSide, depthWrite: false, blending: AdditiveBlending })));
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = topY + 0.006;
    pedestal.add(ring);
    rings.push(ring);
  });
  scene.add(pedestal);

  // ── Size, pointer, loop ────────────────────────────────────────────────────
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
  let raf = 0, running = false, onScreen = true, last = 0, elapsed = 0, frames = 0, lastReport = 0;
  let fpsCap = MAX_FPS, slowFrames = 0;

  const tick = (now: number) => {
    raf = requestAnimationFrame(tick);
    const dt = now - last;
    if (dt < 1000 / fpsCap - 2) return;
    last = now;
    // Weaker device? If frames keep arriving slower than ~30 fps, halve the work
    // for good: lower frame cap and pixel ratio.
    if (fpsCap === MAX_FPS && frames > 20) {
      slowFrames = dt > 36 ? slowFrames + 1 : Math.max(0, slowFrames - 1);
      if (slowFrames > 40) {
        fpsCap = FALLBACK_FPS;
        renderer.setPixelRatio(1);
        width = 0;
        resize();
      }
    }
    elapsed += Math.min(dt, 100) / 1000;

    pointer.x += (pointer.tx - pointer.x) * 0.06;
    pointer.y += (pointer.ty - pointer.y) * 0.06;

    brain.rotation.y = BASE_YAW + Math.sin(elapsed * 0.22) * 0.34 + pointer.x * 0.3;
    brain.rotation.x = pointer.y * 0.1 + Math.sin(elapsed * 0.31) * 0.025;
    brain.position.y = 0.12 + Math.sin(elapsed * 0.7) * 0.03;
    uniforms.uTime.value = elapsed;
    halo.material.opacity = 0.32 + 0.03 * Math.sin(elapsed * 0.9);
    beam.material.opacity = 0.18 + 0.03 * Math.sin(elapsed * 0.9 + 1);
    rings.forEach((ring, i) => (ring.rotation.z = elapsed * (0.05 + i * 0.03) * (i % 2 ? -1 : 1)));

    renderer.render(scene, camera);
    frames++;
    if (frames === 2) host.dataset.brain3d = "ready";
    if (now - lastReport > 250) {
      lastReport = now;
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
