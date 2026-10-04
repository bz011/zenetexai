import { describe, it, expect } from "vitest";
import { BoxGeometry, Group, Mesh, Vector3 } from "three";
import { contentBounds } from "./kit";

function cube(size: number, x: number, y: number, z: number, scale = 1): Group {
  const group = new Group();
  group.position.set(x, y, z);
  group.scale.setScalar(scale);
  group.add(new Mesh(new BoxGeometry(size, size, size)));
  return group;
}

describe("contentBounds", () => {
  it("measures a single object's half-extent from the given center", () => {
    const box = cube(4, 0, 0, 0); // -2..2 on every axis
    const { halfWidth, halfHeight } = contentBounds([box], new Vector3(0, 0, 0));
    expect(halfWidth).toBeCloseTo(2, 5);
    expect(halfHeight).toBeCloseTo(2, 5);
  });

  it("unions multiple objects and measures from an off-center target", () => {
    const left = cube(2, -5, 1, 0); // x: -6..-4, y: 0..2
    const right = cube(2, 5, -1, 0); // x: 4..6, y: -2..0
    const center = new Vector3(1, 0, 0);
    const { halfWidth, halfHeight } = contentBounds([left, right], center);
    // Farthest x from center=1 is -6 (distance 7) vs 6 (distance 5) -> 7.
    expect(halfWidth).toBeCloseTo(7, 5);
    expect(halfHeight).toBeCloseTo(2, 5);
  });

  it("respects an object's local scale", () => {
    const scaled = cube(2, 0, 0, 0, 3); // base half-extent 1, scaled 3x -> 3
    const { halfWidth } = contentBounds([scaled], new Vector3(0, 0, 0));
    expect(halfWidth).toBeCloseTo(3, 5);
  });
});
