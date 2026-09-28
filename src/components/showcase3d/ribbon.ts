import { AdditiveBlending, Mesh, MeshBasicMaterial, Vector3 } from "three";
import { mix, railPoints, tapeGeometry, type ColorAt } from "../core3d/geometry";

/**
 * Static "data flowing" trails between a card and the phone: three layered
 * tapes (already-proven geometry from the Intelligence Core look-dev) of
 * decreasing width and increasing opacity, additively blended, so the curve
 * reads as a soft glow rather than a hard flat ribbon. No new shader, no new
 * UV/alpha-map machinery - reuses existing engineering. Not animated yet.
 */
/** The same curve control points `glowTrail` builds its tapes from - shared so a travelling pulse can ride exactly the visible path. */
export function trailPoints(a: Vector3, b: Vector3): Vector3[] {
  const mid = a.clone().lerp(b, 0.5);
  mid.z -= 2.1; // arc behind the hero object, never across its face
  return [a, a.clone().lerp(mid, 0.35), mid, b.clone().lerp(mid, 0.35), b];
}

/** `strength` scales the whole trail's brightness (1 = as authored). */
export function glowTrail(a: Vector3, b: Vector3, colorAt: ColorAt, baseWidth = 0.14, strength = 1): Mesh[] {
  const points = trailPoints(a, b);
  const layers: [number, number][] = [
    [1, 0.1],
    [0.55, 0.22],
    [0.22, 0.45],
  ];
  return layers.map(([wScale, opacity]) => {
    const geo = tapeGeometry(points, baseWidth * wScale, 0.02, colorAt, 32);
    const mat = new MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: opacity * strength,
      blending: AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    });
    return new Mesh(geo, mat);
  });
}

/** Colour ramp for a trail: `from` near the card end, `to` near the phone end. */
export function ramp(from: [number, number, number], to: [number, number, number]): ColorAt {
  return (u: number) => mix(from, to, u);
}

export { railPoints };
