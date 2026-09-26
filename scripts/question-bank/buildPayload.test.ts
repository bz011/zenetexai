import { describe, it, expect } from "vitest";
import { buildQuestionPayload } from "./buildPayload";
import type { QuestionRow, OptionRow, MatchingPairRow, DragDropRow } from "./types";

const baseQuestion: QuestionRow = {
  question_id: "AIQ000001",
  certification: "pmp",
  eco_version: "2021",
  interaction_type: "standard",
  answer_type: "single",
  question_text_en: "What should the PM do first?",
  question_text_ar: "ماذا يجب أن يفعل مدير المشروع أولاً؟",
  source: "AI Generated",
  domain: "Process",
  task: "Task 1",
  topic: "Risk",
  subtopic: "Risk Register",
  approach: "Predictive",
  difficulty: "Medium",
  cognitive_level: "Apply",
  assessment_type: "Mock",
  original_language: "EN",
  translation_verified: "FALSE",
  status: "Needs Review",
  tags: "risk,process",
  notes: "",
  reviewed_by: "",
  has_image: "FALSE",
  image_path: "",
  explanation_en: "Because...",
  explanation_ar: "لأن...",
};

const options: OptionRow[] = [
  { question_id: "AIQ000001", option_key: "A", option_text_en: "Escalate", option_text_ar: "تصعيد", display_order: "1", is_correct: "FALSE", feedback_en: "", feedback_ar: "" },
  { question_id: "AIQ000001", option_key: "B", option_text_en: "Update the risk register", option_text_ar: "تحديث سجل المخاطر", display_order: "2", is_correct: "TRUE", feedback_en: "", feedback_ar: "" },
];

describe("buildQuestionPayload", () => {
  it("uppercases the certification code regardless of input casing", () => {
    const payload = buildQuestionPayload(baseQuestion, { options, matchingPairs: [], hotspots: [], dragDrop: [], images: [] });
    expect((payload.question as Record<string, unknown>).certification_code).toBe("PMP");
  });

  it("converts TRUE/FALSE strings to booleans for options", () => {
    const payload = buildQuestionPayload(baseQuestion, { options, matchingPairs: [], hotspots: [], dragDrop: [], images: [] });
    const opts = payload.options as { is_correct: boolean }[];
    expect(opts[0].is_correct).toBe(false);
    expect(opts[1].is_correct).toBe(true);
  });

  it("splits matching_pairs workbook rows into shuffled items + a separate correctness list", () => {
    const question: QuestionRow = { ...baseQuestion, interaction_type: "matching" };
    const pairs: MatchingPairRow[] = [
      { question_id: "AIQ000001", pair_id: "P1", left_text_en: "Plan", left_text_ar: "خطة", right_text_en: "Planning process", right_text_ar: "عملية التخطيط", display_order: "1" },
    ];
    const payload = buildQuestionPayload(question, { options: [], matchingPairs: pairs, hotspots: [], dragDrop: [], images: [] });

    const items = payload.matching_items as { item_id: string; side: string }[];
    const mappedPairs = payload.matching_pairs as { left_item_id: string; right_item_id: string }[];

    expect(items).toHaveLength(2);
    expect(items.map((i) => i.side).sort()).toEqual(["left", "right"]);
    expect(mappedPairs).toEqual([{ left_item_id: "P1_L", right_item_id: "P1_R" }]);
  });

  it("builds both the item list and the correct-position list for drag_and_drop", () => {
    const question: QuestionRow = { ...baseQuestion, interaction_type: "drag_and_drop" };
    const items: DragDropRow[] = [
      { question_id: "AIQ000001", item_id: "D1", item_text_en: "Initiate", item_text_ar: "بدء", correct_position: "1", category: "" },
      { question_id: "AIQ000001", item_id: "D2", item_text_en: "Plan", item_text_ar: "تخطيط", correct_position: "2", category: "" },
    ];
    const payload = buildQuestionPayload(question, { options: [], matchingPairs: [], hotspots: [], dragDrop: items, images: [] });

    const positions = payload.drag_and_drop_positions as { item_id: string; correct_position: number }[];
    expect(positions).toEqual([
      { item_id: "D1", correct_position: 1 },
      { item_id: "D2", correct_position: 2 },
    ]);
  });

  it("omits the images block for graphic_based questions with no attached image (AI-generated pending-asset case)", () => {
    const question: QuestionRow = { ...baseQuestion, interaction_type: "graphic_based" };
    const payload = buildQuestionPayload(question, { options, matchingPairs: [], hotspots: [], dragDrop: [], images: [] });
    expect(payload.images).toBeUndefined();
  });

  it("converts empty-string fields to null rather than empty strings", () => {
    const payload = buildQuestionPayload(baseQuestion, { options: [], matchingPairs: [], hotspots: [], dragDrop: [], images: [] });
    const question = payload.question as Record<string, unknown>;
    expect(question.notes).toBeNull();
    expect(question.reviewed_by).toBeNull();
  });

  it("normalizes a 'Needs Review' status string to the snake_case DB enum value", () => {
    const payload = buildQuestionPayload(baseQuestion, { options: [], matchingPairs: [], hotspots: [], dragDrop: [], images: [] });
    const question = payload.question as Record<string, unknown>;
    expect(question.status).toBe("needs_review");
  });
});
