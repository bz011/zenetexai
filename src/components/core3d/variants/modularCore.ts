import { ExtrudeGeometry, Group, Shape, Vector3, type Light } from "three";
import { BLUE, CYAN, box, mix, plateGeometry, rectFrame, tapeGeometry } from "../geometry";
import type { CoreKit } from "../materials";
import { cyanLight, ioRails, mesh } from "./shared";
import type { CoreBuild } from "./types";

/**
 * VARIANT C - MODULAR CORE
 * One integrated object instead of a stack: five C-section modules interlock
 * end to end along a shared base, with controlled gaps between them. Each
 * module is open toward the viewer, so the internal path - a lit channel that
 * runs through every module and past a lit gate at each joint - is visible
 * from the outside. Two rails tie the modules together; the roofline steps up
 * and back down. Stages: Intake, Understand, Decide, Act, Verify.
 */

const N = 5;
const LEN = 1.5; // module length (X)
const GAP = 0.13;
const D = 2.9; // depth (Z)
const HEIGHTS = [2.1, 2.45, 2.8, 2.45, 2.1];
const BOTTOM = -1.3;
const C0 = -0.5; // channel floor (Y)
const C1 = 0.55; // channel ceiling (Y)
const NOTCH_BACK = -0.35; // how deep the channel cuts in (Z)

function moduleShape(top: number): Shape {
  const zb = -D / 2;
  const zf = D / 2;
  const k = 0.16;
  const p: [number, number][] = [
    [zb + k, BOTTOM], [zf - k, BOTTOM], [zf, BOTTOM + k], [zf, C0],
    [NOTCH_BACK, C0], [NOTCH_BACK, C1], [zf, C1],
    [zf, top - k], [zf - k, top], [zb + k, top], [zb, top - k], [zb, BOTTOM + k],
  ];
  const s = new Shape();
  p.forEach(([x, y], i) => (i === 0 ? s.moveTo(x, y) : s.lineTo(x, y)));
  s.closePath();
  return s;
}

/** A prism along X from a (z, y) profile. Unlike plateGeometry it is not re-centred in Y. */
function prism(shape: Shape, length: number, bevel = 0.03): ExtrudeGeometry {
  return plateGeometry(shape, length, bevel);
}

export function buildModularCore(kit: CoreKit): CoreBuild {
  const group = new Group();
  const lights: Light[] = [];
  const pitch = LEN + GAP;
  const total = N * LEN + (N - 1) * GAP;
  const xs = Array.from({ length: N }, (_, i) => -total / 2 + LEN / 2 + i * pitch);

  xs.forEach((x, i) => {
    const top = BOTTOM + HEIGHTS[i];
    group.add(mesh(prism(moduleShape(top), LEN, 0.035), kit.graphite, x, 0, 0));

    // audit ticks on the roof: one more per stage, so the record accumulates
    for (let k = 0; k <= i; k++) group.add(mesh(box(0.05, 0.02, 0.5), kit.lightCyan, x - 0.5 + k * 0.16, top + 0.012, -0.85, false));

    // machined step on the roof front edge
    group.add(mesh(box(LEN - 0.3, 0.06, 0.12), kit.graphiteDark, x, top + 0.02, D / 2 - 0.35));

    lights.push(cyanLight(x, 0.05, 0.7, 4, 2.6));
  });

  // interlock: a tongue crosses every joint (top and bottom) and a lit gate stands in the channel
  for (let i = 0; i < N - 1; i++) {
    const jx = xs[i] + LEN / 2 + GAP / 2;
    const topMin = BOTTOM + Math.min(HEIGHTS[i], HEIGHTS[i + 1]);
    group.add(mesh(box(GAP + 0.5, 0.3, 1.3), kit.graphiteDark, jx, topMin - 0.45, -0.3));
    group.add(mesh(box(GAP + 0.5, 0.3, 1.3), kit.graphiteDark, jx, BOTTOM + 0.4, -0.3));
    group.add(mesh(plateGeometry(rectFrame(NOTCH_BACK + 0.06, D / 2 - 0.02, C0 + 0.02, C1 - 0.02, 0.035), 0.03, 0.004), kit.lightCyan, jx, 0, 0, false));
  }

  // continuous base and two rails that tie the modules into one object
  group.add(mesh(box(total + 0.2, 0.16, D + 0.3), kit.graphiteDark, 0, BOTTOM - 0.06, 0));
  [-0.85, 0.85].forEach((y) => group.add(mesh(box(total + 0.05, 0.07, 0.09), kit.polymer, 0, y, D / 2 + 0.05)));

  // the internal path: a lit channel along the floor of the trough, and a dim strip under its roof
  const zc = (NOTCH_BACK + D / 2) / 2;
  group.add(mesh(tapeGeometry([new Vector3(-total / 2 - 0.4, C0 + 0.03, zc), new Vector3(total / 2 + 0.4, C0 + 0.03, zc)], 0.55, 0.04, (u) => mix(BLUE, CYAN, u), 48), kit.lightVC, 0, 0, 0, false));
  group.add(mesh(box(total, 0.02, 0.12), kit.lightBlue, 0, C1 - 0.03, zc, false));

  const anchors = ioRails(group, kit, {
    xOuter: total / 2 + 1.25,
    xOuterOut: total / 2 + 1.1,
    xInner: total / 2 + 0.3,
    spread: 0.62,
    inCenter: { z: zc, y: C0 + 0.03 },
    outCenter: { z: zc, y: C0 + 0.03 },
  });

  return {
    group,
    anchors,
    lights,
    frame: { dist: 32, target: new Vector3(0.9, -0.1, 0.3), yaw: 34, pitch: 19 },
  };
}
