/**
 * Progressive enhancement switches.
 *
 * FLOW_3D_DEFAULT: whether the optional WebGL layer of the homepage governed
 * flow is enabled for everyone. It ships DISABLED: the measured cost (a
 * ~130 KB gzip three.js chunk, a WebGL context and per-frame work) was not
 * justified by the visual gain over the SVG diagram - see docs/design-v2/
 * 3D-EVALUATION.md for the evidence. The layer is fully implemented and
 * lazy, so it can be previewed with ?flow3d=1 and switched on here later
 * without any other change. ?flow3d=0 forces it off.
 */
export const FLOW_3D_DEFAULT = false;

export function resolveFlow3D(search: string, defaultOn: boolean = FLOW_3D_DEFAULT): boolean {
  const value = new URLSearchParams(search).get("flow3d");
  if (value === "0") return false;
  if (value === "1") return true;
  return defaultOn;
}
