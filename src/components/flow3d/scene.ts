import {
  BoxGeometry,
  BufferGeometry,
  CircleGeometry,
  Color,
  Float32BufferAttribute,
  InstancedMesh,
  Line,
  LineDashedMaterial,
  LineLoop,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  QuadraticBezierCurve3,
  Scene,
  Vector3,
  Object3D,
} from "three";

/**
 * Geometry for the 3D layer of the governed flow. Built with raw three.js
 * (no R3F, no drei): no renderer is created here, so the scene is testable in
 * Node and its budget (draw calls, triangles, logical nodes) is asserted in
 * tests. Coordinates: 1 world unit = 1 CSS px at z = 0, origin at the centre
 * of the figure, y up - so nodes line up with the HTML rows they annotate.
 *
 * Depth carries meaning (this is the only reason the layer exists):
 *   z =    0  the agent plane: rail, stage nodes and gates
 *   z =  +60  the human plane: the "your team" handoff frame, in front
 *   z = -100  the record plane: one audit tick per step, behind
 */

export const HUMAN_Z = 60;
export const RECORD_Z = -100;

export interface FlowLayout {
  width: number;
  height: number;
  railX: number;
  railTop: number;
  railBottom: number;
  nodes: { y: number }[];
  gates: { y: number }[];
  decideNodeIndex: number;
  handoff: { x: number; y: number; w: number; h: number } | null;
  ticks: { y: number }[];
}

export interface FlowPalette {
  accent: Color;
  accentFg: Color;
  accent2: Color;
  line: Color;
}

export interface FlowSceneParts {
  scene: Scene;
  nodes: InstancedMesh;
  nodeBase: Vector3[];
  /** Objects the pointer parallax rotates as one group. */
  root: Object3D;
  dispose: () => void;
}

const NODE_R = 7;
const RAIL_W = 2;

function toWorld(layout: FlowLayout, px: number, py: number, z = 0): Vector3 {
  return new Vector3(px - layout.width / 2, layout.height / 2 - py, z);
}

export function buildFlowScene(layout: FlowLayout, palette: FlowPalette): FlowSceneParts {
  const scene = new Scene();
  const root = new Object3D();
  scene.add(root);
  const disposables: { dispose: () => void }[] = [];
  const track = <T extends { dispose: () => void }>(o: T): T => (disposables.push(o), o);

  // ── Rail: a base line and the lit line over it (agent plane) ──
  const railLen = layout.railBottom - layout.railTop;
  const railGeo = track(new PlaneGeometry(RAIL_W, railLen));
  const railBase = new Mesh(railGeo, track(new MeshBasicMaterial({ color: palette.line })));
  railBase.position.copy(toWorld(layout, layout.railX, layout.railTop + railLen / 2));
  const railLit = new Mesh(railGeo, track(new MeshBasicMaterial({ color: palette.accent })));
  railLit.position.copy(railBase.position).setZ(0.5);
  // The lit rail is the same mesh geometry: one extra draw call, no extra buffers.
  root.add(railBase, railLit);

  // ── Nodes: one instanced mesh (agent plane) ──
  const nodeGeo = track(new CircleGeometry(NODE_R, 24));
  const nodeMat = track(new MeshBasicMaterial({ color: 0xffffff }));
  const nodes = new InstancedMesh(nodeGeo, nodeMat, layout.nodes.length);
  const nodeBase: Vector3[] = [];
  const m = new Matrix4();
  layout.nodes.forEach((n, i) => {
    const p = toWorld(layout, layout.railX, n.y, 1);
    nodeBase.push(p);
    m.makeTranslation(p.x, p.y, p.z);
    nodes.setMatrixAt(i, m);
    nodes.setColorAt(i, palette.accent);
  });
  nodes.instanceMatrix.needsUpdate = true;
  if (nodes.instanceColor) nodes.instanceColor.needsUpdate = true;
  root.add(nodes);

  // ── Gates: short bars crossing the rail, one instanced mesh ──
  const gateGeo = track(new PlaneGeometry(18, 2));
  const gateMat = track(new MeshBasicMaterial({ color: 0xffffff }));
  const gates = new InstancedMesh(gateGeo, gateMat, Math.max(1, layout.gates.length));
  layout.gates.forEach((g, i) => {
    const p = toWorld(layout, layout.railX, g.y, 1);
    m.makeTranslation(p.x, p.y, p.z);
    gates.setMatrixAt(i, m);
    gates.setColorAt(i, palette.accent2);
  });
  gates.count = layout.gates.length;
  gates.instanceMatrix.needsUpdate = true;
  if (gates.instanceColor) gates.instanceColor.needsUpdate = true;
  root.add(gates);

  // ── Human plane: the handoff frame in front, joined to the Decide node by a curve ──
  if (layout.handoff) {
    const { x, y, w, h } = layout.handoff;
    const tl = toWorld(layout, x, y, HUMAN_Z);
    const frame = new BufferGeometry();
    frame.setAttribute(
      "position",
      new Float32BufferAttribute([tl.x, tl.y, HUMAN_Z, tl.x + w, tl.y, HUMAN_Z, tl.x + w, tl.y - h, HUMAN_Z, tl.x, tl.y - h, HUMAN_Z], 3)
    );
    track(frame);
    const frameMat = track(new LineDashedMaterial({ color: palette.accent2, dashSize: 5, gapSize: 4 }));
    const frameLine = new LineLoop(frame, frameMat);
    frameLine.computeLineDistances();
    root.add(frameLine);

    const from = nodeBase[layout.decideNodeIndex] ?? toWorld(layout, layout.railX, y);
    const to = new Vector3(tl.x, tl.y - h / 2, HUMAN_Z);
    const control = new Vector3(from.x + 24, from.y, HUMAN_Z * 0.5);
    const curve = new QuadraticBezierCurve3(from, control, to);
    const branch = new BufferGeometry().setFromPoints(curve.getPoints(20));
    track(branch);
    const branchLine = new Line(branch, track(new LineDashedMaterial({ color: palette.accent2, dashSize: 4, gapSize: 4 })));
    branchLine.computeLineDistances();
    root.add(branchLine);
  }

  // ── Record plane: one audit tick per step, behind the panel's right edge ──
  const tickGeo = track(new BoxGeometry(10, 2, 1));
  const tickMat = track(new MeshBasicMaterial({ color: 0xffffff }));
  const ticks = new InstancedMesh(tickGeo, tickMat, layout.ticks.length);
  layout.ticks.forEach((t, i) => {
    const p = toWorld(layout, layout.width - 14, t.y, RECORD_Z);
    m.makeTranslation(p.x, p.y, p.z);
    ticks.setMatrixAt(i, m);
    ticks.setColorAt(i, palette.accent2);
  });
  ticks.instanceMatrix.needsUpdate = true;
  if (ticks.instanceColor) ticks.instanceColor.needsUpdate = true;
  root.add(ticks);

  return {
    scene,
    nodes,
    nodeBase,
    root,
    dispose: () => {
      disposables.forEach((d) => d.dispose());
      nodes.dispose();
      gates.dispose();
      ticks.dispose();
    },
  };
}

/** Budget of a built scene: what the renderer will actually submit. */
export function measureScene(scene: Scene) {
  let drawCalls = 0;
  let triangles = 0;
  let logicalNodes = 0;
  scene.traverse((o) => {
    const obj = o as Mesh & { isMesh?: boolean; isLine?: boolean; isInstancedMesh?: boolean; count?: number };
    if (!(obj.isMesh || obj.isLine)) return;
    drawCalls += 1;
    const geo = obj.geometry as BufferGeometry;
    const per = obj.isMesh ? (geo.index ? geo.index.count : geo.getAttribute("position").count) / 3 : 0;
    const instances = obj.isInstancedMesh ? (obj.count ?? 1) : 1;
    triangles += per * instances;
    logicalNodes += instances;
  });
  return { drawCalls, triangles, logicalNodes };
}
