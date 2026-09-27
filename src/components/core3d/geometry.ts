import {
  BoxGeometry,
  BufferGeometry,
  CatmullRomCurve3,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Path,
  Shape,
  Vector3,
} from "three";

/**
 * Procedural geometry helpers for the Intelligence Core. Coordinates used by
 * every variant: flow runs along +X (inputs at -X, outputs at +X), Y is up,
 * and Z is the depth of the object toward the camera.
 */

/** A rectangle with chamfered corners as a point list, centred on (cx, cy). */
function chamferPoints(w: number, h: number, c: number, cx = 0, cy = 0): [number, number][] {
  const x = w / 2;
  const y = h / 2;
  const k = Math.min(c, x, y);
  return [
    [-x + k, -y], [x - k, -y], [x, -y + k], [x, y - k],
    [x - k, y], [-x + k, y], [-x, y - k], [-x, -y + k],
  ].map(([px, py]) => [px + cx, py + cy] as [number, number]);
}

export function chamferShape(w: number, h: number, c: number): Shape {
  const s = new Shape();
  chamferPoints(w, h, c).forEach(([x, y], i) => (i === 0 ? s.moveTo(x, y) : s.lineTo(x, y)));
  s.closePath();
  return s;
}

export function chamferHole(w: number, h: number, c: number, cx = 0, cy = 0): Path {
  const p = new Path();
  chamferPoints(w, h, c, cx, cy).forEach(([x, y], i) => (i === 0 ? p.moveTo(x, y) : p.lineTo(x, y)));
  p.closePath();
  return p;
}

/**
 * A flat plate that is thin along world X. `shape` is drawn in (z, y): its
 * local x becomes world +Z, its local y stays world Y. The plate is centred on
 * the origin along X so callers position it with mesh.position.x.
 */
export function plateGeometry(shape: Shape, thickness: number, bevel = 0.035): ExtrudeGeometry {
  const g = new ExtrudeGeometry(shape, {
    depth: thickness - bevel * 2,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelOffset: -bevel * 0.5,
    bevelSegments: 2,
    curveSegments: 1,
  });
  g.translate(0, 0, -thickness / 2 + bevel);
  g.rotateY(-Math.PI / 2); // local x -> world +Z, local z -> world -X
  return g;
}

/**
 * A prism whose cross-section is `shape` (drawn in (z, y)) extruded along X
 * for `length`. Used by the modular variant. Centred along X.
 */
export function prismGeometry(shape: Shape, length: number, bevel = 0.03): ExtrudeGeometry {
  return plateGeometry(shape, length, bevel);
}

export function box(w: number, h: number, d: number): BoxGeometry {
  return new BoxGeometry(w, h, d);
}

export type ColorAt = (u: number) => [number, number, number];

/**
 * A flat tape (rectangular section) following a smooth curve through `points`.
 * Its sides stay horizontal, so it reads as a lit strip in the flow, not a
 * cable. Vertex colours give the blue -> cyan progression along the path.
 */
export function tapeGeometry(points: Vector3[], width: number, height: number, colorAt: ColorAt, samples = 72): BufferGeometry {
  const curve = new CatmullRomCurve3(points, false, "centripetal", 0.5);
  const pos: number[] = [];
  const col: number[] = [];
  const idx: number[] = [];
  const up = new Vector3(0, 1, 0);
  const t = new Vector3();
  const s = new Vector3();
  const u = new Vector3();
  const p = new Vector3();
  for (let i = 0; i <= samples; i++) {
    const k = i / samples;
    curve.getPointAt(k, p);
    curve.getTangentAt(k, t);
    s.crossVectors(up, t).normalize();
    u.crossVectors(t, s).normalize();
    const hw = width / 2;
    const hh = height / 2;
    const corners: [number, number][] = [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]];
    const [r, g, b] = colorAt(k);
    for (const [a, c] of corners) {
      pos.push(p.x + s.x * a + u.x * c, p.y + s.y * a + u.y * c, p.z + s.z * a + u.z * c);
      col.push(r, g, b);
    }
  }
  for (let i = 0; i < samples; i++) {
    const a = i * 4;
    const b = a + 4;
    for (let f = 0; f < 4; f++) {
      const f2 = (f + 1) % 4;
      idx.push(a + f, a + f2, b + f2, a + f, b + f2, b + f);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  return g;
}

/** Straight-ish tape between two x positions with an optional lateral offset ease. */
export function railPoints(x0: number, x1: number, z0: number, z1: number, y0: number, y1: number, ease = 0.5): Vector3[] {
  const xm = x0 + (x1 - x0) * ease;
  return [
    new Vector3(x0, y0, z0),
    new Vector3(x0 + (xm - x0) * 0.55, y0, z0),
    new Vector3(xm, (y0 + y1) / 2, (z0 + z1) / 2),
    new Vector3(xm + (x1 - xm) * 0.45, y1, z1),
    new Vector3(x1, y1, z1),
  ];
}

/** Blue at the input end, cyan at the output end. */
export const BLUE: [number, number, number] = [0.145, 0.388, 0.922]; // #2563EB
export const CYAN: [number, number, number] = [0.133, 0.827, 0.933]; // #22D3EE
export function mix(a: [number, number, number], b: [number, number, number], k: number): [number, number, number] {
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
}

/** A rectangular frame (outline) in (z, y): outer z0..z1 x y0..y1 with wall thickness t. */
export function rectFrame(z0: number, z1: number, y0: number, y1: number, t: number): Shape {
  const s = new Shape();
  s.moveTo(z0, y0);
  s.lineTo(z1, y0);
  s.lineTo(z1, y1);
  s.lineTo(z0, y1);
  s.closePath();
  const h = new Path();
  h.moveTo(z0 + t, y0 + t);
  h.lineTo(z1 - t, y0 + t);
  h.lineTo(z1 - t, y1 - t);
  h.lineTo(z0 + t, y1 - t);
  h.closePath();
  s.holes.push(h);
  return s;
}
