import { ExtrudeGeometry, Float32BufferAttribute, ShapeGeometry, Shape, type BufferGeometry } from "three";

/** A rounded rectangle centred on the origin, in (x, y). */
export function roundedRectShape(w: number, h: number, r: number): Shape {
  const x = -w / 2;
  const y = -h / 2;
  const k = Math.min(r, w / 2, h / 2);
  const s = new Shape();
  s.moveTo(x + k, y);
  s.lineTo(x + w - k, y);
  s.absarc(x + w - k, y + k, k, -Math.PI / 2, 0, false);
  s.lineTo(x + w, y + h - k);
  s.absarc(x + w - k, y + h - k, k, 0, Math.PI / 2, false);
  s.lineTo(x + k, y + h);
  s.absarc(x + k, y + h - k, k, Math.PI / 2, Math.PI, false);
  s.lineTo(x, y + k);
  s.absarc(x + k, y + k, k, Math.PI, Math.PI * 1.5, false);
  return s;
}

/** A flat rounded-rectangle face with 0..1 UVs, for canvas textures. */
export function roundedPlane(w: number, h: number, r: number): BufferGeometry {
  const g = new ShapeGeometry(roundedRectShape(w, h, r), 20);
  const pos = g.attributes.position;
  const uv: number[] = [];
  for (let i = 0; i < pos.count; i++) uv.push(pos.getX(i) / w + 0.5, pos.getY(i) / h + 0.5);
  g.setAttribute("uv", new Float32BufferAttribute(uv, 2));
  return g;
}

/** A rounded slab, `depth` thick along Z (front face at +depth/2), bevelled edges, centred. */
export function roundedSlab(w: number, h: number, depth: number, radius: number, bevel = 0.05): ExtrudeGeometry {
  const g = new ExtrudeGeometry(roundedRectShape(w - bevel * 2, h - bevel * 2, Math.max(0.01, radius - bevel)), {
    depth: depth - bevel * 2,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 5,
    curveSegments: 28,
  });
  g.translate(0, 0, -(depth - bevel * 2) / 2);
  return g;
}
