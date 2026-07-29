import { describe, it, expect } from "vitest";
import {
  classifyGap,
  buildBreakdown,
  domainRecommendations,
  interactionTypeRecommendations,
  type DimensionBreakdown,
} from "./coverageIntelligenceService";

describe("classifyGap", () => {
  it("returns ok when there is no defined target", () => {
    expect(classifyGap(50, null)).toBe("ok");
  });

  it("returns ok when actual is within tolerance of target", () => {
    expect(classifyGap(45, 42)).toBe("ok");
  });

  it("returns under when actual is well below target", () => {
    expect(classifyGap(2, 8)).toBe("under");
  });

  it("returns over when actual is well above target", () => {
    expect(classifyGap(80, 50)).toBe("over");
  });
});

describe("buildBreakdown", () => {
  it("counts rows per distinct value and computes percentages", () => {
    const rows = [{ domain: "Process" }, { domain: "Process" }, { domain: "People" }];
    const breakdown = buildBreakdown(rows as never[], "domain" as never, { Process: 50, People: 42 }, 3);
    const process = breakdown.find((b) => b.value === "Process")!;
    const people = breakdown.find((b) => b.value === "People")!;
    expect(process.count).toBe(2);
    expect(process.actualPct).toBeCloseTo(66.7, 1);
    expect(people.count).toBe(1);
    expect(people.actualPct).toBeCloseTo(33.3, 1);
  });

  it("includes known values with zero count when includeAllKnownValues is passed", () => {
    const rows = [{ interaction_type: "standard" }];
    const breakdown = buildBreakdown(rows as never[], "interaction_type" as never, {}, 1, ["standard", "matching"]);
    const matching = breakdown.find((b) => b.value === "matching")!;
    expect(matching.count).toBe(0);
    expect(matching.actualPct).toBe(0);
  });

  it("falls back to 'Unspecified' for null field values instead of dropping the row", () => {
    const rows = [{ domain: null }];
    const breakdown = buildBreakdown(rows as never[], "domain" as never, {}, 1);
    expect(breakdown[0].value).toBe("Unspecified");
    expect(breakdown[0].count).toBe(1);
  });

  it("returns an empty breakdown for zero rows without dividing by zero", () => {
    const breakdown = buildBreakdown([], "domain" as never, {}, 0);
    expect(breakdown).toEqual([]);
  });
});

describe("domainRecommendations", () => {
  it("produces no recommendation for dimensions marked ok", () => {
    const breakdown: DimensionBreakdown[] = [{ value: "Process", count: 10, actualPct: 50, targetPct: 50, gap: "ok" }];
    expect(domainRecommendations(breakdown)).toEqual([]);
  });

  it("flags an under-represented domain by name with both percentages", () => {
    const breakdown: DimensionBreakdown[] = [{ value: "Business Environment", count: 1, actualPct: 2, targetPct: 8, gap: "under" }];
    const recs = domainRecommendations(breakdown);
    expect(recs).toHaveLength(1);
    expect(recs[0]).toContain("Business Environment");
    expect(recs[0]).toContain("2%");
    expect(recs[0]).toContain("8%");
  });
});

describe("interactionTypeRecommendations", () => {
  it("calls out zero-coverage interaction types explicitly", () => {
    const breakdown: DimensionBreakdown[] = [{ value: "matching", count: 0, actualPct: 0, targetPct: null, gap: "ok" }];
    const recs = interactionTypeRecommendations(breakdown);
    expect(recs[0]).toContain("ZERO");
    expect(recs[0]).toContain("matching");
  });

  it("does not flag interaction types with healthy share", () => {
    const breakdown: DimensionBreakdown[] = [{ value: "standard", count: 100, actualPct: 90, targetPct: null, gap: "ok" }];
    expect(interactionTypeRecommendations(breakdown)).toEqual([]);
  });
});
