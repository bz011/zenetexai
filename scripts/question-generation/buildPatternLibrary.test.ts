import { describe, it, expect } from "vitest";
import { discoverCombos, comboKey, type ApprovedQuestionRow } from "./buildPatternLibrary";

function makeRow(overrides: Partial<ApprovedQuestionRow>): ApprovedQuestionRow {
  return {
    question_id: "AIQ-0001",
    question_text_en: "Sample question text",
    domain: "Process",
    approach: "Predictive",
    difficulty: "Medium",
    interaction_type: "standard",
    answer_type: "single",
    ...overrides,
  };
}

describe("discoverCombos", () => {
  it("groups rows into distinct combinations and counts sources per combination", () => {
    const rows = [
      makeRow({ question_id: "AIQ-0001" }),
      makeRow({ question_id: "AIQ-0002" }),
      makeRow({ question_id: "AIQ-0003", domain: "Business Environment" }),
    ];
    const combos = discoverCombos(rows);
    expect(combos).toHaveLength(2);
    const processCombo = combos.find((c) => c.slice.domain === "Process");
    expect(processCombo?.sourceCount).toBe(2);
    const businessCombo = combos.find((c) => c.slice.domain === "Business Environment");
    expect(businessCombo?.sourceCount).toBe(1);
  });

  it("treats null domain/approach/difficulty as their own bucket rather than crashing", () => {
    const rows = [makeRow({ domain: null, approach: null, difficulty: null })];
    const combos = discoverCombos(rows);
    expect(combos).toHaveLength(1);
    expect(combos[0].slice.domain).toBeUndefined();
  });

  it("never invents a combination that isn't present in the input rows", () => {
    const rows = [makeRow({ interaction_type: "matching", answer_type: "single" })];
    const combos = discoverCombos(rows);
    expect(combos).toHaveLength(1);
    expect(combos[0].slice.interactionType).toBe("matching");
  });

  it("sorts combinations by source count descending", () => {
    const rows = [
      makeRow({ question_id: "AIQ-0001", domain: "Process" }),
      makeRow({ question_id: "AIQ-0002", domain: "Business Environment" }),
      makeRow({ question_id: "AIQ-0003", domain: "Business Environment" }),
      makeRow({ question_id: "AIQ-0004", domain: "Business Environment" }),
    ];
    const combos = discoverCombos(rows);
    expect(combos[0].slice.domain).toBe("Business Environment");
    expect(combos[0].sourceCount).toBe(3);
  });

  it("returns an empty list for an empty bank", () => {
    expect(discoverCombos([])).toEqual([]);
  });
});

describe("comboKey", () => {
  it("produces the same key regardless of which fields are undefined vs the same values", () => {
    const a = comboKey({ domain: "Process", approach: "Agile", difficulty: "Hard", interactionType: "standard", answerType: "single", count: 1 });
    const b = comboKey({ domain: "Process", approach: "Agile", difficulty: "Hard", interactionType: "standard", answerType: "single", count: 5 });
    expect(a).toBe(b);
  });

  it("produces different keys for different interaction types", () => {
    const a = comboKey({ interactionType: "standard", answerType: "single", count: 1 });
    const b = comboKey({ interactionType: "matching", answerType: "single", count: 1 });
    expect(a).not.toBe(b);
  });
});
