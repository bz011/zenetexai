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
  enforceImageQuota,
  type SelectedExamQuestion,
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
    hasImage: false,
    ...overrides,
  };
}

const EMPTY_BUDGET = { standard: 0, graphic_based: 0, drag_and_drop: 0, hotspot: 0, matching: 0 };
const NO_PREVIOUS = new Set<string>();

describe("pickQuestionsForDraw", () => {
  it("prefers never-seen questions over previously-seen ones", () => {
    const candidates = [row({ questionId: "seen-1" }), row({ questionId: "unseen-1" })];
    const { picked } = pickQuestionsForDraw(candidates, 1, new Map([["seen-1", 3]]), EMPTY_BUDGET, NO_PREVIOUS);
    expect(picked[0].questionId).toBe("unseen-1");
  });

  it("among seen questions, prefers the least-seen one", () => {
    const candidates = [row({ questionId: "seen-a" }), row({ questionId: "seen-b" }), row({ questionId: "seen-c" })];
    const seenCounts = new Map([
      ["seen-a", 5],
      ["seen-b", 1],
      ["seen-c", 3],
    ]);
    const { picked } = pickQuestionsForDraw(candidates, 1, seenCounts, EMPTY_BUDGET, NO_PREVIOUS);
    expect(picked[0].questionId).toBe("seen-b");
  });

  it("deprioritizes questions from the immediately previous attempt below other seen questions", () => {
    const candidates = [row({ questionId: "in-previous" }), row({ questionId: "seen-elsewhere" })];
    const seenCounts = new Map([
      ["in-previous", 1],
      ["seen-elsewhere", 1],
    ]);
    const { picked } = pickQuestionsForDraw(candidates, 1, seenCounts, EMPTY_BUDGET, new Set(["in-previous"]));
    expect(picked[0].questionId).toBe("seen-elsewhere");
  });

  it("degrades gracefully to reusing previous-attempt questions when there is no other alternative", () => {
    const candidates = [row({ questionId: "in-previous-1" }), row({ questionId: "in-previous-2" })];
    const seenCounts = new Map([
      ["in-previous-1", 1],
      ["in-previous-2", 1],
    ]);
    const { picked } = pickQuestionsForDraw(candidates, 2, seenCounts, EMPTY_BUDGET, new Set(["in-previous-1", "in-previous-2"]));
    expect(picked).toHaveLength(2);
  });

  it("prefers a question whose interaction type still has open budget", () => {
    const candidates = [row({ questionId: "std", interactionType: "standard" }), row({ questionId: "hot", interactionType: "hotspot" })];
    const { picked, remainingBudget } = pickQuestionsForDraw(candidates, 1, new Map(), { ...EMPTY_BUDGET, standard: 100, hotspot: 1 }, NO_PREVIOUS);
    expect(picked[0].questionId).toBe("hot");
    expect(remainingBudget.hotspot).toBe(0);
  });

  it("is deterministic given the same injected rng", () => {
    const candidates = Array.from({ length: 5 }, (_, i) => row({ questionId: `q${i}` }));
    const fixedRng = () => 0.42;
    const a = pickQuestionsForDraw(candidates, 3, new Map(), EMPTY_BUDGET, NO_PREVIOUS, fixedRng);
    const b = pickQuestionsForDraw(candidates, 3, new Map(), EMPTY_BUDGET, NO_PREVIOUS, fixedRng);
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
    const selected = selectQuestionsForDraws(rows, draws, EMPTY_BUDGET, new Map(), NO_PREVIOUS);

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
    const budget = { ...EMPTY_BUDGET, hotspot: 1 };
    const selected = selectQuestionsForDraws(rows, draws, budget, new Map(), NO_PREVIOUS);

    // Only 1 hotspot question should be picked across BOTH draws combined,
    // even though each draw individually could have picked one.
    expect(selected.filter((s) => s.interactionType === "hotspot")).toHaveLength(1);
  });

  it("preserves the real drawn cell's domain/approach/difficulty on the selected question, not the target cell's intent", () => {
    const rows = [row({ questionId: "mixed-1", approach: "Mixed", difficulty: "Easy" })];
    // Target cell wanted Predictive/Moderate, but this draw's sourceKey
    // proves it was actually resolved from a Mixed/Easy fallback.
    const draws: CellDraw[] = [{ targetKey: cellKey("People", "Predictive", "Moderate"), sourceKey: cellKey("People", "Mixed", "Easy"), count: 1 }];
    const selected = selectQuestionsForDraws(rows, draws, EMPTY_BUDGET, new Map(), NO_PREVIOUS);

    expect(selected[0].approach).toBe("Mixed");
    expect(selected[0].difficulty).toBe("Easy");
  });

  it("keeps overlap with the immediately previous attempt at 0 when plenty of never-seen inventory exists (Sprint 9.1 item 7)", () => {
    // 10 previous-attempt questions available in this cell, but 20 fresh
    // never-seen ones too - a real exam-sized bank would never need to
    // touch the previous-attempt pool at all in this situation.
    const previousIds = Array.from({ length: 10 }, (_, i) => `prev-${i}`);
    const rows = [
      ...previousIds.map((id) => row({ questionId: id })),
      ...Array.from({ length: 20 }, (_, i) => row({ questionId: `fresh-${i}` })),
    ];
    const seenCounts = new Map(previousIds.map((id) => [id, 1]));
    const draws: CellDraw[] = [{ targetKey: "t1", sourceKey: cellKey("People", "Predictive", "Moderate"), count: 15 }];
    const selected = selectQuestionsForDraws(rows, draws, EMPTY_BUDGET, seenCounts, new Set(previousIds));

    const overlap = selected.filter((s) => previousIds.includes(s.questionId)).length;
    expect(overlap).toBe(0);
  });

  it("falls back to previous-attempt questions (controlled, reported) when inventory is too thin to avoid them", () => {
    // Only 5 candidates exist at all, all 5 are from the previous attempt -
    // the draw needs 5, so overlap is unavoidably forced to the full 5.
    const previousIds = ["prev-1", "prev-2", "prev-3", "prev-4", "prev-5"];
    const rows = previousIds.map((id) => row({ questionId: id }));
    const seenCounts = new Map(previousIds.map((id) => [id, 1]));
    const draws: CellDraw[] = [{ targetKey: "t1", sourceKey: cellKey("People", "Predictive", "Moderate"), count: 5 }];
    const selected = selectQuestionsForDraws(rows, draws, EMPTY_BUDGET, seenCounts, new Set(previousIds));

    expect(selected).toHaveLength(5);
    expect(selected.filter((s) => previousIds.includes(s.questionId))).toHaveLength(5);
  });
});


describe("enforceImageQuota", () => {
  const NO_SEEN = new Map<string, number>();
  const DOMAINS = ["People", "Process", "Business Environment"] as const;

  function pool(): InventoryQuestionRow[] {
    // 3 domains x 70 standard non-image questions + 24 image-bearing (8 per domain).
    const rows: InventoryQuestionRow[] = [];
    for (const d of DOMAINS) {
      for (let i = 0; i < 70; i++) rows.push(row({ questionId: `${d}-std-${i}`, domain: d }));
      for (let i = 0; i < 8; i++) rows.push(row({ questionId: `${d}-img-${i}`, domain: d, interactionType: "graphic_based", hasImage: true }));
    }
    return rows;
  }

  function toSelected(rows: InventoryQuestionRow[]): SelectedExamQuestion[] {
    return rows.map((r) => ({
      questionId: r.questionId,
      interactionType: r.interactionType,
      answerType: r.answerType,
      hasImage: r.hasImage,
      domain: r.domain,
      approach: r.approach,
      difficulty: r.difficulty,
    }));
  }

  function domainCounts(sel: SelectedExamQuestion[]) {
    return DOMAINS.map((d) => sel.filter((q) => q.domain === d).length);
  }

  it("raises a zero-image selection to 12 image-bearing questions, keeping total count and domain counts identical", () => {
    const rows = pool();
    const initial = toSelected(rows.filter((r) => !r.hasImage).slice(0, 180));
    const beforeDomains = domainCounts(initial);

    const res = enforceImageQuota(initial, rows, 12, NO_SEEN, NO_PREVIOUS);

    expect(res.achieved).toBe(12);
    expect(res.shortfall).toBe(0);
    expect(res.selected).toHaveLength(180);
    expect(new Set(res.selected.map((q) => q.questionId)).size).toBe(180);
    expect(domainCounts(res.selected)).toEqual(beforeDomains);
    expect(res.selected.filter((q) => q.hasImage)).toHaveLength(12);
  });

  it("does not remove anything when the selection already meets the minimum", () => {
    const rows = pool();
    const imgs = rows.filter((r) => r.hasImage).slice(0, 15);
    const std = rows.filter((r) => !r.hasImage).slice(0, 165);
    const initial = toSelected([...imgs, ...std]);
    const res = enforceImageQuota(initial, rows, 12, NO_SEEN, NO_PREVIOUS);
    expect(res.swaps).toEqual({ sameCell: 0, sameApproach: 0, sameDomain: 0 });
    expect(res.achieved).toBe(15);
    expect(res.selected.map((q) => q.questionId)).toEqual(initial.map((q) => q.questionId));
  });

  it("uses every available image-bearing question and reports the shortfall when inventory has fewer than 12", () => {
    const rows = [
      ...Array.from({ length: 50 }, (_, i) => row({ questionId: `std-${i}` })),
      ...Array.from({ length: 5 }, (_, i) => row({ questionId: `img-${i}`, interactionType: "graphic_based", hasImage: true })),
    ];
    const initial = toSelected(rows.filter((r) => !r.hasImage).slice(0, 40));
    const res = enforceImageQuota(initial, rows, 12, NO_SEEN, NO_PREVIOUS);
    expect(res.available).toBe(5);
    expect(res.achieved).toBe(5);
    expect(res.shortfall).toBe(7);
    expect(res.selected).toHaveLength(40);
    expect(res.log.some((l) => l.includes("shortfall 7"))).toBe(true);
  });

  it("never selects a question that is not in the eligible inventory (e.g. one filtered out as broken)", () => {
    const rows = pool();
    const brokenImage = "People-img-0";
    const eligible = rows.filter((r) => r.questionId !== brokenImage);
    const initial = toSelected(eligible.filter((r) => !r.hasImage).slice(0, 180));
    const res = enforceImageQuota(initial, eligible, 12, NO_SEEN, NO_PREVIOUS);
    expect(res.selected.some((q) => q.questionId === brokenImage)).toBe(false);
  });

  it("prefers same-cell swaps and keeps the cell distribution when possible", () => {
    const rows = [
      ...Array.from({ length: 20 }, (_, i) => row({ questionId: `p-${i}`, domain: "People", approach: "Agile", difficulty: "Easy" })),
      ...Array.from({ length: 20 }, (_, i) => row({ questionId: `r-${i}`, domain: "Process", approach: "Hybrid", difficulty: "Difficult" })),
      row({ questionId: "img-people", domain: "People", approach: "Agile", difficulty: "Easy", interactionType: "graphic_based", hasImage: true }),
    ];
    const initial = toSelected(rows.filter((r) => !r.hasImage).slice(0, 30));
    const res = enforceImageQuota(initial, rows, 1, NO_SEEN, NO_PREVIOUS);
    expect(res.swaps.sameCell).toBe(1);
    expect(res.selected.filter((q) => q.domain === "People" && q.approach === "Agile" && q.difficulty === "Easy")).toHaveLength(
      initial.filter((q) => q.domain === "People" && q.approach === "Agile" && q.difficulty === "Easy").length
    );
  });

  it("does not spend scarce rare-type questions as swap-out when a standard question is available", () => {
    const rows = [
      row({ questionId: "dnd", interactionType: "drag_and_drop" }),
      row({ questionId: "std-a" }),
      row({ questionId: "img", interactionType: "graphic_based", hasImage: true }),
    ];
    const res = enforceImageQuota(toSelected(rows.slice(0, 2)), rows, 1, NO_SEEN, NO_PREVIOUS);
    expect(res.selected.map((q) => q.questionId).sort()).toEqual(["dnd", "img"]);
  });

  it("prefers never-seen image questions over previously-seen ones", () => {
    const rows = [
      row({ questionId: "std-a" }),
      row({ questionId: "img-seen", interactionType: "graphic_based", hasImage: true }),
      row({ questionId: "img-new", interactionType: "graphic_based", hasImage: true }),
    ];
    const res = enforceImageQuota(toSelected([rows[0]]), rows, 1, new Map([["img-seen", 2]]), NO_PREVIOUS);
    expect(res.selected[0].questionId).toBe("img-new");
  });

  it("is deterministic given the same injected rng", () => {
    const rows = pool();
    const initial = toSelected(rows.filter((r) => !r.hasImage).slice(0, 180));
    const a = enforceImageQuota(initial, rows, 12, NO_SEEN, NO_PREVIOUS, () => 0.3);
    const b = enforceImageQuota(initial, rows, 12, NO_SEEN, NO_PREVIOUS, () => 0.3);
    expect(a.selected.map((q) => q.questionId)).toEqual(b.selected.map((q) => q.questionId));
  });
});
