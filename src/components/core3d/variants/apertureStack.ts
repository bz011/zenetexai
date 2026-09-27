import { Group, LineBasicMaterial, Vector3, type Light } from "three";
import { BLUE, CYAN, box, chamferHole, chamferShape, mix, plateGeometry, tapeGeometry } from "../geometry";
import type { CoreKit } from "../materials";
import { cyanLight, ioRails, loft, mesh, type OpeningRect } from "./shared";
import type { CoreBuild } from "./types";

/**
 * VARIANT B - APERTURE STACK
 * The same five stages, but the gates are the design. Each plate is a slim
 * frame around a large opening; shutter blades close that opening down to a
 * different, offset window at every stage, so the route the signal takes
 * through the system is a visible, stepped channel. Light volumes between the
 * windows show the route. Stages: Intake, Understand, Decide, Act, Verify.
 */

const XS = [-3.2, -1.6, 0, 1.6, 3.2];
const T = 0.16;
const W = 3.3;
const H = 3.0;
const OW = 2.5; // full opening (z)
const OH = 1.9; // full opening (y)

/** the window each stage leaves open: z0..z1, y0..y1 */
const WINDOWS: [number, number, number, number][] = [
  [-1.25, 1.25, -0.95, 0.95], // Intake: fully open
  [-1.25, 1.25, -0.35, 0.35], // Understand: horizontal slit
  [0.175, 0.925, -0.95, 0.95], // Decide: vertical slit, offset
  [-1.05, -0.45, -0.35, 0.75], // Act: small offset window
  [-0.6, 1.0, -0.375, 0.175], // Verify: narrow slit
];

export function buildAperturePlate(kit: CoreKit): CoreBuild {
  const group = new Group();
  const lights: Light[] = [];
  const line = new LineBasicMaterial({ color: 0x38d6ee, transparent: true, opacity: 0.22, toneMapped: false });

  const rects: OpeningRect[] = [];
  XS.forEach((x, i) => {
    const shape = chamferShape(W, H, 0.24);
    shape.holes.push(chamferHole(OW, OH, 0.1));
    group.add(mesh(plateGeometry(shape, T, 0.03), kit.graphite, x, 0, 0));

    // slim raised frame lip around the opening on the input side
    const lip = chamferShape(OW + 0.3, OH + 0.3, 0.14);
    lip.holes.push(chamferHole(OW, OH, 0.1));
    group.add(mesh(plateGeometry(lip, 0.12, 0.02), kit.graphiteDark, x - T / 2 - 0.05, 0, 0));

    // shutter blades close the opening down to this stage's window
    const [z0, z1, y0, y1] = WINDOWS[i];
    const bx = x - T / 2 - 0.02;
    const blade = (za: number, zb: number, ya: number, yb: number) => {
      const w = zb - za;
      const h = yb - ya;
      if (w < 0.02 || h < 0.02) return;
      group.add(mesh(plateGeometry(chamferShape(w, h, 0.05), 0.12, 0.03), kit.graphite, bx - 0.03, (ya + yb) / 2, (za + zb) / 2));
    };
    blade(-OW / 2, OW / 2, y1, OH / 2); // top
    blade(-OW / 2, OW / 2, -OH / 2, y0); // bottom
    blade(-OW / 2, z0, y0, y1); // left
    blade(z1, OW / 2, y0, y1); // right

    // lit edge around the window: the active gate
    const ww = z1 - z0;
    const wh = y1 - y0;
    const rim = chamferShape(ww + 0.09, wh + 0.09, 0.04);
    rim.holes.push(chamferHole(ww, wh, 0.03, 0, 0));
    const rimMesh = mesh(plateGeometry(rim, 0.02, 0.004), kit.lightCyan, bx - 0.04, (y0 + y1) / 2, (z0 + z1) / 2, false);
    group.add(rimMesh);

    rects.push({ x, z0, z1, y0, y1 });
    lights.push(cyanLight(x - 0.6, (y0 + y1) / 2, (z0 + z1) / 2, 4, 2.8));
  });

  // route: light volume from each window's exit to the next window's entrance
  for (let i = 0; i < rects.length - 1; i++) {
    group.add(loft({ ...rects[i], x: rects[i].x + T / 2 }, { ...rects[i + 1], x: rects[i + 1].x - T / 2 - 0.02 }, kit, line));
  }

  // the signal line through the window centres
  const pts = rects.flatMap((r) => [
    new Vector3(r.x - 0.5, (r.y0 + r.y1) / 2, (r.z0 + r.z1) / 2),
    new Vector3(r.x + 0.5, (r.y0 + r.y1) / 2, (r.z0 + r.z1) / 2),
  ]);
  group.add(mesh(tapeGeometry(pts, 0.16, 0.04, (u) => mix(BLUE, CYAN, u), 160), kit.lightVC, 0, 0, 0, false));

  // base rail with the audit record: one more tick per stage
  const baseY = -H / 2 - 0.18;
  group.add(mesh(box(8.4, 0.09, 0.7), kit.graphiteDark, 0, baseY, 0.2));
  XS.forEach((x, i) => {
    for (let k = 0; k <= i; k++) group.add(mesh(box(0.04, 0.02, 0.4), kit.lightCyan, x - 0.15 + k * 0.1, baseY + 0.055, 0.2, false));
  });

  const first = rects[0];
  const last = rects[rects.length - 1];
  const anchors = ioRails(group, kit, {
    xOuter: 4.9,
    xOuterOut: 5.5,
    xInner: 3.9,
    spread: 0.62,
    inCenter: { z: (first.z0 + first.z1) / 2, y: (first.y0 + first.y1) / 2 },
    outCenter: { z: (last.z0 + last.z1) / 2, y: (last.y0 + last.y1) / 2 },
  });

  return {
    group,
    anchors,
    lights,
    frame: { dist: 29.5, target: new Vector3(1.1, 0, 0), yaw: 43, pitch: 13 },
  };
}
