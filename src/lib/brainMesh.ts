/**
 * Procedural brain surface for the hero scene: two folded cerebral hemispheres
 * (lateral fissure, temporal lobes, sulci carved along noise contours), a
 * striated cerebellum and a brainstem. Pure and deterministic (seeded noise,
 * no three.js, no external model or texture), so it is testable and there is
 * no asset licence to track. Each part returns positions, triangle indices and
 * a per-vertex `fold` value (0 = deep in a sulcus, 1 = crest of a gyrus) that
 * the shader uses to light the surface.
 */

export interface BrainPart {
  positions: Float32Array;
  indices: Uint32Array;
  folds: Float32Array;
}

export interface BrainMesh {
  hemispheres: BrainPart[];
  cerebellum: BrainPart;
  stem: BrainPart;
}

// ── seeded value helpers ────────────────────────────────────────────────────

function mulberry32(seed: number): () => number {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Improved Perlin noise, permutation table seeded for determinism. Output about -1..1. */
function makeNoise(seed: number) {
  const rand = mulberry32(seed);
  const perm = new Uint8Array(512);
  const base = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [base[i], base[j]] = [base[j], base[i]];
  }
  for (let i = 0; i < 512; i++) perm[i] = base[i & 255];
  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  const lerp = (a: number, b: number, t: number) => a + t * (b - a);
  const grad = (h: number, x: number, y: number, z: number) => {
    const hh = h & 15;
    const u = hh < 8 ? x : y;
    const v = hh < 4 ? y : hh === 12 || hh === 14 ? x : z;
    return ((hh & 1) === 0 ? u : -u) + ((hh & 2) === 0 ? v : -v);
  };
  return (x: number, y: number, z: number): number => {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255;
    x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
    const u = fade(x), v = fade(y), w = fade(z);
    const A = perm[X] + Y, AA = perm[A] + Z, AB = perm[A + 1] + Z;
    const B = perm[X + 1] + Y, BA = perm[B] + Z, BB = perm[B + 1] + Z;
    return lerp(
      lerp(lerp(grad(perm[AA], x, y, z), grad(perm[BA], x - 1, y, z), u), lerp(grad(perm[AB], x, y - 1, z), grad(perm[BB], x - 1, y - 1, z), u), v),
      lerp(lerp(grad(perm[AA + 1], x, y, z - 1), grad(perm[BA + 1], x - 1, y, z - 1), u), lerp(grad(perm[AB + 1], x, y - 1, z - 1), grad(perm[BB + 1], x - 1, y - 1, z - 1), u), v),
      w
    );
  };
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// ── icosphere ───────────────────────────────────────────────────────────────

function icosphere(detail: number): { dirs: Float32Array; indices: Uint32Array } {
  const t = (1 + Math.sqrt(5)) / 2;
  let verts: number[] = [
    -1, t, 0, 1, t, 0, -1, -t, 0, 1, -t, 0, 0, -1, t, 0, 1, t, 0, -1, -t, 0, 1, -t,
    t, 0, -1, t, 0, 1, -t, 0, -1, -t, 0, 1,
  ];
  let faces: number[] = [
    0, 11, 5, 0, 5, 1, 0, 1, 7, 0, 7, 10, 0, 10, 11, 1, 5, 9, 5, 11, 4, 11, 10, 2, 10, 7, 6, 7, 1, 8,
    3, 9, 4, 3, 4, 2, 3, 2, 6, 3, 6, 8, 3, 8, 9, 4, 9, 5, 2, 4, 11, 6, 2, 10, 8, 6, 7, 9, 8, 1,
  ];
  const norm = (i: number) => {
    const n = Math.hypot(verts[i], verts[i + 1], verts[i + 2]);
    verts[i] /= n; verts[i + 1] /= n; verts[i + 2] /= n;
  };
  for (let i = 0; i < verts.length; i += 3) norm(i);
  for (let d = 0; d < detail; d++) {
    const cache = new Map<number, number>();
    const mid = (a: number, b: number) => {
      const key = a < b ? a * 1000003 + b : b * 1000003 + a;
      const hit = cache.get(key);
      if (hit !== undefined) return hit;
      const idx = verts.length / 3;
      verts.push((verts[a * 3] + verts[b * 3]) / 2, (verts[a * 3 + 1] + verts[b * 3 + 1]) / 2, (verts[a * 3 + 2] + verts[b * 3 + 2]) / 2);
      norm(idx * 3);
      cache.set(key, idx);
      return idx;
    };
    const next: number[] = [];
    for (let f = 0; f < faces.length; f += 3) {
      const a = faces[f], b = faces[f + 1], c = faces[f + 2];
      const ab = mid(a, b), bc = mid(b, c), ca = mid(c, a);
      next.push(a, ab, ca, b, bc, ab, c, ca, bc, ab, bc, ca);
    }
    faces = next;
  }
  return { dirs: new Float32Array(verts), indices: new Uint32Array(faces) };
}

// ── cerebral hemisphere ─────────────────────────────────────────────────────

function hemisphere(side: 1 | -1, detail: number, noise: (x: number, y: number, z: number) => number): BrainPart {
  const { dirs, indices } = icosphere(detail);
  const count = dirs.length / 3;
  const positions = new Float32Array(count * 3);
  const folds = new Float32Array(count);
  const R = { x: 0.52, y: 0.6, z: 0.97 };
  const centre = { x: side * 0.33, y: 0.06 };
  const off = side * 0.37; // small left/right asymmetry, as in a real brain

  for (let i = 0; i < count; i++) {
    let dx = dirs[i * 3], dy = dirs[i * 3 + 1], dz = dirs[i * 3 + 2];
    const lateral = dx * side; // > 0 on the outer surface, < 0 on the medial wall
    if (lateral < 0) dx *= 0.14; // flat medial wall

    // Overall lobe shape.
    let sy = 1;
    if (dy < -0.2) sy = 0.74 + 0.26 * smooth(-1, -0.2, dy); // gently flattened underside
    if (dz < -0.35) sy *= 1 - 0.2 * smooth(-0.35, -0.95, dz); // occipital taper
    let s = 1 + 0.05 * smooth(0.35, 0.95, dz); // frontal fullness

    // Temporal lobe: a bulge low on the lateral surface, toward the front.
    const tx = side * 0.8, ty = -0.55, tz = 0.32, tn = Math.hypot(tx, ty, tz);
    const cosT = (dx * tx + dy * ty + dz * tz) / tn;
    s += 0.24 * Math.exp(-(1 - cosT) / 0.075) * smooth(0.1, 0.5, lateral);

    // Lateral (Sylvian) fissure and central sulcus.
    const lat = smooth(0.28, 0.7, lateral);
    const sylvian = Math.abs(dy - (0.13 - 0.3 * dz)) / 1.044;
    s -= 0.12 * Math.exp(-((sylvian / 0.05) ** 2)) * lat * smooth(-0.55, 0.05, -dz + 0.5);
    const central = Math.abs(dz - (0.1 - 0.24 * (dy - 0.3))) / 1.03;
    s -= 0.04 * Math.exp(-((central / 0.045) ** 2)) * smooth(0.15, 0.55, dy) * smooth(0.0, 0.4, lateral);

    // Gyri: sulci are the zero-contours of a domain-warped noise field.
    const px = dx * 1.6 + off, py = dy * 1.6, pz = dz * 1.6;
    const wx = px + 0.55 * noise(px * 1.3 + 7.1, py * 1.3, pz * 1.3);
    const wy = py + 0.55 * noise(px * 1.3, py * 1.3 + 3.7, pz * 1.3);
    const wz = pz + 0.55 * noise(px * 1.3, py * 1.3, pz * 1.3 + 9.3);
    const n1 = noise(wx * 2.7, wy * 2.7, wz * 2.7);
    const n2 = noise(wx * 5.8 + 11.3, wy * 5.8, wz * 5.8);
    const sulcus1 = Math.exp(-((n1 / 0.11) ** 2));
    const sulcus2 = Math.exp(-((n2 / 0.14) ** 2)) * 0.55;
    const foldWeight = smooth(0.02, 0.32, lateral); // keep the medial wall smooth
    const sulcus = Math.min(1, sulcus1 + sulcus2) * foldWeight;
    s *= 1 - 0.085 * sulcus;

    positions[i * 3] = centre.x + dx * R.x * s;
    positions[i * 3 + 1] = centre.y + dy * R.y * sy * s;
    positions[i * 3 + 2] = dz * R.z * s;
    folds[i] = 1 - sulcus;
  }
  return { positions, indices, folds };
}

// ── cerebellum (fine parallel folia) and brainstem ──────────────────────────

function cerebellum(detail: number): BrainPart {
  const { dirs, indices } = icosphere(detail);
  const count = dirs.length / 3;
  const positions = new Float32Array(count * 3);
  const folds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const dx = dirs[i * 3], dy = dirs[i * 3 + 1], dz = dirs[i * 3 + 2];
    const y0 = -0.46 + dy * 0.2;
    const stripe = 0.5 + 0.5 * Math.sin(y0 * 78 + dx * 1.5);
    const s = 1 - 0.028 * stripe;
    const flat = dy < 0 ? 0.7 : 1;
    positions[i * 3] = dx * 0.4 * s;
    positions[i * 3 + 1] = -0.46 + dy * 0.2 * flat * s;
    positions[i * 3 + 2] = -0.68 + dz * 0.28 * s;
    folds[i] = 0.25 + 0.4 * (1 - stripe);
  }
  return { positions, indices, folds };
}

function stem(rings = 28, segments = 20): BrainPart {
  const positions = new Float32Array((rings + 1) * (segments + 1) * 3);
  const folds = new Float32Array((rings + 1) * (segments + 1)).fill(0.5);
  const indices: number[] = [];
  for (let r = 0; r <= rings; r++) {
    const t = r / rings;
    const y = -0.4 - t * 0.46;
    const radius = 0.115 - 0.04 * t + 0.02 * Math.sin(t * Math.PI);
    const z = -0.14 - t * 0.1;
    for (let s = 0; s <= segments; s++) {
      const a = (s / segments) * Math.PI * 2;
      const idx = (r * (segments + 1) + s) * 3;
      positions[idx] = Math.cos(a) * radius;
      positions[idx + 1] = y;
      positions[idx + 2] = z + Math.sin(a) * radius;
    }
  }
  for (let r = 0; r < rings; r++) {
    for (let s = 0; s < segments; s++) {
      const a = r * (segments + 1) + s, b = a + segments + 1;
      indices.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  return { positions, indices: new Uint32Array(indices), folds };
}

/** detail 6 is the hero quality (about 41k vertices per hemisphere); lower values are for tests and previews. */
export function buildBrainMesh(detail = 6, seed = 11): BrainMesh {
  const noise = makeNoise(seed);
  return {
    hemispheres: [hemisphere(-1, detail, noise), hemisphere(1, detail, noise)],
    cerebellum: cerebellum(Math.max(3, detail - 2)),
    stem: stem(),
  };
}
