import {
  AdditiveBlending, BackSide, BufferAttribute, BufferGeometry, CanvasTexture, CircleGeometry, Color,
  CylinderGeometry, DoubleSide, FrontSide, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, NoColorSpace, NoToneMapping,
  PerspectiveCamera, PMREMGenerator, Points, RepeatWrapping, RingGeometry, Scene, ShaderMaterial, Sprite,
  SpriteMaterial, Texture, TorusGeometry, Vector2, WebGLRenderer,
} from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { buildBrainMesh, GYRI_TILE_SCALE, type BrainPart, type HeightField } from "@/lib/brainMesh";

/**
 * The 3D hero scene: a holographic cortex (procedural mesh displaced and
 * bump-shaded by a reaction-diffusion gyri map) floating over a lit,
 * environment-reflecting pedestal, with bloom. Loaded on demand only for
 * desktop-sized screens with WebGL and no reduced-motion preference. Renders
 * only while on screen and the tab is visible, caps frame rate and pixel
 * ratio, drops bloom and resolution on weak devices, and releases every GPU
 * resource on dispose().
 */

export interface BrainSceneHandle {
  dispose(): void;
  setPointer(x: number, y: number): void;
}

const MAX_FPS = 60;
const FALLBACK_FPS = 30;
const BASE_YAW = -0.85; // front of the brain toward the viewer's left
const BRAIN_Y = 0.22;
const PEDESTAL_Y = -1.42;
const BG = 0x000000;

// ── shaders ─────────────────────────────────────────────────────────────────

const BRAIN_VERTEX = /* glsl */ `
  attribute float aFold;
  varying vec3 vObjPos;
  varying vec3 vObjN;
  varying vec3 vViewPos;
  varying float vFold;
  void main() {
    vObjPos = position;
    vObjN = normal;
    vFold = aFold;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vViewPos = mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`;

const BRAIN_FRAGMENT = /* glsl */ `
  uniform mat3 normalMatrix;
  uniform sampler2D uGyri;
  uniform float uScale;
  uniform float uTime;
  uniform float uBack;
  uniform float uBump;
  varying vec3 vObjPos;
  varying vec3 vObjN;
  varying vec3 vViewPos;
  varying float vFold;

  float tri(vec3 p, vec3 w) {
    return texture2D(uGyri, p.yz * uScale).r * w.x + texture2D(uGyri, p.xz * uScale).r * w.y + texture2D(uGyri, p.xy * uScale).r * w.z;
  }

  void main() {
    vec3 nO = normalize(vObjN);
    vec3 w = pow(abs(nO), vec3(4.0));
    w /= (w.x + w.y + w.z);
    vec3 p = vObjPos;
    float e = 0.006;
    float h = tri(p, w);
    vec3 g = vec3(
      tri(p + vec3(e, 0.0, 0.0), w) - tri(p - vec3(e, 0.0, 0.0), w),
      tri(p + vec3(0.0, e, 0.0), w) - tri(p - vec3(0.0, e, 0.0), w),
      tri(p + vec3(0.0, 0.0, e), w) - tri(p - vec3(0.0, 0.0, e), w)) / (2.0 * e);
    g -= nO * dot(g, nO);
    vec3 Np = normalize(nO - g * uBump);
    vec3 N = normalize(normalMatrix * Np);
    if (uBack > 0.5) N = -N;
    vec3 V = normalize(-vViewPos);

    float ndv = clamp(dot(N, V), 0.0, 1.0);
    float fres = pow(1.0 - ndv, 2.6);
    float crest = smoothstep(0.08, 0.9, h);

    vec3 L1 = normalize(vec3(-0.35, 0.85, 0.55)); // key, upper left
    vec3 L2 = normalize(vec3(0.45, -0.9, 0.35));  // cyan uplight from the pedestal
    float d1 = dot(N, L1) * 0.5 + 0.5;
    d1 *= d1;
    float d2 = clamp(dot(N, L2), 0.0, 1.0);
    vec3 H1 = normalize(L1 + V);
    float nh = clamp(dot(N, H1), 0.0, 1.0);
    float sp = pow(nh, 110.0) * 1.9 + pow(nh, 14.0) * 0.28;

    vec3 sulcus = vec3(0.002, 0.01, 0.16);
    vec3 gyrus = vec3(0.02, 0.13, 0.95);
    vec3 hot = vec3(0.55, 0.9, 1.0);

    vec3 col = mix(sulcus, gyrus, crest) * (0.14 + 0.86 * d1) * (0.35 + 0.65 * crest);
    col += vec3(0.02, 0.25, 1.0) * d2 * 0.2 * crest;
    col += hot * sp * crest;
    col += vec3(0.1, 0.45, 1.0) * fres * 0.5;
    float band = smoothstep(0.86, 1.0, sin(uTime * 0.55 - vObjPos.y * 3.2 + vObjPos.z * 0.7));
    col += vec3(0.15, 0.7, 1.0) * band * 0.22 * crest;

    float a = 0.7 + 0.3 * fres;
    if (uBack > 0.5) {
      col *= 0.45;
      a = 0.22 + 0.35 * fres;
    }
    gl_FragColor = vec4(col, a);
  }
`;

const SHELL_FRAGMENT = /* glsl */ `
  uniform mat3 normalMatrix;
  varying vec3 vObjN;
  varying vec3 vViewPos;
  void main() {
    vec3 N = normalize(normalMatrix * normalize(vObjN));
    float ndv = clamp(dot(N, normalize(-vViewPos)), 0.0, 1.0);
    float rim = pow(1.0 - ndv, 3.4);
    gl_FragColor = vec4(vec3(0.1, 0.5, 1.0) * rim * 0.35, rim * 0.3);
  }
`;

const POINT_VERTEX = /* glsl */ `
  attribute float aPhase;
  attribute float aSize;
  attribute vec3 aColor;
  uniform float uTime;
  uniform float uScale;
  uniform float uDrift;
  varying float vA;
  varying vec3 vC;
  void main() {
    vec3 pos = position;
    pos.y += uDrift * sin(uTime * 0.25 + aPhase * 6.2831) * 0.08;
    pos.x += uDrift * cos(uTime * 0.18 + aPhase * 4.0) * 0.06;
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    float tw = 0.5 + 0.5 * sin(uTime * 1.4 + aPhase * 6.2831);
    vA = 0.3 + 0.7 * tw;
    vC = aColor;
    gl_PointSize = uScale * aSize * (0.6 + 0.5 * tw) / -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;
const POINT_FRAGMENT = /* glsl */ `
  varying float vA;
  varying vec3 vC;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float g = smoothstep(1.0, 0.0, d);
    gl_FragColor = vec4(vC * g, g * g * vA);
  }
`;

// ── helpers ─────────────────────────────────────────────────────────────────

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

function verticalTexture(stops: [number, string][], w = 4, h = 256): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createLinearGradient(0, h, 0, 0); // bottom -> top, matching texture v 0 -> 1
  stops.forEach(([o, c]) => g.addColorStop(o, c));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  return new CanvasTexture(canvas);
}

async function loadHeightField(url: string): Promise<{ field: HeightField; texture: Texture }> {
  const img = new Image();
  img.decoding = "async";
  img.src = url;
  await img.decode();
  const size = img.naturalWidth;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);
  const rgba = ctx.getImageData(0, 0, size, size).data;
  const data = new Float32Array(size * size);
  for (let i = 0; i < data.length; i++) data[i] = rgba[i * 4] / 255;
  const texture = new Texture(img);
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.colorSpace = NoColorSpace;
  texture.needsUpdate = true;
  return { field: { size, data }, texture };
}

const nextTask = () => new Promise<void>((r) => setTimeout(r, 0));
let seed = 9;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

export async function mountBrainScene(host: HTMLElement, onFail: () => void): Promise<BrainSceneHandle> {
  seed = 9;
  const renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: "default" });
  renderer.setClearColor(BG, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.toneMapping = NoToneMapping;
  const canvas = renderer.domElement;
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;";
  host.appendChild(canvas);

  const scene = new Scene();
  const camera = new PerspectiveCamera(30, 1, 0.1, 60);
  camera.position.set(1.05, 3.0, 6.6);
  camera.lookAt(0, -0.2, 0);

  const disposables: { dispose(): void }[] = [];
  const track = <T extends { dispose(): void }>(o: T): T => (disposables.push(o), o);

  // Environment for the metallic pedestal.
  const pmrem = new PMREMGenerator(renderer);
  const envTarget = pmrem.fromScene(new RoomEnvironment(), 0.04);
  scene.environment = envTarget.texture;
  disposables.push(envTarget, pmrem);

  // ── Brain ─────────────────────────────────────────────────────────────────
  const { field, texture: gyriTex } = await loadHeightField("/hero/gyri.png");
  track(gyriTex);
  const mesh = buildBrainMesh(field, 6);
  await nextTask();

  const brain = new Group();
  brain.position.y = BRAIN_Y;
  scene.add(brain);

  const uTime = { value: 0 };
  const uniforms = { uGyri: { value: gyriTex }, uScale: { value: GYRI_TILE_SCALE }, uTime, uBack: { value: 0 }, uBump: { value: 0.55 } };
  const backUniforms = { ...uniforms, uBack: { value: 1 } };
  const frontMat = track(new ShaderMaterial({ vertexShader: BRAIN_VERTEX, fragmentShader: BRAIN_FRAGMENT, uniforms, transparent: true, side: FrontSide, depthWrite: true }));
  const backMat = track(new ShaderMaterial({ vertexShader: BRAIN_VERTEX, fragmentShader: BRAIN_FRAGMENT, uniforms: backUniforms, transparent: true, side: BackSide, depthWrite: false, blending: AdditiveBlending }));
  const shellMat = track(new ShaderMaterial({ vertexShader: BRAIN_VERTEX, fragmentShader: SHELL_FRAGMENT, transparent: true, side: FrontSide, depthWrite: false, blending: AdditiveBlending }));

  const addPart = (part: BrainPart, shell: boolean) => {
    const geo = track(new BufferGeometry());
    geo.setAttribute("position", new BufferAttribute(part.positions, 3));
    geo.setAttribute("aFold", new BufferAttribute(part.folds, 1));
    geo.setIndex(new BufferAttribute(part.indices, 1));
    geo.computeVertexNormals();
    const back = new Mesh(geo, backMat);
    back.renderOrder = 2;
    const front = new Mesh(geo, frontMat);
    front.renderOrder = 3;
    brain.add(back, front);
    if (shell) {
      const glowShell = new Mesh(geo, shellMat);
      glowShell.scale.setScalar(1.03);
      glowShell.renderOrder = 4;
      brain.add(glowShell);
    }
  };
  for (const part of [...mesh.hemispheres, mesh.cerebellum, mesh.stem]) {
    addPart(part, mesh.hemispheres.includes(part));
    await nextTask();
  }

  // Inner light: glows through the translucent cortex.
  const softTex = track(radialTexture([[0, "rgba(255,255,255,1)"], [0.35, "rgba(255,255,255,0.4)"], [1, "rgba(255,255,255,0)"]]));
  const core = new Sprite(track(new SpriteMaterial({ map: softTex, color: 0x2f6fe6, transparent: true, opacity: 0.55, depthWrite: false, depthTest: false, blending: AdditiveBlending })));
  core.scale.set(1.5, 1.2, 1);
  core.renderOrder = 1;
  brain.add(core);
  const coreHot = new Sprite(track(new SpriteMaterial({ map: softTex, color: 0xbfe6ff, transparent: true, opacity: 0.18, depthWrite: false, depthTest: false, blending: AdditiveBlending })));
  coreHot.scale.set(0.6, 0.5, 1);
  coreHot.renderOrder = 1;
  brain.add(coreHot);

  // Synapse sparks on gyrus crests: mostly cyan, a few warm.
  const sparkPos: number[] = [], sparkPhase: number[] = [], sparkSize: number[] = [], sparkCol: number[] = [];
  for (const part of mesh.hemispheres) {
    for (let tries = 0, got = 0; tries < 6000 && got < 34; tries++) {
      const i = Math.floor(rnd() * part.folds.length);
      if (part.folds[i] > 0.92 && part.positions[i * 3 + 1] > -0.2) {
        sparkPos.push(part.positions[i * 3] * 1.01, part.positions[i * 3 + 1] * 1.01, part.positions[i * 3 + 2] * 1.01);
        sparkPhase.push(rnd());
        sparkSize.push(0.6 + rnd() * 0.8);
        const warm = rnd() < 0.3;
        sparkCol.push(...(warm ? [1.0, 0.72, 0.4] : [0.55, 0.9, 1.0]));
        got++;
      }
    }
  }
  const pointsMat = (scale: number, drift: number) =>
    track(new ShaderMaterial({ vertexShader: POINT_VERTEX, fragmentShader: POINT_FRAGMENT, transparent: true, depthWrite: false, blending: AdditiveBlending, uniforms: { uTime, uScale: { value: scale }, uDrift: { value: drift } } }));
  const makePoints = (pos: number[], phase: number[], size: number[], col: number[], mat: ShaderMaterial) => {
    const geo = track(new BufferGeometry());
    geo.setAttribute("position", new BufferAttribute(new Float32Array(pos), 3));
    geo.setAttribute("aPhase", new BufferAttribute(new Float32Array(phase), 1));
    geo.setAttribute("aSize", new BufferAttribute(new Float32Array(size), 1));
    geo.setAttribute("aColor", new BufferAttribute(new Float32Array(col), 3));
    return new Points(geo, mat);
  };
  const sparks = makePoints(sparkPos, sparkPhase, sparkSize, sparkCol, pointsMat(90, 0));
  sparks.renderOrder = 5;
  brain.add(sparks);

  // ── Atmosphere: backdrop gradient, halo, drifting bokeh ───────────────────

  const halo = new Sprite(track(new SpriteMaterial({ map: softTex, color: 0x1e4fd8, transparent: true, opacity: 0.34, depthWrite: false, blending: AdditiveBlending })));
  halo.scale.set(3.9, 3.9, 1);
  halo.position.set(0, 0.0, -1.2);
  scene.add(halo);

  const bokehPos: number[] = [], bokehPhase: number[] = [], bokehSize: number[] = [], bokehCol: number[] = [];
  for (let i = 0; i < 110; i++) {
    bokehPos.push((rnd() - 0.5) * 5.2, (rnd() - 0.4) * 3.4, -1.5 - rnd() * 4);
    bokehPhase.push(rnd());
    bokehSize.push(0.4 + rnd() * 2.6);
    const t = rnd();
    bokehCol.push(...(t < 0.15 ? [1.0, 0.75, 0.45] : t < 0.6 ? [0.3, 0.6, 1.0] : [0.55, 0.85, 1.0]));
  }
  const bokeh = makePoints(bokehPos, bokehPhase, bokehSize, bokehCol, pointsMat(34, 1));
  scene.add(bokeh);

  // ── Pedestal: metallic tiers, glowing grooves, rim lights, light cone ──────
  const pedestal = new Group();
  scene.add(pedestal);
  const metal = track(new MeshStandardMaterial({ color: 0x0b1430, metalness: 0.92, roughness: 0.28, envMapIntensity: 0.9 }));
  const rimMat = track(new MeshBasicMaterial({ color: 0x9ee8ff, transparent: true, opacity: 0.55, blending: AdditiveBlending, depthWrite: false }));
  const tiers: [number, number, number][] = [
    [1.85, 0.2, PEDESTAL_Y],
    [1.4, 0.16, PEDESTAL_Y + 0.18],
    [1.02, 0.14, PEDESTAL_Y + 0.33],
  ];
  const rims: Mesh[] = [];
  tiers.forEach(([radius, height, y], i) => {
    const body = new Mesh(track(new CylinderGeometry(radius, radius * 1.04, height, 128)), metal);
    body.position.y = y;
    pedestal.add(body);
    const rim = new Mesh(track(new TorusGeometry(radius * 0.985, 0.012, 8, 200)), rimMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = y + height / 2 + 0.002;
    pedestal.add(rim);
    rims.push(rim);
    if (i === 0) {
      const groove = new Mesh(track(new TorusGeometry(radius * 0.86, 0.008, 6, 200)), rimMat);
      groove.rotation.x = Math.PI / 2;
      groove.position.y = y + height / 2 + 0.002;
      pedestal.add(groove);
    }
  });
  const topY = PEDESTAL_Y + 0.33 + 0.07;
  const topGlow = new Mesh(track(new CircleGeometry(1.0, 96)), track(new MeshBasicMaterial({ map: softTex, color: 0x1d5bff, transparent: true, opacity: 0.4, depthWrite: false, blending: AdditiveBlending })));
  topGlow.rotation.x = -Math.PI / 2;
  topGlow.position.y = topY + 0.004;
  pedestal.add(topGlow);
  const rings: Mesh[] = [];
  [[0.5, 0.515, 0.7], [0.74, 0.75, 0.45]].forEach(([inner, outer, opacity]) => {
    const ring = new Mesh(track(new RingGeometry(inner, outer, 160)), track(new MeshBasicMaterial({ color: 0x7ddcff, transparent: true, opacity, side: DoubleSide, depthWrite: false, blending: AdditiveBlending })));
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = topY + 0.006;
    pedestal.add(ring);
    rings.push(ring);
  });
  // Small rim lights around the base tier.
  const lightPos: number[] = [], lightPhase: number[] = [], lightSize: number[] = [], lightCol: number[] = [];
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2;
    lightPos.push(Math.cos(a) * 1.72, PEDESTAL_Y + 0.11, Math.sin(a) * 1.72);
    lightPhase.push(i / 36);
    lightSize.push(0.5);
    lightCol.push(0.6, 0.92, 1.0);
  }
  pedestal.add(makePoints(lightPos, lightPhase, lightSize, lightCol, pointsMat(70, 0)));

  // Light cone from the pedestal up to the brain.
  const coneTex = track(verticalTexture([[0, "rgba(255,255,255,0.75)"], [0.45, "rgba(255,255,255,0.22)"], [1, "rgba(255,255,255,0)"]]));
  const coneH = BRAIN_Y - 0.55 - topY;
  const cone = new Mesh(
    track(new CylinderGeometry(0.95, 0.72, coneH, 72, 1, true)),
    track(new MeshBasicMaterial({ map: coneTex, color: 0x3aa6ff, transparent: true, opacity: 0.16, side: DoubleSide, depthWrite: false, blending: AdditiveBlending }))
  );
  cone.position.y = topY + coneH / 2;
  scene.add(cone);

  // Floor: dark reflective plane with a light pool and faint outer rings.
  const floorY = PEDESTAL_Y - 0.1;
  const floorFade = track(radialTexture([[0, "rgba(255,255,255,1)"], [0.35, "rgba(255,255,255,0.75)"], [0.6, "rgba(255,255,255,0.2)"], [0.78, "rgba(255,255,255,0)"]], 256));
  const floor = new Mesh(track(new CircleGeometry(3.5, 96)), track(new MeshBasicMaterial({ color: 0x0a1330, transparent: true, opacity: 0.85, alphaMap: floorFade, depthWrite: false })));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = floorY;
  scene.add(floor);
  const pool = new Mesh(track(new CircleGeometry(2.0, 64)), track(new MeshBasicMaterial({ map: softTex, color: 0x1a48d0, transparent: true, opacity: 0.3, depthWrite: false, blending: AdditiveBlending })));
  pool.rotation.x = -Math.PI / 2;
  pool.position.y = floorY + 0.003;
  scene.add(pool);
  [[1.98, 1.995, 0.22], [2.3, 2.31, 0.12]].forEach(([inner, outer, opacity]) => {
    const ring = new Mesh(track(new RingGeometry(inner, outer, 200)), track(new MeshBasicMaterial({ color: 0x4fbfff, transparent: true, opacity, side: DoubleSide, depthWrite: false, blending: AdditiveBlending })));
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = floorY + 0.004;
    scene.add(ring);
  });

  // ── Post-processing (bloom), size, pointer, loop ──────────────────────────
  const composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  const bloom = new UnrealBloomPass(new Vector2(1, 1), 0.5, 0.3, 0.55);
  const output = new OutputPass();
  composer.addPass(renderPass);
  composer.addPass(bloom);
  composer.addPass(output);
  let useBloom = true;
  host.dataset.bloom = "on";

  let width = 0, height = 0;
  const resize = () => {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h || (w === width && h === height)) return;
    width = w; height = h;
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
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
    elapsed += Math.min(dt, 100) / 1000;
    // Weak device? If frames keep arriving slower than ~30 fps, drop bloom,
    // the frame cap and the pixel ratio for good.
    if (fpsCap === MAX_FPS && frames > 20) {
      slowFrames = dt > 36 ? slowFrames + 1 : Math.max(0, slowFrames - 1);
      if (slowFrames > 40) {
        fpsCap = FALLBACK_FPS;
        useBloom = false;
        host.dataset.bloom = "off";
        renderer.setPixelRatio(1);
        width = 0;
        resize();
      }
    }

    pointer.x += (pointer.tx - pointer.x) * 0.06;
    pointer.y += (pointer.ty - pointer.y) * 0.06;

    brain.rotation.y = BASE_YAW + Math.sin(elapsed * 0.2) * 0.3 + pointer.x * 0.28;
    brain.rotation.x = pointer.y * 0.1 + Math.sin(elapsed * 0.31) * 0.02;
    brain.position.y = BRAIN_Y + Math.sin(elapsed * 0.7) * 0.035;
    uTime.value = elapsed;
    halo.material.opacity = 0.32 + 0.03 * Math.sin(elapsed * 0.9);
    cone.material.opacity = 0.15 + 0.03 * Math.sin(elapsed * 0.9 + 1);
    core.material.opacity = 0.52 + 0.06 * Math.sin(elapsed * 1.3);
    rings.forEach((ring, i) => (ring.rotation.z = elapsed * (0.06 + i * 0.04) * (i % 2 ? -1 : 1)));

    if (useBloom) composer.render();
    else renderer.render(scene, camera);
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
      bloom.dispose();
      composer.dispose();
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
      delete host.dataset.brain3d;
      delete host.dataset.frames;
      delete host.dataset.pointer;
      delete host.dataset.bloom;
    },
  };
}
