import { Group, Vector3, type Light } from "three";
import { BLUE, CYAN, box, chamferHole, chamferShape, mix, plateGeometry, tapeGeometry } from "../geometry";
import type { CoreKit } from "../materials";
import { auditTicks, cyanLight, ioRails, mesh } from "./shared";
import type { CoreBuild } from "./types";

/**
 * VARIANT A - PRECISION STACK
 * Five machined plates stand in a row along the flow, separated in depth, each
 * with an aperture sleeve the signal passes through. A rear spine carries the
 * audit record (one more tick per stage) and ties the plates into one object.
 * Stages, left to right: Intake, Understand, Decide, Act, Verify.
 */

const XS = [-2.7, -1.35, 0, 1.35, 2.7];
const T = 0.34; // plate thickness (X)
const W = 3.3; // plate width (Z)
const H = 3.1; // plate height (Y)

/** aperture size (z, y) per plate: the gates narrow as the work is checked */
const APERTURES: [number, number][] = [
  [2.05, 1.5],
  [1.85, 1.3],
  [1.7, 1.2],
  [1.55, 1.08],
  [1.3, 0.92],
];

export function buildPrecisionStack(kit: CoreKit): CoreBuild {
  const group = new Group();
  const lights: Light[] = [];

  XS.forEach((x, i) => {
    const [aw, ah] = APERTURES[i];

    // main plate
    const shape = chamferShape(W, H, 0.26);
    shape.holes.push(chamferHole(aw, ah, 0.12));
    group.add(mesh(plateGeometry(shape, T, 0.04), kit.graphite, x, 0, 0));

    // aperture sleeve: a rectangular port that stands proud of the input face,
    // so each stage reads as a gate you pass through, not a screen bezel
    const sleeve = chamferShape(aw + 0.34, ah + 0.34, 0.16);
    sleeve.holes.push(chamferHole(aw, ah, 0.12));
    const sleeveLen = 0.2;
    group.add(mesh(plateGeometry(sleeve, sleeveLen, 0.03), kit.graphiteDark, x - T / 2 - sleeveLen / 2 + 0.02, 0, 0));

    // active gate edge: thin lit rim on the sleeve mouth
    const rim = chamferShape(aw + 0.06, ah + 0.06, 0.13);
    rim.holes.push(chamferHole(aw, ah, 0.12));
    group.add(mesh(plateGeometry(rim, 0.02, 0.004), kit.lightCyan, x - T / 2 - sleeveLen - 0.005, 0, 0, false));

    // machined grooves along the lower input face
    [-1.15, -1.3].forEach((y) => group.add(mesh(box(0.02, 0.022, W - 0.9), kit.polymer, x - T / 2 - 0.004, y, 0, false)));

    // state strip along the top edge, on the input face
    group.add(mesh(box(0.03, 0.03, 1.3), kit.lightBlue, x - T / 2 - 0.006, H / 2 - 0.2, 0.6, false));

    lights.push(cyanLight(x - 0.75, 0, 0, 5, 3.0));
  });

  // Decide: a lit gate pin across the aperture
  group.add(mesh(box(0.05, 1.05, 0.05), kit.lightCyan, XS[2] - 0.2, 0, 0, false));

  // ── audit spine ──
  const spineLen = 8.0;
  const spineZ = -2.0;
  group.add(mesh(box(spineLen, H + 0.3, 0.16), kit.graphiteDark, 0, 0, spineZ));
  group.add(mesh(box(spineLen, 0.03, 0.05), kit.lightCyan, 0, (H + 0.3) / 2 - 0.05, spineZ + 0.1, false));
  XS.forEach((x) => {
    [0.95, -0.95].forEach((y) => group.add(mesh(box(0.26, 0.5, 0.36), kit.polymer, x, y, spineZ + 0.26)));
  });
  auditTicks(
    group,
    kit,
    XS.slice(0, 4).map((x) => x + 0.65),
    spineZ + 0.09,
    -1.1,
  );

  // ── signal path ──
  const inner = 3.5;
  const channel = tapeGeometry([new Vector3(-inner, 0, 0), new Vector3(inner, 0, 0)], 0.5, 0.05, (u) => mix(BLUE, CYAN, u), 40);
  group.add(mesh(channel, kit.lightVC, 0, 0, 0, false));
  const anchors = ioRails(group, kit, { xOuter: 5.2, xOuterOut: 5.0, xInner: inner, spread: 0.7 });

  // base rail the whole object stands on, so it reads as one system
  group.add(mesh(box(spineLen, 0.1, 0.5), kit.graphiteDark, 0, -H / 2 - 0.2, spineZ + 0.3));

  return {
    group,
    anchors,
    lights,
    frame: { dist: 30, target: new Vector3(1.0, 0, -0.4), yaw: 35, pitch: 15 },
  };
}
