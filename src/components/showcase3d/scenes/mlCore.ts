import {
  AdditiveBlending,
  BoxGeometry,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  Points,
  PointsMaterial,
  RingGeometry,
  SphereGeometry,
  Vector3,
} from "three";
import { ringGeometry } from "../devices";
import { lightPoolTexture, type ShowcaseKit } from "../kit";
import { roundedSlab } from "../shapes";

/**
 * The Machine Learning core: a slim dark-glass enclosure with real depth, and
 * a small, readable neural network laid out across three depth planes inside
 * it - nodes near the front glass, around the middle and receding toward the
 * back, with size, glow and colour falling off with depth. Five layers left to
 * right, a concentrated energy core at the centre, and a few learned routes
 * that light up clearly while the rest of the connections stay quiet.
 *
 * It is a static object; `setState` only changes how brightly nodes and edges
 * are lit, so the frame, the nodes and the camera never move.
 */

export const CORE_W = 5.6;
export const CORE_H = 5.75;

/** Inner z-range the network occupies (back .. front), inside the enclosure's own depth. */
const Z_BACK = -0.5;
const Z_FRONT = 0.5;

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));
const smooth = (t: number): number => t * t * (3 - 2 * t);

/** Visual importance of a node: three levels. */
const SMALL = 0;
const MEDIUM = 1;
const KEY = 2;
const LEVEL_RADIUS = [0.05, 0.08, 0.115];
const LEVEL_GLOW = [0.55, 0.9, 1.45];

interface Node {
  p: Vector3;
  layer: number;
  level: number;
  /** 0 at the back of the network, 1 at the front glass */
  depth: number;
  /** when the activation wave reaches this node, 0..1 of the learning phase */
  arrival: number;
  /** how bright it stays once the model has settled */
  settle: number;
  violet: boolean;
}

interface Edge {
  a: number;
  b: number;
  /** a learned route: lights clearly and stays lit; the rest stay quiet */
  route: boolean;
  peak: number;
  settle: number;
}

function hash(i: number): number {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function buildGraph(): { nodes: Node[]; edges: Edge[]; coreIndex: number } {
  const nodes: Node[] = [];
  const add = (x: number, y: number, z: number, layer: number, level: number, arrival: number, settle: number, violet = false): number => {
    nodes.push({ p: new Vector3(x, y, z), layer, level, depth: clamp01((z - Z_BACK) / (Z_FRONT - Z_BACK)), arrival, settle, violet });
    return nodes.length - 1;
  };
  const jit = (i: number, amt: number): number => (hash(i) - 0.5) * 2 * amt;
  let k = 0;
  // depth planes cycled through every column so each layer mixes front, middle and back nodes
  const PLANES = [0.44, -0.06, -0.46, 0.18, -0.28, 0.5];
  const column = (x: number, ys: number[], layer: number, arrival: number, settle: number, violet: boolean, phase: number): number[] =>
    ys.map((y, i) => {
      k++;
      const z = PLANES[(i + phase) % PLANES.length] + jit(k + 80, 0.05);
      return add(x + jit(k, 0.1), y + jit(k + 40, 0.06), z, layer, SMALL, arrival + i * 0.012, settle, violet);
    });

  const l0 = column(-1.95, [1.65, 0.83, 0, -0.85, -1.68], 0, 0.0, 0.3, false, 0);
  const l1 = column(-1.15, [2.0, 1.2, 0.4, -0.44, -1.27, -2.0], 1, 0.16, 0.28, false, 2);
  // ring around the core, alternating front / back so the core sits inside a shell of depth
  const ring: number[] = [];
  for (let i = 0; i < 6; i++) {
    const ang = (Math.PI / 3) * i + Math.PI / 6;
    ring.push(add(Math.cos(ang) * 0.95, 0.05 + Math.sin(ang) * 1.3, i % 2 === 0 ? 0.46 : -0.44, 2, KEY, 0.34 + i * 0.012, 0.42, i % 2 === 1));
  }
  const core = add(0.0, 0.05, 0.02, 2, KEY, 0.5, 1, false);
  const l3 = column(1.15, [1.95, 1.15, 0.34, -0.48, -1.3, -2.0], 3, 0.66, 0.3, true, 4);
  const l4 = column(1.95, [1.5, 0.5, -0.6, -1.5], 4, 0.82, 0.34, true, 1);

  // hierarchy: a few medium nodes on the learned routes, everything else stays small
  const routes: number[][] = [
    [l0[1], l1[1], ring[2], core, ring[0], l3[1], l4[0]],
    [l0[3], l1[4], ring[3], core, ring[5], l3[4], l4[3]],
    [l0[2], l1[3], ring[3], core, ring[0], l3[2], l4[1]],
  ];
  routes.flat().forEach((i) => {
    if (nodes[i].level === SMALL) nodes[i].level = MEDIUM;
  });

  const edges: Edge[] = [];
  const nearest = (from: number, pool: number[], n: number): number[] =>
    pool
      .map((j) => ({ j, d: nodes[from].p.distanceToSquared(nodes[j].p) }))
      .sort((x, y) => x.d - y.d)
      .slice(0, n)
      .map((x) => x.j);
  const link = (a: number, b: number): Edge => {
    const have = edges.find((e) => (e.a === a && e.b === b) || (e.a === b && e.b === a));
    if (have) return have;
    const e: Edge = { a, b, route: false, peak: 0.5, settle: 0.08 };
    edges.push(e);
    return e;
  };
  l0.forEach((a) => nearest(a, l1, 2).forEach((b) => link(a, b)));
  l1.forEach((a) => nearest(a, ring, 2).forEach((b) => link(a, b)));
  ring.forEach((r) => link(r, core));
  ring.forEach((r, i) => link(r, ring[(i + 1) % ring.length]));
  l3.forEach((b) => nearest(b, ring, 2).forEach((a) => link(a, b)));
  l4.forEach((b) => nearest(b, l3, 2).forEach((a) => link(a, b)));
  link(l1[1], l3[1]);
  link(l1[4], l3[4]);
  link(l0[2], l1[3]);
  // the learned routes: these light clearly as the signal passes and stay lit once it has
  routes.forEach((r) => {
    for (let i = 0; i < r.length - 1; i++) {
      const e = link(r[i], r[i + 1]);
      e.route = true;
      e.peak = 1;
      e.settle = 0.72;
    }
  });
  return { nodes, edges, coreIndex: core };
}

export interface MlCore {
  group: Group;
  /** learn: 0..1 progress of the activation wave; reset: 0..1 fade of everything lit back to dormant */
  setState(learn: number, reset: number): void;
  owned: { dispose(): void }[];
}

export function buildMlCore(kit: ShowcaseKit): MlCore {
  const owned: { dispose(): void }[] = [];
  const own = <T extends { dispose(): void }>(x: T): T => (owned.push(x), x);
  const group = new Group();

  // ── enclosure: a slim dark-metal bezel, a thin layer of blue glass inside it, and a fine luminous edge line ──
  const bezelMat = own(
    new MeshPhysicalMaterial({
      color: 0x111a38,
      metalness: 0.78,
      roughness: 0.26,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
      envMapIntensity: 1.5,
      emissive: 0x0a1650,
      emissiveIntensity: 0.55,
      transparent: true,
      opacity: 0.94,
    }),
  );
  group.add(new Mesh(own(ringGeometry(CORE_W, CORE_H, 1.2, 0.2, 1.15, 0.07)), bezelMat));

  const glassMat = own(
    new MeshPhysicalMaterial({
      color: 0x6f9bff,
      metalness: 0.1,
      roughness: 0.05,
      transparent: true,
      opacity: 0.2,
      clearcoat: 1,
      clearcoatRoughness: 0.02,
      envMapIntensity: 3,
      emissive: 0x2a48c8,
      emissiveIntensity: 0.4,
      depthWrite: false,
    }),
  );
  group.add(new Mesh(own(ringGeometry(CORE_W - 0.36, CORE_H - 0.36, 1.05, 0.15, 0.95, 0.04)), glassMat));

  const lineMat = own(
    new MeshPhysicalMaterial({
      color: 0x9cc4ff,
      metalness: 0.2,
      roughness: 0.1,
      transparent: true,
      opacity: 0.9,
      emissive: 0x3f78ff,
      emissiveIntensity: 1.3,
    }),
  );
  [0.54, -0.54].forEach((z) => {
    const line = new Mesh(own(ringGeometry(CORE_W - 0.66, CORE_H - 0.66, 0.9, 0.035, 0.05, 0.015)), lineMat);
    line.position.z = z;
    group.add(line);
  });

  // dark backing, and two very faint glass sheets that layer the depth (things behind them read as deeper)
  const backMat = own(
    new MeshPhysicalMaterial({ color: 0x02061a, roughness: 0.3, clearcoat: 0.4, envMapIntensity: 0.6, transparent: true, opacity: 0.94, depthWrite: false }),
  );
  const back = new Mesh(own(roundedSlab(CORE_W - 0.5, CORE_H - 0.5, 0.1, 1.0, 0.03)), backMat);
  back.position.z = -0.56;
  back.renderOrder = 1;
  group.add(back);
  const sheetMat = own(
    new MeshPhysicalMaterial({ color: 0x8fb0ff, roughness: 0.03, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.2, transparent: true, opacity: 0.03, depthWrite: false }),
  );
  [-0.2, 0.2].forEach((z, i) => {
    const sheet = new Mesh(own(roundedSlab(CORE_W - 0.5, CORE_H - 0.5, 0.04, 1.0, 0.015)), sheetMat);
    sheet.position.z = z;
    sheet.renderOrder = i === 0 ? 2 : 5;
    group.add(sheet);
  });
  const frontMat = own(
    new MeshPhysicalMaterial({ color: 0x9db8ff, roughness: 0.02, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.6, transparent: true, opacity: 0.04, depthWrite: false }),
  );
  const front = new Mesh(own(roundedSlab(CORE_W - 0.5, CORE_H - 0.5, 0.05, 1.0, 0.02)), frontMat);
  front.position.z = 0.56;
  front.renderOrder = 6;
  group.add(front);

  // small dark tabs, sunk into the bezel: a structural detail, not a feature
  const tabMat = own(new MeshStandardMaterial({ color: 0x141c34, metalness: 0.8, roughness: 0.34 }));
  const tabGeo = own(new BoxGeometry(0.34, 0.09, 0.3));
  const tabAt = (x: number, y: number, rot: number): void => {
    const m = new Mesh(tabGeo, tabMat);
    m.position.set(x, y, 0);
    m.rotation.z = rot;
    group.add(m);
  };
  const hx = CORE_W / 2 - 0.05;
  const hy = CORE_H / 2 - 0.05;
  tabAt(-1.65, hy, 0);
  tabAt(1.65, hy, 0);
  tabAt(-1.65, -hy, 0);
  tabAt(1.65, -hy, 0);
  tabAt(-hx, 1.8, Math.PI / 2);
  tabAt(hx, 1.8, Math.PI / 2);
  tabAt(-hx, -1.8, Math.PI / 2);
  tabAt(hx, -1.8, Math.PI / 2);

  // soft halo behind the enclosure so the object sits in its own light
  const haloTex = kit.track(lightPoolTexture([70, 105, 255], 0.5));
  const halo = new Mesh(
    own(new PlaneGeometry(11.5, 11.5)),
    own(new MeshBasicMaterial({ map: haloTex, transparent: true, opacity: 0.8, depthWrite: false, blending: AdditiveBlending, toneMapped: false })),
  );
  halo.position.z = -1.0;
  halo.renderOrder = -1;
  group.add(halo);

  // a faint blue glow deep inside, behind the network: the interior has atmosphere, and it warms as the model works
  const innerTex = kit.track(lightPoolTexture([60, 100, 255], 0.5));
  const innerGlowMat = own(new MeshBasicMaterial({ map: innerTex, transparent: true, opacity: 0.18, depthWrite: false, blending: AdditiveBlending, toneMapped: false }));
  const innerGlow = new Mesh(own(new PlaneGeometry(5.0, 5.2)), innerGlowMat);
  innerGlow.position.z = -0.5;
  innerGlow.renderOrder = 2;
  group.add(innerGlow);

  // ── the network ──
  const { nodes, edges, coreIndex } = buildGraph();
  const N = nodes.length;

  const sphereGeo = own(new SphereGeometry(1, 16, 12));
  const sphereMat = own(new MeshBasicMaterial({ toneMapped: false }));
  const spheres = new InstancedMesh(sphereGeo, sphereMat, N);
  spheres.renderOrder = 3;
  spheres.frustumCulled = false;
  group.add(spheres);

  // node glow: one Points object, with a per-node size (hierarchy x depth) patched into the stock shader
  const glowTex = kit.track(lightPoolTexture([255, 255, 255], 1));
  const glowGeo = own(new BufferGeometry());
  const glowPos = new Float32Array(N * 3);
  nodes.forEach((n, i) => n.p.toArray(glowPos, i * 3));
  glowGeo.setAttribute("position", new Float32BufferAttribute(glowPos, 3));
  const glowColAttr = new Float32BufferAttribute(new Float32Array(N * 3), 3);
  const glowCol = glowColAttr.array as Float32Array; // the attribute copies what it is given, so write through its own array
  glowGeo.setAttribute("color", glowColAttr);
  const sizeArr = new Float32Array(N);
  nodes.forEach((n, i) => (sizeArr[i] = (0.6 + 0.4 * LEVEL_GLOW[n.level]) * (0.5 + 0.9 * n.depth)));
  glowGeo.setAttribute("aSize", new Float32BufferAttribute(sizeArr, 1));
  const glowMat = own(
    new PointsMaterial({ map: glowTex, size: 3.6, sizeAttenuation: true, vertexColors: true, transparent: true, depthWrite: false, blending: AdditiveBlending, toneMapped: false }),
  );
  glowMat.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace("uniform float size;", "uniform float size;\nattribute float aSize;").replace("gl_PointSize = size;", "gl_PointSize = size * aSize;");
  };
  const glow = new Points(glowGeo, glowMat);
  glow.renderOrder = 4;
  glow.frustumCulled = false;
  group.add(glow);

  // the energy core: layered halos of decreasing intensity around a small bright centre
  const makeHalo = (size: number, rgb: [number, number, number], order: number): { mat: PointsMaterial } => {
    const g = own(new BufferGeometry());
    g.setAttribute("position", new Float32BufferAttribute([nodes[coreIndex].p.x, nodes[coreIndex].p.y, nodes[coreIndex].p.z], 3));
    const mat = own(
      new PointsMaterial({
        map: kit.track(lightPoolTexture(rgb, 1)),
        size,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: AdditiveBlending,
        toneMapped: false,
      }),
    );
    const p = new Points(g, mat);
    p.renderOrder = order;
    p.frustumCulled = false;
    group.add(p);
    return { mat };
  };
  const haloInner = makeHalo(7, [120, 220, 255], 4);
  const haloMid = makeHalo(13, [150, 120, 255], 4);
  const haloOuter = makeHalo(24, [90, 100, 255], 4);
  // a fine energy ring around the core, only present while it is working
  const ringMat = own(new MeshBasicMaterial({ color: 0x8fdcff, transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending, toneMapped: false }));
  const energyRing = new Mesh(own(new RingGeometry(0.3, 0.325, 64)), ringMat);
  energyRing.position.copy(nodes[coreIndex].p);
  energyRing.renderOrder = 4;
  group.add(energyRing);

  const E = edges.length;
  const linePos = new Float32Array(E * 6);
  edges.forEach((e, i) => {
    nodes[e.a].p.toArray(linePos, i * 6);
    nodes[e.b].p.toArray(linePos, i * 6 + 3);
  });
  const lineGeo = own(new BufferGeometry());
  lineGeo.setAttribute("position", new Float32BufferAttribute(linePos, 3));
  const lineColAttr = new Float32BufferAttribute(new Float32Array(E * 6), 3);
  const lineCol = lineColAttr.array as Float32Array;
  lineGeo.setAttribute("color", lineColAttr);
  const lineMaterial = own(new LineBasicMaterial({ vertexColors: true, transparent: true, blending: AdditiveBlending, depthWrite: false, toneMapped: false }));
  const lines = new LineSegments(lineGeo, lineMaterial);
  lines.renderOrder = 2;
  lines.frustumCulled = false;
  group.add(lines);

  // the learned routes get a second, slightly offset line that carries only their lit part, so an active route reads
  // as a brighter, thicker path than the quiet connections around it (dormant, it is black and adds nothing)
  const routeIdx = edges.map((e, i) => (e.route ? i : -1)).filter((i) => i >= 0);
  const routePos = new Float32Array(routeIdx.length * 6);
  routeIdx.forEach((ei, j) => {
    nodes[edges[ei].a].p.toArray(routePos, j * 6);
    nodes[edges[ei].b].p.toArray(routePos, j * 6 + 3);
    for (let v = 0; v < 2; v++) {
      routePos[j * 6 + v * 3] += 0.012;
      routePos[j * 6 + v * 3 + 1] += 0.012;
    }
  });
  const routeGeo = own(new BufferGeometry());
  routeGeo.setAttribute("position", new Float32BufferAttribute(routePos, 3));
  const routeColAttr = new Float32BufferAttribute(new Float32Array(routeIdx.length * 6), 3);
  const routeCol = routeColAttr.array as Float32Array;
  routeGeo.setAttribute("color", routeColAttr);
  const routeLines = new LineSegments(routeGeo, lineMaterial);
  routeLines.renderOrder = 2;
  routeLines.frustumCulled = false;
  group.add(routeLines);

  // dormant and lit colours
  const DIM_NODE = new Color(0.07, 0.15, 0.42);
  const HOT_BLUE = new Color(0.55, 0.88, 1.0);
  const HOT_VIOLET = new Color(0.74, 0.58, 1.0);
  const CORE_HOT = new Color(0.86, 0.94, 1.0);
  const DEEP = new Color(0.16, 0.3, 0.85);
  const DIM_EDGE = new Color(0.028, 0.07, 0.24);
  const HOT_EDGE = new Color(0.5, 0.85, 1.0);
  const HOT_EDGE_V = new Color(0.72, 0.6, 1.0);
  const c = new Color();
  const m4 = new Matrix4();

  /** activation of a node (or edge end) for wave time w: rises when the wave arrives, peaks, then relaxes to its settled level */
  const activation = (arrival: number, settle: number, w: number): number => {
    const rise = smooth(clamp01((w - arrival) / 0.16));
    const relax = smooth(clamp01((w - arrival - 0.14) / 0.3));
    return rise * (settle + (1 - settle) * (1 - relax));
  };

  function setState(learn: number, reset: number): void {
    const keep = 1 - clamp01(reset);
    const coreBoost = smooth(clamp01((learn - 0.42) / 0.34)) * keep;
    let total = 0;
    for (let i = 0; i < N; i++) {
      const n = nodes[i];
      let a = activation(n.arrival, n.settle, learn) * keep;
      if (i === coreIndex) a = Math.max(a, 0.28 * keep * smooth(clamp01((learn - 0.3) / 0.2)));
      total += a;
      // depth: the back of the network is dimmer, smaller and bluer than the front
      const bright = 0.4 + 0.6 * n.depth;
      const hot = i === coreIndex ? CORE_HOT : n.violet ? HOT_VIOLET : HOT_BLUE;
      c.copy(DIM_NODE).lerp(hot, Math.min(1, a * 1.05)).lerp(DEEP, (1 - n.depth) * 0.35).multiplyScalar(0.55 + 0.45 * bright);
      spheres.setColorAt(i, c);
      const r = (i === coreIndex ? 0.1 : LEVEL_RADIUS[n.level]) * (0.55 + 0.85 * n.depth);
      const grow = 1 + 0.35 * a + (i === coreIndex ? 0.7 * coreBoost : 0);
      m4.makeScale(r * grow, r * grow, r * grow);
      m4.setPosition(n.p);
      spheres.setMatrixAt(i, m4);
      // glow: only what is lit glows, weighted by importance and depth (the core has its own halos)
      const dormant = 0.16 * n.depth * n.depth; // (not scaled by `keep`: the reset must end exactly where the cycle starts)
      // front nodes catch a little light even when nothing is happening
      const g = i === coreIndex ? 0.35 * a : LEVEL_GLOW[n.level] * Math.max(a, dormant) * (0.45 + 0.75 * bright);
      const tint = i === coreIndex ? hot : c.copy(hot).lerp(DEEP, (1 - n.depth) * 0.4);
      glowCol[i * 3] = tint.r * g;
      glowCol[i * 3 + 1] = tint.g * g;
      glowCol[i * 3 + 2] = tint.b * g;
    }
    spheres.instanceMatrix.needsUpdate = true;
    if (spheres.instanceColor) spheres.instanceColor.needsUpdate = true;
    glowColAttr.needsUpdate = true;

    // the energy core: layered halos build up with the wave; a faint inner presence remains while dormant
    const arrive = smooth(clamp01((learn - 0.25) / 0.25));
    // each has a small dormant baseline that does not depend on `keep`, so the end of a reset equals the start of the next cycle
    haloInner.mat.opacity = 0.05 + keep * (0.07 * arrive + 0.62 * coreBoost * (0.4 + 0.6 * arrive));
    haloMid.mat.opacity = 0.02 + keep * (0.05 * arrive + 0.42 * coreBoost * (0.3 + 0.7 * arrive));
    haloOuter.mat.opacity = 0.01 + keep * (0.02 + 0.22 * coreBoost);
    ringMat.opacity = 0.55 * coreBoost;
    const ringScale = 1 + 0.5 * coreBoost;
    energyRing.scale.set(ringScale, ringScale, 1);
    innerGlowMat.opacity = 0.16 + 0.3 * (total / N) * 2;

    for (let i = 0; i < E; i++) {
      const e = edges[i];
      const na = nodes[e.a];
      const nb = nodes[e.b];
      const hotE = na.violet || nb.violet ? HOT_EDGE_V : HOT_EDGE;
      const fa = activation(na.arrival, e.settle, learn) * keep * e.peak;
      // the far end lights as the signal reaches it, so the line reads as travelling
      const fb = activation(nb.arrival, e.settle, learn) * keep * e.peak;
      const da = 0.45 + 0.55 * na.depth;
      const db = 0.45 + 0.55 * nb.depth;
      c.copy(DIM_EDGE).multiplyScalar(da).lerp(hotE, fa * da);
      lineCol[i * 6] = c.r;
      lineCol[i * 6 + 1] = c.g;
      lineCol[i * 6 + 2] = c.b;
      c.copy(DIM_EDGE).multiplyScalar(db).lerp(hotE, fb * db);
      lineCol[i * 6 + 3] = c.r;
      lineCol[i * 6 + 4] = c.g;
      lineCol[i * 6 + 5] = c.b;
    }
    lineColAttr.needsUpdate = true;

    routeIdx.forEach((ei, j) => {
      const e = edges[ei];
      const na = nodes[e.a];
      const nb = nodes[e.b];
      const hotE = na.violet || nb.violet ? HOT_EDGE_V : HOT_EDGE;
      const fa = activation(na.arrival, e.settle, learn) * keep * (0.45 + 0.55 * na.depth);
      const fb = activation(nb.arrival, e.settle, learn) * keep * (0.45 + 0.55 * nb.depth);
      routeCol[j * 6] = hotE.r * fa;
      routeCol[j * 6 + 1] = hotE.g * fa;
      routeCol[j * 6 + 2] = hotE.b * fa;
      routeCol[j * 6 + 3] = hotE.r * fb;
      routeCol[j * 6 + 4] = hotE.g * fb;
      routeCol[j * 6 + 5] = hotE.b * fb;
    });
    routeColAttr.needsUpdate = true;
  }
  setState(0, 0);

  return { group, setState, owned };
}
