import { describe, it, expect } from "vitest";
import { isOptionSelectionCorrect, isMatchingCorrect, isDragDropCorrect, isHotspotClickCorrect } from "./quizGradingService";

describe("isOptionSelectionCorrect", () => {
  it("is correct when the single submitted option is the single correct option", () => {
    expect(isOptionSelectionCorrect(new Set(["A"]), ["A"])).toBe(true);
  });

  it("is incorrect when the wrong option is submitted", () => {
    expect(isOptionSelectionCorrect(new Set(["A"]), ["B"])).toBe(false);
  });

  it("is correct for multiple_response only when the exact set matches", () => {
    expect(isOptionSelectionCorrect(new Set(["A", "B"]), ["A", "B"])).toBe(true);
    expect(isOptionSelectionCorrect(new Set(["A", "B"]), ["B", "A"])).toBe(true);
  });

  it("is incorrect for a partial multiple_response selection - no partial credit", () => {
    expect(isOptionSelectionCorrect(new Set(["A", "B"]), ["A"])).toBe(false);
  });

  it("is incorrect when extra wrong options are included alongside correct ones", () => {
    expect(isOptionSelectionCorrect(new Set(["A"]), ["A", "B"])).toBe(false);
  });

  it("is incorrect for an empty submission against a non-empty correct set", () => {
    expect(isOptionSelectionCorrect(new Set(["A"]), [])).toBe(false);
  });
});

describe("isMatchingCorrect", () => {
  const correct = new Map([
    ["L1", "R1"],
    ["L2", "R2"],
  ]);

  it("is correct when every pair matches exactly", () => {
    expect(
      isMatchingCorrect(correct, [
        { leftItemId: "L1", rightItemId: "R1" },
        { leftItemId: "L2", rightItemId: "R2" },
      ])
    ).toBe(true);
  });

  it("is incorrect when one pair is swapped", () => {
    expect(
      isMatchingCorrect(correct, [
        { leftItemId: "L1", rightItemId: "R2" },
        { leftItemId: "L2", rightItemId: "R1" },
      ])
    ).toBe(false);
  });

  it("is incorrect when fewer pairs are submitted than exist", () => {
    expect(isMatchingCorrect(correct, [{ leftItemId: "L1", rightItemId: "R1" }])).toBe(false);
  });
});

describe("isDragDropCorrect", () => {
  it("is correct when the order matches exactly", () => {
    expect(isDragDropCorrect(["A", "B", "C"], ["A", "B", "C"])).toBe(true);
  });

  it("is incorrect when two adjacent items are swapped", () => {
    expect(isDragDropCorrect(["A", "B", "C"], ["B", "A", "C"])).toBe(false);
  });

  it("is incorrect when the submitted order has a different length", () => {
    expect(isDragDropCorrect(["A", "B", "C"], ["A", "B"])).toBe(false);
  });
});

describe("isHotspotClickCorrect", () => {
  const region = { x: 40, y: 40, width: 20, height: 20 }; // covers 40-60 on both axes

  it("is correct for a click inside the region", () => {
    expect(isHotspotClickCorrect(region, { xPct: 50, yPct: 50 })).toBe(true);
  });

  it("is correct for a click exactly on the region's edge", () => {
    expect(isHotspotClickCorrect(region, { xPct: 40, yPct: 60 })).toBe(true);
  });

  it("is incorrect for a click outside the region", () => {
    expect(isHotspotClickCorrect(region, { xPct: 10, yPct: 10 })).toBe(false);
  });

  it("is incorrect for a click just past the region's edge", () => {
    expect(isHotspotClickCorrect(region, { xPct: 60.1, yPct: 50 })).toBe(false);
  });
});
