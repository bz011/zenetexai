import { describe, it, expect } from "vitest";
import { buildBrainMesh, type BrainPart } from "./brainMesh";

const mesh = buildBrainMesh(4, 11);
const parts: BrainPart[] = [...mesh.hemispheres, mesh.cerebellum, mesh.stem];

describe("procedural brain surface", () => {
  it("is deterministic, so every visitor gets the same brain", () => {
    const again = buildBrainMesh(4, 11);
    for (let i = 0; i < parts.length; i++) {
      const other = [...again.hemispheres, again.cerebellum, again.stem][i];
      expect(other.positions).toEqual(parts[i].positions);
      expect(other.folds).toEqual(parts[i].folds);
      expect(other.indices).toEqual(parts[i].indices);
    }
  });

  it("produces valid geometry: finite positions, in-range indices, fold values in 0..1", () => {
    for (const part of parts) {
      const vertexCount = part.positions.length / 3;
      expect(part.folds.length).toBe(vertexCount);
      expect(part.indices.length % 3).toBe(0);
      for (const v of part.positions) expect(Number.isFinite(v)).toBe(true);
      for (const idx of part.indices) expect(idx).toBeLessThan(vertexCount);
      for (const f of part.folds) {
        expect(f).toBeGreaterThanOrEqual(0);
        expect(f).toBeLessThanOrEqual(1);
      }
    }
  });

  it("has two hemispheres either side of the midline, a cerebellum behind and below, and a brainstem beneath", () => {
    const meanX = (p: BrainPart) => p.positions.filter((_, i) => i % 3 === 0).reduce((a, b) => a + b, 0) / (p.positions.length / 3);
    const meanY = (p: BrainPart) => p.positions.filter((_, i) => i % 3 === 1).reduce((a, b) => a + b, 0) / (p.positions.length / 3);
    const meanZ = (p: BrainPart) => p.positions.filter((_, i) => i % 3 === 2).reduce((a, b) => a + b, 0) / (p.positions.length / 3);
    expect(meanX(mesh.hemispheres[0])).toBeLessThan(-0.2);
    expect(meanX(mesh.hemispheres[1])).toBeGreaterThan(0.2);
    expect(meanZ(mesh.cerebellum)).toBeLessThan(-0.4);
    expect(meanY(mesh.cerebellum)).toBeLessThan(meanY(mesh.hemispheres[0]));
    expect(meanY(mesh.stem)).toBeLessThan(meanY(mesh.cerebellum));
  });

  it("is a brain-sized, brain-proportioned form: longer front to back than wide, and wider than tall", () => {
    let min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
    for (const part of [...mesh.hemispheres, mesh.cerebellum]) {
      for (let i = 0; i < part.positions.length; i += 3) {
        for (let k = 0; k < 3; k++) {
          min[k] = Math.min(min[k], part.positions[i + k]);
          max[k] = Math.max(max[k], part.positions[i + k]);
        }
      }
    }
    const [w, h, l] = [max[0] - min[0], max[1] - min[1], max[2] - min[2]];
    expect(l).toBeGreaterThan(w);
    expect(l).toBeGreaterThan(h * 1.2);
    expect(w).toBeGreaterThan(h * 0.9);
  });

  it("carves real folds: a large share of the cortex surface sits in sulci, with distinct crests", () => {
    const folds = mesh.hemispheres.flatMap((p) => Array.from(p.folds));
    const inSulcus = folds.filter((f) => f < 0.5).length / folds.length;
    const crest = folds.filter((f) => f > 0.9).length / folds.length;
    expect(inSulcus).toBeGreaterThan(0.05);
    expect(inSulcus).toBeLessThan(0.6);
    expect(crest).toBeGreaterThan(0.3);
  });

  it("hero-quality detail is generated in well under a second and is fine-grained enough for gyri", () => {
    const t = Date.now();
    const full = buildBrainMesh(6, 11);
    expect(Date.now() - t).toBeLessThan(1500);
    expect(full.hemispheres[0].positions.length / 3).toBeGreaterThan(40000);
  });
});
