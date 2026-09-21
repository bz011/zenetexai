/**
 * Procedural brain surface for the hero scene, driven by a tileable "gyri"
 * height map (public/hero/gyri.png - a reaction-diffusion labyrinth pattern
 * generated offline for this project, so there is no external model or
 * licence). Two cerebral hemispheres separated by a narrow longitudinal
 * fissure, each with frontal fullness, an occipital taper, a temporal lobe
 * and a lateral fissure, plus a striated cerebellum and a brainstem. Pure
 * and deterministic: the same height field always yields the same mesh.
 *
 * The height field is sampled tri-planarly in object space; the GPU shader
 * samples the same map the same way for fine bump shading, so lighting and
 * silhouette agree.
 */

export interface HeightField {
  size: number;
  /** size*size values in 0..1 (1 = gyrus crest, 0 = sulcus floor), row-major, tileable. */
  data: Float32Array;
}

export interface BrainPart {
  positions: Float32Array;
  indices: Uint32Array;
  /** Per-vertex 0 (sulcus) .. 1 (crest). */
  folds: Float32Array;
}

export interface BrainMesh {
  hemispheres: BrainPart[];
  cerebellum: BrainPart;
  stem: BrainPart;
}

/** Object-space units per texture tile; the shader must use the same value. */
export const GYRI_TILE_SCALE = 0.21;
/** Radial displacement amplitude of the gyri (fraction of local radius). */
export const GYRI_AMPLITUDE = 0.1;

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function sampleField(field: HeightField, u: number, v: number): number {
  const n = field.size;
  const fu = ((u % 1) + 1) % 1 * n, fv = ((v % 1) + 1) % 1 * n;
  const x0 = Math.floor(fu), y0 = Math.floor(fv);
  const tx = fu - x0, ty = fv - y0;
  const x1 = (x0 + 1) % n, y1 = (y0 + 1) % n;
  const d = field.data;
  const a = d[y0 * n + x0], b = d[y0 * n + x1], c = d[y1 * n + x0], e = d[y1 * n + x1];
  return (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + e * tx) * ty;
}

/** Tri-planar sample: blends the three axis projections by the normal, exactly as the GPU shader does. */
export function sampleTriplanar(field: HeightField, x: number, y: number, z: number, nx: number, ny: number, nz: number): number {
  let wx = Math.abs(nx) ** 4, wy = Math.abs(ny) ** 4, wz = Math.abs(nz) ** 4;
  const sum = wx + wy + wz || 1;
  wx /= sum; wy /= sum; wz /= sum;
  const s = GYRI_TILE_SCALE;
  return sampleField(field, y * s, z * s) * wx + sampleField(field, x * s, z * s) * wy + sampleField(field, x * s, y * s) * wz;
}

// ── icosphere ───────────────────────────────────────────────────────────────

function icosphere(detail: number): { dirs: Float32Array; indices: Uint32Array } {
  const t = (1 + Math.sqrt(5)) / 2;
  const verts: number[] = [
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

function hemisphere(side: 1 | -1, detail: number, field: HeightField): BrainPart {
  const { dirs, indices } = icosphere(detail);
  const count = dirs.length / 3;
  const positions = new Float32Array(count * 3);
  const folds = new Float32Array(count);
  const R = { x: 0.6, y: 0.66, z: 1.0 };
  const cx = side * 0.28;
  const FISSURE = 0.045; // half-width of the longitudinal fissure

  for (let i = 0; i < count; i++) {
    const dx = dirs[i * 3], dy = dirs[i * 3 + 1], dz = dirs[i * 3 + 2];
    const lateral = dx * side;

    // Overall lobe proportions.
    let s = 1 + 0.06 * smooth(0.3, 0.95, dz); // frontal fullness
    let sy = 1;
    if (dy < -0.25) sy = 0.7 + 0.3 * smooth(-1, -0.25, dy); // flatter underside
    if (dz < -0.4) s *= 1 - 0.14 * smooth(-0.4, -1, dz) * smooth(-0.2, 0.6, dy); // occipital taper, top only
    if (dy > 0.5) s *= 1 - 0.03 * smooth(0.5, 1, dy); // slightly flattened crown

    // Temporal lobe: bulge low on the lateral surface, toward the front.
    const tx = side * 0.78, ty = -0.6, tz = 0.3, tn = Math.hypot(tx, ty, tz);
    const cosT = (dx * tx + dy * ty + dz * tz) / tn;
    s += 0.22 * Math.exp(-(1 - cosT) / 0.08) * smooth(0.05, 0.5, lateral);

    // Lateral (Sylvian) fissure: a groove sloping up toward the back.
    const lat = smooth(0.25, 0.7, lateral);
    const syl = Math.abs(dy - (0.05 - 0.28 * dz)) / 1.04;
    s -= 0.11 * Math.exp(-((syl / 0.055) ** 2)) * lat * smooth(-0.9, -0.1, dz) * smooth(0.9, 0.1, dz);

    let x = cx + dx * R.x * s;
    let y = 0.05 + dy * R.y * sy * s;
    let z = dz * R.z * s;
    // Rounded valley either side of the longitudinal fissure, so the two hemispheres read from above.
    y -= 0.075 * (1 - smooth(0.02, 0.32, lateral)) * smooth(-0.3, 0.5, dy);

    // Medial wall: everything past the fissure plane is folded flat onto it (soft-clamped).
    const m = side * x - FISSURE;
    const k = 0.09;
    const soft = m > k ? m : m < -k ? 0 : ((m + k) * (m + k)) / (4 * k);
    x = side * (FISSURE + soft);
    const onWall = 1 - smooth(-0.05, 0.12, m);

    // Gyri: tri-planar sample of the height map in normalised object space.
    let fold = sampleTriplanar(field, x, y, z, dx, dy, dz);
    fold = fold * (1 - onWall) + 0.7 * onWall; // medial wall stays smooth
    const disp = 1 + GYRI_AMPLITUDE * (fold - 0.7);
    positions[i * 3] = cx + (x - cx) * disp;
    positions[i * 3 + 1] = 0.05 + (y - 0.05) * disp;
    positions[i * 3 + 2] = z * disp;
    folds[i] = fold;
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
    const stripe = 0.5 + 0.5 * Math.sin(dy * 42 + dx * 2);
    const s = 1 - 0.03 * stripe;
    const flat = dy < 0 ? 0.75 : 1;
    positions[i * 3] = dx * 0.46 * s;
    positions[i * 3 + 1] = -0.5 + dy * 0.21 * flat * s;
    positions[i * 3 + 2] = -0.62 + dz * 0.3 * s;
    folds[i] = 0.3 + 0.5 * (1 - stripe);
  }
  return { positions, indices, folds };
}

function stem(rings = 28, segments = 20): BrainPart {
  const positions = new Float32Array((rings + 1) * (segments + 1) * 3);
  const folds = new Float32Array((rings + 1) * (segments + 1)).fill(0.55);
  const indices: number[] = [];
  for (let r = 0; r <= rings; r++) {
    const t = r / rings;
    const y = -0.38 - t * 0.5;
    const radius = 0.13 - 0.045 * t + 0.02 * Math.sin(t * Math.PI);
    const z = -0.12 - t * 0.12;
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
export function buildBrainMesh(field: HeightField, detail = 6): BrainMesh {
  return {
    hemispheres: [hemisphere(-1, detail, field), hemisphere(1, detail, field)],
    cerebellum: cerebellum(Math.max(3, detail - 2)),
    stem: stem(),
  };
}

/** A synthetic, tileable labyrinth-like field for tests and previews (the real one is the shipped PNG). */
export function syntheticField(size = 64): HeightField {
  const data = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x / size) * Math.PI * 2, v = (y / size) * Math.PI * 2;
      const w = Math.sin(3 * u + 2 * Math.sin(2 * v)) * Math.cos(2 * v + Math.sin(3 * u));
      data[y * size + x] = 0.12 + 0.88 * Math.sqrt(Math.min(1, Math.max(0, (w + 0.35) / 0.9)));
    }
  }
  return { size, data };
}
