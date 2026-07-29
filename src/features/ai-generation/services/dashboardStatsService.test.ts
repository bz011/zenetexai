import { describe, it, expect } from "vitest";
import { computeAverageQuality, computeTopTags, summarizeReviewerActivity } from "./dashboardStatsService";

describe("computeAverageQuality", () => {
  it("averages non-null scores", () => {
    expect(computeAverageQuality([80, 90, 100])).toBe(90);
  });

  it("ignores nulls rather than treating them as zero", () => {
    expect(computeAverageQuality([80, null, 100])).toBe(90);
  });

  it("returns null when every score is null", () => {
    expect(computeAverageQuality([null, null])).toBeNull();
  });

  it("returns null for an empty list", () => {
    expect(computeAverageQuality([])).toBeNull();
  });

  it("rounds to one decimal place", () => {
    expect(computeAverageQuality([80, 81, 82])).toBe(81);
    expect(computeAverageQuality([80, 81])).toBe(80.5);
  });
});

describe("computeTopTags", () => {
  it("counts tag occurrences across all questions", () => {
    const result = computeTopTags([["risk", "agile"], ["risk"], ["procurement"]]);
    expect(result[0]).toEqual({ tag: "risk", count: 2 });
  });

  it("handles null tag lists without throwing", () => {
    const result = computeTopTags([null, ["risk"], null]);
    expect(result).toEqual([{ tag: "risk", count: 1 }]);
  });

  it("respects the limit parameter", () => {
    const result = computeTopTags([["a"], ["b"], ["c"], ["d"]], 2);
    expect(result).toHaveLength(2);
  });

  it("breaks ties alphabetically for deterministic ordering", () => {
    const result = computeTopTags([["zeta"], ["alpha"]]);
    expect(result.map((r) => r.tag)).toEqual(["alpha", "zeta"]);
  });

  it("returns an empty list for no input", () => {
    expect(computeTopTags([])).toEqual([]);
  });
});

describe("summarizeReviewerActivity", () => {
  it("counts actions per actor", () => {
    const rows = [
      { actor: "alice@example.com", action: "approved" },
      { actor: "alice@example.com", action: "rejected" },
      { actor: "bob@example.com", action: "commented" },
    ];
    const result = summarizeReviewerActivity(rows);
    expect(result[0]).toEqual({ actor: "alice@example.com", count: 2 });
    expect(result[1]).toEqual({ actor: "bob@example.com", count: 1 });
  });

  it("respects the limit parameter", () => {
    const rows = [
      { actor: "a", action: "approved" },
      { actor: "b", action: "approved" },
      { actor: "c", action: "approved" },
    ];
    expect(summarizeReviewerActivity(rows, 2)).toHaveLength(2);
  });

  it("returns an empty list for no activity", () => {
    expect(summarizeReviewerActivity([])).toEqual([]);
  });
});
