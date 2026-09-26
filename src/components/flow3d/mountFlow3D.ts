import { Color, Matrix4, PerspectiveCamera, Quaternion, SRGBColorSpace, Vector3, WebGLRenderer } from "three";
import { buildFlowScene, type FlowLayout, type FlowPalette, type FlowSceneParts } from "./scene";

/**
 * Mounts the optional 3D layer onto the SVG governed-flow figure. Loaded on
 * demand (dynamic import) - it is not part of any page's initial JavaScript.
 *
 * The HTML list stays the content; this only replaces the 2D rails/markers with
 * a scene where depth means something (see scene.ts). Rendering is on demand:
 * a frame is drawn only while the pointer is moving the camera, a row is being
 * hovered, or the layout changed - never in an idle loop - and pauses when the
 * figure is off screen. DPR is capped at 1.5 and no textures are used.
 */

const FOV = 20;
const MAX_TILT_Y = 0.1; // ~5.7 degrees
const MAX_TILT_X = 0.06;

function channel(el: Element, name: string): [number, number, number] {
  const raw = getComputedStyle(el).getPropertyValue(name).trim().split(/\s+/).map(Number);
  return [raw[0] ?? 0, raw[1] ?? 0, raw[2] ?? 0];
}
function color(el: Element, name: string): Color {
  const [r, g, b] = channel(el, name);
  return new Color().setRGB(r / 255, g / 255, b / 255, SRGBColorSpace);
}

function readPalette(fig: Element): FlowPalette {
  return { accent: color(fig, "--accent"), accentFg: color(fig, "--accent-fg"), accent2: color(fig, "--accent-2"), line: color(fig, "--line-strong") };
}

interface RowInfo {
  el: HTMLElement;
  kind: string;
  nodeIndex: number;
}

function readLayout(fig: HTMLElement): { layout: FlowLayout; rows: RowInfo[] } {
  const box = fig.getBoundingClientRect();
  const rel = (r: DOMRect) => ({ top: r.top - box.top, left: r.left - box.left, w: r.width, h: r.height });
  const rowEls = [...fig.querySelectorAll<HTMLElement>("[data-flow-row]")];
  const nodes: { y: number }[] = [];
  const gates: { y: number }[] = [];
  const ticks: { y: number }[] = [];
  const rows: RowInfo[] = [];
  let decideNodeIndex = 0;
  rowEls.forEach((el) => {
    const kind = el.dataset.kind ?? "stage";
    const r = rel(el.getBoundingClientRect());
    if (kind === "gate") {
      const y = r.top + r.h / 2;
      gates.push({ y });
      ticks.push({ y });
      rows.push({ el, kind, nodeIndex: -1 });
    } else {
      const y = r.top + 11;
      if (el.dataset.role === "decide") decideNodeIndex = nodes.length;
      rows.push({ el, kind, nodeIndex: nodes.length });
      nodes.push({ y });
      ticks.push({ y });
    }
  });
  const rail = fig.querySelector<SVGElement>(".flow-2d");
  const railLeft = rail ? rel(rail.getBoundingClientRect()).left : 24;
  const handoffEl = fig.querySelector<HTMLElement>("[data-flow='handoff']");
  const h = handoffEl ? rel(handoffEl.getBoundingClientRect()) : null;
  return {
    layout: {
      width: box.width,
      height: box.height,
      railX: railLeft + 14,
      railTop: nodes[0]?.y ?? 0,
      railBottom: nodes[nodes.length - 1]?.y ?? 0,
      nodes,
      gates,
      decideNodeIndex,
      handoff: h ? { x: h.left, y: h.top, w: h.w, h: h.h } : null,
      ticks,
    },
    rows,
  };
}

export interface Flow3DHandle {
  dispose: () => void;
}

export default function mountFlow3D(fig: HTMLElement, onLost: () => void): Flow3DHandle {
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;opacity:0;transition:opacity 300ms";
  fig.prepend(canvas);

  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x000000, 0);
  const camera = new PerspectiveCamera(FOV, 1, 10, 6000);

  let parts: FlowSceneParts | null = null;
  let rows: RowInfo[] = [];
  let visible = true;
  let raf = 0;
  let disposed = false;
  let firstFrame = true;
  const tilt = { x: 0, y: 0, tx: 0, ty: 0 };
  const scratch = new Matrix4();
  const hoverScale = new Vector3(1.6, 1.6, 1);
  const one = new Vector3(1, 1, 1);
  const identity = new Quaternion();
  let hoveredNode = -1;

  function build() {
    parts?.dispose();
    const { layout, rows: r } = readLayout(fig);
    rows = r;
    const d = layout.height / 2 / Math.tan((FOV * Math.PI) / 360);
    camera.aspect = layout.width / layout.height;
    camera.position.set(0, 0, d);
    camera.far = d + 1200;
    camera.updateProjectionMatrix();
    renderer.setSize(layout.width, layout.height, false);
    parts = buildFlowScene(layout, readPalette(fig));
  }

  function setNodeHover(index: number) {
    if (!parts || index === hoveredNode) return;
    const apply = (i: number, hot: boolean) => {
      if (i < 0) return;
      const p = parts!.nodeBase[i];
      scratch.compose(p, identity, hot ? hoverScale : one);
      parts!.nodes.setMatrixAt(i, scratch);
      parts!.nodes.setColorAt(i, hot ? readPalette(fig).accentFg : readPalette(fig).accent);
    };
    apply(hoveredNode, false);
    apply(index, true);
    hoveredNode = index;
    parts.nodes.instanceMatrix.needsUpdate = true;
    if (parts.nodes.instanceColor) parts.nodes.instanceColor.needsUpdate = true;
    schedule();
  }

  function frame() {
    raf = 0;
    if (disposed || !parts) return;
    tilt.x += (tilt.tx - tilt.x) * 0.12;
    tilt.y += (tilt.ty - tilt.y) * 0.12;
    parts.root.rotation.set(tilt.x, tilt.y, 0);
    renderer.render(parts.scene, camera);
    if (firstFrame) {
      firstFrame = false;
      canvas.style.opacity = "1";
      fig.dataset.flow3d = "on";
    }
    if (Math.abs(tilt.tx - tilt.x) > 0.0004 || Math.abs(tilt.ty - tilt.y) > 0.0004) schedule();
  }
  function schedule() {
    if (!raf && visible && !disposed) raf = requestAnimationFrame(frame);
  }

  const onMove = (e: PointerEvent) => {
    const r = fig.getBoundingClientRect();
    tilt.ty = ((e.clientX - r.left) / r.width - 0.5) * 2 * MAX_TILT_Y;
    tilt.tx = ((e.clientY - r.top) / r.height - 0.5) * 2 * MAX_TILT_X;
    schedule();
  };
  const onLeave = () => {
    tilt.tx = 0;
    tilt.ty = 0;
    schedule();
  };
  fig.addEventListener("pointermove", onMove);
  fig.addEventListener("pointerleave", onLeave);

  const rowListeners: [HTMLElement, () => void, () => void][] = [];
  function bindRows() {
    rowListeners.splice(0).forEach(([el, a, b]) => {
      el.removeEventListener("pointerenter", a);
      el.removeEventListener("pointerleave", b);
    });
    rows.forEach((row) => {
      if (row.nodeIndex < 0) return;
      const enter = () => setNodeHover(row.nodeIndex);
      const leave = () => setNodeHover(-1);
      row.el.addEventListener("pointerenter", enter);
      row.el.addEventListener("pointerleave", leave);
      rowListeners.push([row.el, enter, leave]);
    });
  }

  const io = new IntersectionObserver((entries) => {
    visible = entries.some((e) => e.isIntersecting);
    if (visible) schedule();
  });
  io.observe(fig);

  let resizeTimer = 0;
  const ro = new ResizeObserver(() => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      if (disposed) return;
      hoveredNode = -1;
      build();
      bindRows();
      schedule();
    }, 120);
  });
  ro.observe(fig);

  const onContextLost = (e: Event) => {
    e.preventDefault();
    onLost();
  };
  canvas.addEventListener("webglcontextlost", onContextLost);

  build();
  bindRows();
  schedule();

  return {
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(resizeTimer);
      io.disconnect();
      ro.disconnect();
      fig.removeEventListener("pointermove", onMove);
      fig.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      rowListeners.forEach(([el, a, b]) => {
        el.removeEventListener("pointerenter", a);
        el.removeEventListener("pointerleave", b);
      });
      parts?.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
      delete fig.dataset.flow3d;
    },
  };
}
