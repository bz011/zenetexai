import { BufferGeometry, Float32BufferAttribute, Group, LineBasicMaterial, LineSegments, Mesh, PointLight, Vector3, type Material } from "three";
import { BLUE, CYAN, box, railPoints, tapeGeometry } from "../geometry";
import type { CoreKit } from "../materials";

const fade = (c: [number, number, number], k: number): [number, number, number] => [c[0] * k, c[1] * k, c[2] * k];

/** Shorthand: mesh with shadows on. */
export function mesh(geo: BufferGeometry, mat: Material, x = 0, y = 0, z = 0, cast = true): Mesh {
  const m = new Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = cast;
  m.receiveShadow = true;
  return m;
}

export function cyanLight(x: number, y: number, z: number, intensity = 6, distance = 3.4): PointLight {
  const l = new PointLight(0x38d6ee, intensity, distance, 2);
  l.position.set(x, y, z);
  return l;
}

export const IN_Y = [0.95, 0.32, -0.32, -0.95];
export const IN_Z = [-1.55, -0.52, 0.52, 1.55];

/**
 * The four input tapes and four output tapes, converging on / leaving from the
 * central channel. They are lit strips (blue at the input, cyan at the output);
 * what they carry is named by HTML labels attached to the returned anchors.
 */
export function ioRails(
  group: Group,
  kit: CoreKit,
  o: {
    xOuter: number;
    xOuterOut?: number;
    xInner: number;
    spread?: number;
    width?: number;
    inCenter?: { z: number; y: number };
    outCenter?: { z: number; y: number };
  },
): Record<string, Vector3> {
  const width = o.width ?? 0.1;
  const xOut = o.xOuterOut ?? o.xOuter;
  const spread = o.spread ?? 1;
  const anchors: Record<string, Vector3> = {};
  const merge = [-0.21, -0.07, 0.07, 0.21].map((v) => v * (width / 0.14));
  const ic = o.inCenter ?? { z: 0, y: 0 };
  const oc = o.outCenter ?? { z: 0, y: 0 };
  for (let i = 0; i < 4; i++) {
    const zIn = IN_Z[i] * spread;
    const yIn = IN_Y[i] * spread;
    const inPts = railPoints(-o.xOuter, -o.xInner, zIn, ic.z + merge[i], yIn, ic.y, 0.62);
    const g1 = tapeGeometry(inPts, width, 0.045, (u) => fade(BLUE, 0.3 + 0.7 * u));
    group.add(mesh(g1, kit.lightVC, 0, 0, 0, false));
    const outPts = railPoints(o.xInner, xOut, oc.z + merge[i], zIn, oc.y, yIn, 0.38);
    const g2 = tapeGeometry(outPts, width, 0.045, (u) => fade(CYAN, 1 - 0.4 * u));
    group.add(mesh(g2, kit.lightVC, 0, 0, 0, false));
    // small terminal block at each free end
    group.add(mesh(box(0.2, 0.16, 0.24), kit.graphite, -o.xOuter - 0.1, yIn, zIn));
    group.add(mesh(box(0.2, 0.16, 0.24), kit.graphite, xOut + 0.1, yIn, zIn));
    anchors[`in-${i}`] = new Vector3(-o.xOuter - 0.25, yIn, zIn);
    anchors[`out-${i}`] = new Vector3(xOut + 0.25, yIn, zIn);
  }
  return anchors;
}

/** Row of audit ticks: one more tick each stage, so the record visibly accumulates. */
export function auditTicks(group: Group, kit: CoreKit, xs: number[], z: number, y0: number, pitch = 0.16): void {
  xs.forEach((x, i) => {
    for (let k = 0; k <= i; k++) {
      group.add(mesh(box(0.5, 0.05, 0.02), kit.lightCyan, x, y0 + k * pitch, z, false));
    }
  });
}

export interface OpeningRect {
  x: number;
  z0: number;
  z1: number;
  y0: number;
  y1: number;
}

/**
 * A faint volume of light between two openings (the signal path between two
 * stages), with its edges drawn as hairlines. Hard-edged and low opacity: it
 * shows the route, it is not a glow.
 */
export function loft(a: OpeningRect, b: OpeningRect, kit: CoreKit, lineMat: LineBasicMaterial): Group {
  const g = new Group();
  const c: [number, number, number][] = [
    [a.x, a.y0, a.z0], [a.x, a.y0, a.z1], [a.x, a.y1, a.z1], [a.x, a.y1, a.z0],
    [b.x, b.y0, b.z0], [b.x, b.y0, b.z1], [b.x, b.y1, b.z1], [b.x, b.y1, b.z0],
  ];
  const pos = c.flat();
  const quads = [[0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]];
  const idx: number[] = [];
  quads.forEach(([p, q, r, t]) => idx.push(p, q, r, p, r, t));
  const geo = new BufferGeometry();
  geo.setAttribute("position", new Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  g.add(new Mesh(geo, kit.beam));
  const edges: number[] = [];
  for (let i = 0; i < 4; i++) {
    edges.push(...c[i], ...c[i + 4]);
  }
  const eg = new BufferGeometry();
  eg.setAttribute("position", new Float32BufferAttribute(edges, 3));
  g.add(new LineSegments(eg, lineMat));
  return g;
}
