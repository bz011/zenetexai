/**
 * Procedural, neural-network-inspired brain shape: a cloud of nodes sampled
 * over two folded hemispheres, a cerebellum and a brainstem, joined to their
 * nearest neighbours. No external 3D model or texture is used, so there is no
 * asset licence to track. Fully deterministic (seeded PRNG) so the server-
 * rendered static poster and the client-side 3D scene are always identical.
 */

export interface BrainNetwork {
  /** x,y,z per node, normalised so the shape fits a unit sphere. */
  positions: Float32Array;
  /** Pairs of node indices, one pair per line. */
  edges: Uint32Array;
  /** Node height 0 (bottom) .. 1 (top), for colouring. */
  heights: Float32Array;
}

function mulberry32(seed: number): () => number {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(rand: () => number): number {
  const u = Math.max(rand(), 1e-9);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
}

function unitDirection(rand: () => number): [number, number, number] {
  const x = gaussian(rand), y = gaussian(rand), z = gaussian(rand);
  const n = Math.hypot(x, y, z) || 1;
  return [x / n, y / n, z / n];
}

export function buildBrainNetwork(count = 900, seed = 7, neighbours = 3): BrainNetwork {
  const rand = mulberry32(seed);
  const raw: number[] = [];

  for (let i = 0; i < count; i++) {
    const region = rand();
    let x: number, y: number, z: number;

    if (region < 0.09) {
      // Cerebellum: small ellipsoid at the back and underneath.
      const [dx, dy, dz] = unitDirection(rand);
      const s = rand() < 0.75 ? 0.95 + 0.1 * rand() : 0.4 + 0.4 * rand();
      x = dx * 0.5 * s;
      y = -0.55 + dy * 0.22 * s;
      z = -0.7 + dz * 0.32 * s;
    } else if (region < 0.12) {
      // Brainstem: a short column under the centre.
      const angle = rand() * Math.PI * 2;
      const r = 0.08 * Math.sqrt(rand());
      x = Math.cos(angle) * r;
      y = -1.0 + rand() * 0.5;
      z = -0.2 + Math.sin(angle) * r;
    } else {
      // Cerebral hemispheres: folded ellipsoids with a flat medial wall.
      const side = rand() < 0.5 ? -1 : 1;
      let [dx, dy, dz] = unitDirection(rand);
      if (dx * side < 0) dx *= 0.22;
      const surface = rand() < 0.8;
      const s = surface ? 0.96 + 0.08 * rand() : 0.45 + 0.4 * rand();
      const fold =
        1 +
        0.07 * Math.sin(9 * dz + 4 * dy) * Math.cos(7 * dx * side + 3 * dy) +
        0.04 * Math.sin(13 * dy + 5 * dz);
      x = side * 0.3 + dx * 0.56 * s * fold;
      y = 0.05 + dy * 0.62 * s * fold;
      z = dz * 0.98 * s * fold;
      if (y < -0.3) y = -0.3 + (y + 0.3) * 0.6; // flatter underside
      if (z < 0) {
        const taper = 1 - 0.12 * -z;
        x *= taper;
        y = 0.05 + (y - 0.05) * taper;
      }
    }
    raw.push(x, y, z);
  }

  // Normalise to a unit sphere.
  let maxR = 0;
  for (let i = 0; i < raw.length; i += 3) maxR = Math.max(maxR, Math.hypot(raw[i], raw[i + 1], raw[i + 2]));
  const positions = new Float32Array(raw.length);
  for (let i = 0; i < raw.length; i++) positions[i] = raw[i] / (maxR || 1);

  let minY = Infinity, maxY = -Infinity;
  for (let i = 1; i < positions.length; i += 3) {
    minY = Math.min(minY, positions[i]);
    maxY = Math.max(maxY, positions[i]);
  }
  const heights = new Float32Array(count);
  for (let i = 0; i < count; i++) heights[i] = (positions[i * 3 + 1] - minY) / (maxY - minY || 1);

  // Nearest-neighbour edges via a spatial hash.
  const cell = 0.2;
  const maxDist = 0.27;
  const grid = new Map<string, number[]>();
  const key = (cx: number, cy: number, cz: number) => `${cx},${cy},${cz}`;
  for (let i = 0; i < count; i++) {
    const k = key(Math.floor(positions[i * 3] / cell), Math.floor(positions[i * 3 + 1] / cell), Math.floor(positions[i * 3 + 2] / cell));
    const bucket = grid.get(k);
    if (bucket) bucket.push(i);
    else grid.set(k, [i]);
  }
  const seen = new Set<number>();
  const edges: number[] = [];
  for (let i = 0; i < count; i++) {
    const cx = Math.floor(positions[i * 3] / cell), cy = Math.floor(positions[i * 3 + 1] / cell), cz = Math.floor(positions[i * 3 + 2] / cell);
    const near: { j: number; d: number }[] = [];
    for (let ox = -1; ox <= 1; ox++) for (let oy = -1; oy <= 1; oy++) for (let oz = -1; oz <= 1; oz++) {
      const bucket = grid.get(key(cx + ox, cy + oy, cz + oz));
      if (!bucket) continue;
      for (const j of bucket) {
        if (j === i) continue;
        const d = Math.hypot(positions[i * 3] - positions[j * 3], positions[i * 3 + 1] - positions[j * 3 + 1], positions[i * 3 + 2] - positions[j * 3 + 2]);
        if (d < maxDist) near.push({ j, d });
      }
    }
    near.sort((a, b) => a.d - b.d);
    for (const { j } of near.slice(0, neighbours)) {
      const a = Math.min(i, j), b = Math.max(i, j);
      const id = a * count + b;
      if (!seen.has(id)) {
        seen.add(id);
        edges.push(a, b);
      }
    }
  }

  return { positions, edges: new Uint32Array(edges), heights };
}
