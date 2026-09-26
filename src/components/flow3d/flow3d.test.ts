import { describe, it, expect } from "vitest";
import { Color } from "three";
import { FLOW_3D_MIN_WIDTH, shouldEnableFlow3D, type Flow3DEnv } from "./capability";
import { buildFlowScene, measureScene, type FlowLayout } from "./scene";
import { FLOW_3D_DEFAULT, resolveFlow3D } from "@/lib/featureFlags";

const okEnv: Flow3DEnv = { width: 1440, finePointer: true, reducedMotion: false, saveData: false, webgl: true };

describe("3D layer gating (any failed condition keeps the SVG diagram)", () => {
  it("is enabled only when the flag is on and every capability holds", () => {
    expect(shouldEnableFlow3D(okEnv, true)).toBe(true);
    expect(shouldEnableFlow3D(okEnv, false)).toBe(false);
  });
  it.each<[string, Partial<Flow3DEnv>]>([
    ["a tablet/phone width", { width: FLOW_3D_MIN_WIDTH - 1 }],
    ["a touch pointer", { finePointer: false }],
    ["reduced motion", { reducedMotion: true }],
    ["data saver", { saveData: true }],
    ["no WebGL", { webgl: false }],
  ])("stays off for %s", (_name, patch) => {
    expect(shouldEnableFlow3D({ ...okEnv, ...patch }, true)).toBe(false);
  });
  it("starts at exactly 1024px", () => {
    expect(shouldEnableFlow3D({ ...okEnv, width: 1024 }, true)).toBe(true);
  });
});

describe("feature flag", () => {
  it("ships disabled by default and can be previewed or forced off from the URL", () => {
    expect(FLOW_3D_DEFAULT).toBe(false);
    expect(resolveFlow3D("")).toBe(false);
    expect(resolveFlow3D("?flow3d=1")).toBe(true);
    expect(resolveFlow3D("?flow3d=0", true)).toBe(false);
    expect(resolveFlow3D("?other=1", true)).toBe(true);
  });
});

const layout: FlowLayout = {
  width: 486,
  height: 789,
  railX: 38,
  railTop: 60,
  railBottom: 700,
  nodes: [60, 190, 260, 330, 460, 540, 690].map((y) => ({ y })),
  gates: [150, 420, 640].map((y) => ({ y })),
  decideNodeIndex: 3,
  handoff: { x: 60, y: 350, w: 400, h: 70 },
  ticks: [60, 150, 190, 260, 330, 420, 460, 540, 640].map((y) => ({ y })),
};
const palette = { accent: new Color(0x2563eb), accentFg: new Color(0x60a5fa), accent2: new Color(0x06b6d4), line: new Color(0x344468) };

describe("3D scene budget", () => {
  const parts = buildFlowScene(layout, palette);
  const m = measureScene(parts.scene);

  it("stays within the budget: <= 20 draw calls, <= 20k triangles, <= 40 logical nodes", () => {
    expect(m.drawCalls).toBeLessThanOrEqual(20);
    expect(m.triangles).toBeLessThanOrEqual(20000);
    expect(m.logicalNodes).toBeLessThanOrEqual(40);
  });

  it("uses no textures (nothing to download, no CDN assets)", () => {
    parts.scene.traverse((o) => {
      const mat = (o as { material?: { map?: unknown } }).material;
      expect(mat?.map ?? null).toBeNull();
    });
  });

  it("puts meaning in depth: the human plane is in front of, and the record plane behind, the agent plane", () => {
    const zs: number[] = [];
    parts.scene.traverse((o) => {
      const pos = (o as { geometry?: { getAttribute: (n: string) => { getZ: (i: number) => number } | undefined } }).geometry?.getAttribute?.("position");
      if (pos && (o as { isLine?: boolean }).isLine) zs.push(pos.getZ(0));
    });
    expect(Math.max(...zs)).toBeGreaterThan(0); // handoff frame / branch reach forward
    expect(parts.nodeBase.every((p) => p.z === 1)).toBe(true); // nodes stay on the agent plane
  });
});
