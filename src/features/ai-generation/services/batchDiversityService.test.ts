import { describe, it, expect } from "vitest";
import { computeBatchDiversityReport, type BatchDiversityQuestionRow } from "./batchDiversityService";

function row(overrides: Partial<BatchDiversityQuestionRow> = {}): BatchDiversityQuestionRow {
  return {
    patternId: "pattern-1",
    sourceQuestionIds: ["Q1", "Q2", "Q3"],
    testedDecision: "Assess before escalating",
    scenarioStructure: "Unexpected disruption threatens project constraints",
    domain: "Process",
    approach: "Predictive",
    difficulty: "Moderate",
    ...overrides,
  };
}

describe("computeBatchDiversityReport", () => {
  it("reproduces the pilot incident exactly: 5 questions, all sharing one pattern and one source cluster, flags pattern collapse", () => {
    const rows = Array.from({ length: 5 }, () => row());
    const report = computeBatchDiversityReport(rows, []);

    expect(report.totalAttempts).toBe(5);
    expect(report.uniqueSourcePatterns).toBe(1);
    expect(report.uniqueSourceClusters).toBe(1);
    expect(report.patternReuseRate).toBe(0.8); // 1 - 1/5
    expect(report.patternCollapseDetected).toBe(true);
    expect(report.patternCollapseReasons.some((r) => r.includes("exact same source pattern"))).toBe(true);
  });

  it("does not flag collapse when a 5-question batch used 5 distinct patterns", () => {
    const rows = Array.from({ length: 5 }, (_, i) =>
      row({ patternId: `pattern-${i}`, sourceQuestionIds: [`Q${i}a`, `Q${i}b`, `Q${i}c`] })
    );
    const report = computeBatchDiversityReport(rows, []);

    expect(report.uniqueSourcePatterns).toBe(5);
    expect(report.patternReuseRate).toBe(0);
    expect(report.patternCollapseDetected).toBe(false);
  });

  it("counts two patterns extracted from the identical source-question set as the same cluster, regardless of array order", () => {
    const rows = [
      row({ patternId: "pattern-a", sourceQuestionIds: ["Q1", "Q2", "Q3"] }),
      row({ patternId: "pattern-b", sourceQuestionIds: ["Q3", "Q1", "Q2"] }), // same set, different order
    ];
    const report = computeBatchDiversityReport(rows, []);

    expect(report.uniqueSourcePatterns).toBe(2); // different pattern rows
    expect(report.uniqueSourceClusters).toBe(1); // but the same underlying source material
  });

  it("computes domain/approach/difficulty/tested-decision/scenario-archetype distributions", () => {
    const rows = [
      row({ domain: "Process", approach: "Predictive" }),
      row({ domain: "Process", approach: "Agile" }),
      row({ domain: "People", approach: "Predictive" }),
    ];
    const report = computeBatchDiversityReport(rows, []);

    expect(report.domainDistribution).toEqual({ Process: 2, People: 1 });
    expect(report.approachDistribution).toEqual({ Predictive: 2, Agile: 1 });
  });

  it("flags pattern collapse when max intra-batch semantic similarity is at or above the elevated bar (0.75), even with distinct patterns", () => {
    const rows = Array.from({ length: 3 }, (_, i) => row({ patternId: `pattern-${i}`, sourceQuestionIds: [`Q${i}`] }));
    const report = computeBatchDiversityReport(rows, [0.62, 0.81, 0.7]);

    expect(report.maxIntraBatchSemanticSimilarity).toBeCloseTo(0.81, 5);
    expect(report.avgIntraBatchSemanticSimilarity).toBeCloseTo((0.62 + 0.81 + 0.7) / 3, 5);
    expect(report.patternCollapseDetected).toBe(true);
    expect(report.patternCollapseReasons.some((r) => r.includes("intra-batch semantic similarity"))).toBe(true);
  });

  it("reports null max/avg intra-batch semantic similarity when there is nothing to compare (e.g. only 1 accepted question so far)", () => {
    const report = computeBatchDiversityReport([row()], []);
    expect(report.maxIntraBatchSemanticSimilarity).toBeNull();
    expect(report.avgIntraBatchSemanticSimilarity).toBeNull();
  });

  it("flags high reuse rate (not just total collapse) for larger batches", () => {
    const rows = [
      ...Array.from({ length: 4 }, () => row({ patternId: "popular-pattern" })),
      row({ patternId: "rare-pattern", sourceQuestionIds: ["Q9"] }),
    ];
    const report = computeBatchDiversityReport(rows, []);
    expect(report.patternReuseRate).toBe(0.6); // 1 - 2/5
    expect(report.patternCollapseDetected).toBe(true);
    expect(report.patternCollapseReasons.some((r) => r.includes("reuse rate"))).toBe(true);
  });

  it("returns a clean, non-collapsed report for an empty batch without throwing", () => {
    const report = computeBatchDiversityReport([], []);
    expect(report.totalAttempts).toBe(0);
    expect(report.patternCollapseDetected).toBe(false);
    expect(report.domainDistribution).toEqual({});
  });

  it("treats null domain/tested-decision/scenario-structure as 'Unspecified' rather than dropping the row", () => {
    const report = computeBatchDiversityReport([row({ domain: null, testedDecision: null, scenarioStructure: null })], []);
    expect(report.domainDistribution.Unspecified).toBe(1);
    expect(report.testedDecisionDistribution.Unspecified).toBe(1);
    expect(report.scenarioArchetypeDistribution.Unspecified).toBe(1);
  });
});
