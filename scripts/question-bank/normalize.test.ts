import { describe, it, expect } from "vitest";
import { normalizeWorkbookData } from "./normalize";
import type { WorkbookData, QuestionRow, OptionRow } from "./types";

function baseData(overrides: Partial<WorkbookData>): WorkbookData {
  return {
    sheetNames: [],
    questions: [],
    options: [],
    matchingPairs: [],
    hotspots: [],
    dragDrop: [],
    images: [],
    ...overrides,
  };
}

function opt(overrides: Partial<OptionRow>): OptionRow {
  return {
    question_id: "Q000001",
    option_key: "A",
    option_text_en: "Option A",
    option_text_ar: "",
    display_order: "1",
    is_correct: "FALSE",
    feedback_en: "",
    feedback_ar: "",
    ...overrides,
  };
}

describe("normalizeWorkbookData - phantom row filtering", () => {
  it("drops a question row whose question_id is implausibly long (spilled cell content, not a real ID)", () => {
    const longId = "الإجابة الصحيحة".repeat(20);
    const data = baseData({ questions: [{ question_id: "Q000001" } as QuestionRow, { question_id: longId } as QuestionRow] });
    const { data: result, report } = normalizeWorkbookData(data);
    expect(result.questions).toHaveLength(1);
    expect(result.questions[0].question_id).toBe("Q000001");
    expect(report.droppedPhantomRowIds).toHaveLength(1);
  });

  it("keeps normal-length question IDs untouched, including AI-generated ones", () => {
    const data = baseData({ questions: [{ question_id: "Q000001" } as QuestionRow, { question_id: "AIQ000123" } as QuestionRow] });
    const { data: result } = normalizeWorkbookData(data);
    expect(result.questions.map((q) => q.question_id)).toEqual(["Q000001", "AIQ000123"]);
  });
});

describe("normalizeWorkbookData - literal duplicated header row", () => {
  it("drops an option row whose question_id is literally the header token 'question_id'", () => {
    const data = baseData({
      options: [
        { question_id: "question_id", option_key: "option_key", option_text_en: "", option_text_ar: "", display_order: "", is_correct: "", feedback_en: "", feedback_ar: "" },
        opt({}),
      ],
    });
    const { data: result, report } = normalizeWorkbookData(data);
    expect(result.options).toHaveLength(1);
    expect(result.options[0].option_key).toBe("A");
    expect(report.droppedLiteralHeaderRowCount).toBe(1);
  });

  it("does not drop a real option row that merely has option_key 'A' etc.", () => {
    const data = baseData({ options: [opt({ option_key: "A" }), opt({ option_key: "B" })] });
    const { data: result } = normalizeWorkbookData(data);
    expect(result.options).toHaveLength(2);
  });
});

describe("normalizeWorkbookData - answer_type alias", () => {
  it('normalizes "multiple" to "multiple_response"', () => {
    const data = baseData({ questions: [{ question_id: "Q000702", answer_type: "multiple" } as QuestionRow] });
    const { data: result, report } = normalizeWorkbookData(data);
    expect(result.questions[0].answer_type).toBe("multiple_response");
    expect(report.answerTypeNormalizedQuestionIds).toEqual(["Q000702"]);
  });

  it("leaves already-valid answer types untouched", () => {
    const data = baseData({ questions: [{ question_id: "Q1", answer_type: "single" } as QuestionRow] });
    const { data: result, report } = normalizeWorkbookData(data);
    expect(result.questions[0].answer_type).toBe("single");
    expect(report.answerTypeNormalizedQuestionIds).toHaveLength(0);
  });

  it("does NOT normalize an unknown/unrecognized answer_type - it must still fail validation downstream", () => {
    const data = baseData({ questions: [{ question_id: "Q1", answer_type: "banana" } as QuestionRow] });
    const { data: result } = normalizeWorkbookData(data);
    expect(result.questions[0].answer_type).toBe("banana");
  });
});

describe("normalizeWorkbookData - exact duplicate option row dedup", () => {
  it("collapses a fully byte-identical duplicated 4-option block into 4 unique rows (Q000762 pattern)", () => {
    const block = [opt({ option_key: "A" }), opt({ option_key: "B" }), opt({ option_key: "C", is_correct: "TRUE" }), opt({ option_key: "D" })];
    const data = baseData({ options: [...block, ...block] });
    const { data: result, report } = normalizeWorkbookData(data);
    expect(result.options).toHaveLength(4);
    expect(report.dedupedExactOptionRowCount).toBe(4);
  });

  it("does NOT collapse rows that share an option_key but differ in any other field (real conflict, must surface)", () => {
    const data = baseData({
      options: [opt({ option_key: "A", option_text_en: "First version" }), opt({ option_key: "A", option_text_en: "Different version" })],
    });
    const { data: result, report } = normalizeWorkbookData(data);
    expect(result.options).toHaveLength(2);
    expect(report.dedupedExactOptionRowCount).toBe(0);
  });
});
