import { describe, it, expect } from "vitest";
import {
  allocateByWeights,
  buildTargetCells,
  resolveCellsAgainstInventory,
  resolveInteractionTypeCounts,
  resolveAnswerTypeCounts,
  sectionForSequenceIndex,
  cellKey,
  groupQuestionsByCell,
  pickQuestionsForDraw,
  selectQuestionsForDraws,
  type InventoryQuestionRow,
  type CellDraw,
} from "./blueprintEngine";
import { PMP_EXAM_BLUEPRINT_2026 } from "../config/examBlueprint";

describe("allocateByWeights", () => {
  it("sums to exactly the requested total, never off by one from naive rounding", () => {
    // 33/41/26 against 180 is exactly the case that exposed the bug class
    // this function exists to prevent - naive Math.round per item can land
    // on 179 or 181.
    const result = allocateByWeights(180, { People: 33, Process: 41, "Business Environment": 26 });
    expect(result.People + result.Process + result["Business Environment"]).toBe(180);
  });

  it("returns all zeros when total is 0", () => {
    const result = allocateByWeights(0, { a: 50, b: 50 });
    expect(result).toEqual({ a: 0, b: 0 });
  });

  it("returns all zeros when every weight is 0", () => {
    const result = allocateByWeights(10, { a: 0, b: 0 });
    expect(result).toEqual({ a: 0, b: 0 });
  });

  it("breaks remainder ties deterministically by input key order, not randomly", () => {
    const a = allocateByWeights(10, { x: 33.3, y: 33.3, z: 33.4 });
    const b = allocateByWeights(10, { x: 33.3, y: 33.3, z: 33.4 });
    expect(a).toEqual(b);
  });

  it("normalizes weights that don't sum to 100", () => {
    const result = allocateByWeights(100, { a: 1, b: 1 }); // sums to 2, not 100
    expect(result).toEqual({ a: 50, b: 50 });
  });
});

describe("buildTargetCells", () => {
  it("produces exactly 180 questions total for the 2026 blueprint (3 domains x 3 approaches x 4 difficulties = 36 cells)", () => {
    const cells = buildTargetCells(180, PMP_EXAM_BLUEPRINT_2026);
    expect(cells).toHaveLength(36);
    expect(cells.reduce((sum, c) => sum + c.targetCount, 0)).toBe(180);
  });

  it("matches the reported final domain allocation: People 59 / Process 74 / Business Environment 47", () => {
    const cells = buildTargetCells(180, PMP_EXAM_BLUEPRINT_2026);
    const byDomain = (domain: string) => cells.filter((c) => c.domain === domain).reduce((sum, c) => sum + c.targetCount, 0);
    expect(byDomain("People")).toBe(59);
    expect(byDomain("Process")).toBe(74);
    expect(byDomain("Business Environment")).toBe(47);
  });
});

describe("resolveCellsAgainstInventory", () => {
  it("resolves entirely from the own cell when inventory is sufficient, with zero fallback log entries", () => {
    const targetCells = [{ domain: "People" as const, approach: "Predictive" as const, difficulty: "Moderate" as const, targetCount: 5 }];
    const inventory = { [cellKey("People", "Predictive", "Moderate")]: 20 };
    const result = resolveCellsAgainstInventory(targetCells, inventory);

    expect(result.resolvedCells[0].resolvedCount).toBe(5);
    expect(result.totalShortfall).toBe(0);
    expect(result.fallbackLog).toHaveLength(0);
    expect(result.draws).toEqual([{ targetKey: "People|Predictive|Moderate", sourceKey: "People|Predictive|Moderate", count: 5 }]);
  });

  it("falls back to the Mixed approach bucket (same domain+difficulty) before touching difficulty or approach", () => {
    const targetCells = [{ domain: "People" as const, approach: "Predictive" as const, difficulty: "Moderate" as const, targetCount: 5 }];
    const inventory = {
      [cellKey("People", "Predictive", "Moderate")]: 2,
      [cellKey("People", "Mixed", "Moderate")]: 10,
    };
    const result = resolveCellsAgainstInventory(targetCells, inventory);

    expect(result.resolvedCells[0].resolvedCount).toBe(5);
    expect(result.totalShortfall).toBe(0);
    expect(result.fallbackLog[0]).toContain("borrowed 3 from Mixed approach");
  });

  it("folds into progressively easier difficulty tiers when Mixed is also short (Expert -> Difficult -> Moderate -> Easy)", () => {
    const targetCells = [{ domain: "People" as const, approach: "Predictive" as const, difficulty: "Expert" as const, targetCount: 3 }];
    const inventory = {
      [cellKey("People", "Predictive", "Expert")]: 0,
      [cellKey("People", "Mixed", "Expert")]: 0,
      [cellKey("People", "Predictive", "Difficult")]: 0,
      [cellKey("People", "Predictive", "Moderate")]: 3,
    };
    const result = resolveCellsAgainstInventory(targetCells, inventory);

    expect(result.resolvedCells[0].resolvedCount).toBe(3);
    expect(result.fallbackLog.some((l) => l.includes("folded 3 into Moderate difficulty"))).toBe(true);
  });

  it("borrows from a different approach within the same domain as the last resort", () => {
    const targetCells = [{ domain: "Business Environment" as const, approach: "Hybrid" as const, difficulty: "Moderate" as const, targetCount: 14 }];
    // Reproduces the real inventory shortfall discovered during Sprint 9
    // planning: Business Environment x Hybrid needed 14, only 12 existed.
    const inventory = {
      [cellKey("Business Environment", "Hybrid", "Moderate")]: 12,
      [cellKey("Business Environment", "Mixed", "Moderate")]: 0,
      [cellKey("Business Environment", "Predictive", "Moderate")]: 5,
    };
    const result = resolveCellsAgainstInventory(targetCells, inventory);

    expect(result.resolvedCells[0].resolvedCount).toBe(14);
    expect(result.totalShortfall).toBe(0);
    expect(result.fallbackLog.some((l) => l.includes("borrowed 2 from Predictive approach"))).toBe(true);
  });

  it("reports a genuine totalShortfall when the entire domain's inventory across every fallback tier is exhausted", () => {
    const targetCells = [{ domain: "People" as const, approach: "Predictive" as const, difficulty: "Moderate" as const, targetCount: 10 }];
    const inventory = { [cellKey("People", "Predictive", "Moderate")]: 3 };
    const result = resolveCellsAgainstInventory(targetCells, inventory);

    expect(result.resolvedCells[0].resolvedCount).toBe(3);
    expect(result.totalShortfall).toBe(7);
  });

  it("never double-counts the same inventory pool across two target cells drawing from the same fallback source", () => {
    const targetCells = [
      { domain: "People" as const, approach: "Predictive" as const, difficulty: "Moderate" as const, targetCount: 5 },
      { domain: "People" as const, approach: "Agile" as const, difficulty: "Moderate" as const, targetCount: 5 },
    ];
    // Both cells are short and would fall back to the same Mixed bucket,
    // which only has enough for one of them combined.
    const inventory = {
      [cellKey("People", "Predictive", "Moderate")]: 3,
      [cellKey("People", "Agile", "Moderate")]: 3,
      [cellKey("People", "Mixed", "Moderate")]: 2,
    };
    const result = resolveCellsAgainstInventory(targetCells, inventory);

    const totalResolved = result.resolvedCells.reduce((sum, c) => sum + c.resolvedCount, 0);
    // 3 + 3 own-cell, plus at most 2 more from the shared Mixed pool = 8 max, never more.
    expect(totalResolved).toBe(8);
    expect(result.totalShortfall).toBe(2);
  });
});

describe("resolveInteractionTypeCounts", () => {
  it("redistributes any shortfall entirely to standard", () => {
    const available = { standard: 470, graphic_based: 19, drag_and_drop: 4, hotspot: 1, matching: 0 };
    const { resolved, fallbackLog } = resolveInteractionTypeCounts(180, PMP_EXAM_BLUEPRINT_2026, available);

    const total = Object.values(resolved).reduce((sum, n) => sum + n, 0);
    expect(total).toBe(180);
    expect(resolved.matching).toBe(0);
    expect(fallbackLog.some((l) => l.includes("matching"))).toBe(false); // target for matching is already 0, nothing to redistribute
  });

  it("caps hotspot/drag_and_drop hard against real inventory and logs the shortfall", () => {
    const available = { standard: 470, graphic_based: 19, drag_and_drop: 4, hotspot: 1, matching: 0 };
    const { resolved, fallbackLog } = resolveInteractionTypeCounts(180, PMP_EXAM_BLUEPRINT_2026, available);

    expect(resolved.drag_and_drop).toBeLessThanOrEqual(4);
    expect(resolved.hotspot).toBeLessThanOrEqual(1);
    expect(fallbackLog.some((l) => l.includes("hotspot"))).toBe(true);
  });
});

describe("resolveAnswerTypeCounts", () => {
  it("redistributes a multiple_response shortfall to single and keeps the total exact", () => {
    const { resolved, fallbackLog } = resolveAnswerTypeCounts(180, PMP_EXAM_BLUEPRINT_2026, { single: 479, multiple_response: 2 });
    expect(resolved.single + resolved.multiple_response).toBe(180);
    expect(resolved.multiple_response).toBe(2);
    expect(fallbackLog[0]).toContain("multiple_response");
  });
});

describe("sectionForSequenceIndex", () => {
  it("maps the last question of section 1 and the first question of section 2 correctly", () => {
    expect(sectionForSequenceIndex(59, PMP_EXAM_BLUEPRINT_2026)).toBe(1);
    expect(sectionForSequenceIndex(60, PMP_EXAM_BLUEPRINT_2026)).toBe(2);
  });

  it("maps the last question of the exam to the final section", () => {
    expect(sectionForSequenceIndex(179, PMP_EXAM_BLUEPRINT_2026)).toBe(3);
  });
});

function row(overrides: Partial<InventoryQuestionRow> = {}): InventoryQuestionRow {
  return {
    questionId: "q-default",
    domain: "People",
    approach: "Predictive",
    difficulty: "Moderate",
    interactionType: "standard",
    answerType: "single",
    ...overrides,
  };
}

describe("pickQuestionsForDraw", () => {
  it("prefers unseen questions over previously-seen ones", () => {
    const candidates = [row({ questionId: "seen-1" }), row({ questionId: "unseen-1" })];
    const { picked } = pickQuestionsForDraw(candidates, 1, new Set(["seen-1"]), { standard: 0, graphic_based: 0, drag_and_drop: 0, hotspot: 0, matching: 0 });
    expect(picked[0].questionId).toBe("unseen-1");
  });

  it("degrades gracefully to reusing seen questions when there is no unseen alternative", () => {
    const candidates = [row({ questionId: "seen-1" }), row({ questionId: "seen-2" })];
    const { picked } = pickQuestionsForDraw(candidates, 2, new Set(["seen-1", "seen-2"]), {
      standard: 0,
      graphic_based: 0,
      drag_and_drop: 0,
      hotspot: 0,
      matching: 0,
    });
    expect(picked).toHaveLength(2);
  });

  it("prefers a question whose interaction type still has open budget", () => {
    const candidates = [row({ questionId: "std", interactionType: "standard" }), row({ questionId: "hot", interactionType: "hotspot" })];
    const { picked, remainingBudget } = pickQuestionsForDraw(candidates, 1, new Set(), {
      standard: 100,
      graphic_based: 0,
      drag_and_drop: 0,
      hotspot: 1,
      matching: 0,
    });
    expect(picked[0].questionId).toBe("hot");
    expect(remainingBudget.hotspot).toBe(0);
  });

  it("is deterministic given the same injected rng", () => {
    const candidates = Array.from({ length: 5 }, (_, i) => row({ questionId: `q${i}` }));
    const budget = { standard: 0, graphic_based: 0, drag_and_drop: 0, hotspot: 0, matching: 0 };
    const fixedRng = () => 0.42;
    const a = pickQuestionsForDraw(candidates, 3, new Set(), budget, fixedRng);
    const b = pickQuestionsForDraw(candidates, 3, new Set(), budget, fixedRng);
    expect(a.picked.map((q) => q.questionId)).toEqual(b.picked.map((q) => q.questionId));
  });
});

describe("groupQuestionsByCell", () => {
  it("groups rows by their domain|approach|difficulty key", () => {
    const rows = [row({ questionId: "a" }), row({ questionId: "b" }), row({ questionId: "c", domain: "Process" })];
    const grouped = groupQuestionsByCell(rows);
    expect(grouped.get(cellKey("People", "Predictive", "Moderate"))).toHaveLength(2);
    expect(grouped.get(cellKey("Process", "Predictive", "Moderate"))).toHaveLength(1);
  });
});

describe("selectQuestionsForDraws", () => {
  it("never selects the same question twice across two draws pulling from the same source cell", () => {
    const rows = Array.from({ length: 3 }, (_, i) => row({ questionId: `q${i}` }));
    const draws: CellDraw[] = [
      { targetKey: "target-1", sourceKey: cellKey("People", "Predictive", "Moderate"), count: 2 },
      { targetKey: "target-2", sourceKey: cellKey("People", "Predictive", "Moderate"), count: 1 },
    ];
    const budget = { standard: 0, graphic_based: 0, drag_and_drop: 0, hotspot: 0, matching: 0 };
    const selected = selectQuestionsForDraws(rows, draws, budget, new Set());

    expect(selected).toHaveLength(3);
    expect(new Set(selected.map((s) => s.questionId)).size).toBe(3);
  });

  it("carries the interaction-type budget across draws instead of resetting it per draw", () => {
    // Deliberately generous standard-question filler (not just enough to
    // exactly fill both draws) so a budget-exhausted hotspot question is
    // never *forced* into a draw for lack of any other candidate - that
    // would conflate "total count is a higher priority than type mix" with
    // "the budget carried across draws at all", which is what this test is
    // isolating.
    const rows = [
      row({ questionId: "hot-1", interactionType: "hotspot" }),
      row({ questionId: "hot-2", interactionType: "hotspot" }),
      ...Array.from({ length: 6 }, (_, i) => row({ questionId: `std-${i}` })),
    ];
    const draws: CellDraw[] = [
      { targetKey: "target-1", sourceKey: cellKey("People", "Predictive", "Moderate"), count: 2 },
      { targetKey: "target-2", sourceKey: cellKey("People", "Predictive", "Moderate"), count: 2 },
    ];
    const budget = { standard: 0, graphic_based: 0, drag_and_drop: 0, hotspot: 1, matching: 0 };
    const selected = selectQuestionsForDraws(rows, draws, budget, new Set());

    // Only 1 hotspot question should be picked across BOTH draws combined,
    // even though each draw individually could have picked one.
    expect(selected.filter((s) => s.interactionType === "hotspot")).toHaveLength(1);
  });

  it("preserves the real drawn cell's domain/approach/difficulty on the selected question, not the target cell's intent", () => {
    const rows = [row({ questionId: "mixed-1", approach: "Mixed", difficulty: "Easy" })];
    // Target cell wanted Predictive/Moderate, but this draw's sourceKey
    // proves it was actually resolved from a Mixed/Easy fallback.
    const draws: CellDraw[] = [{ targetKey: cellKey("People", "Predictive", "Moderate"), sourceKey: cellKey("People", "Mixed", "Easy"), count: 1 }];
    const budget = { standard: 0, graphic_based: 0, drag_and_drop: 0, hotspot: 0, matching: 0 };
    const selected = selectQuestionsForDraws(rows, draws, budget, new Set());

    expect(selected[0].approach).toBe("Mixed");
    expect(selected[0].difficulty).toBe("Easy");
  });
});
