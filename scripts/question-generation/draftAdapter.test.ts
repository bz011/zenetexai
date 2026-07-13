import { describe, it, expect } from "vitest";
import { adaptDraftToWorkbookRows } from "./draftAdapter";
import type { RawGeneratedQuestion, PatternRow, GenerationTargetSlice } from "./types";

const pattern: PatternRow = {
  id: "pattern-1",
  certification_id: "cert-1",
  eco_version: "2021",
  domain: "Process",
  task: "Task 1",
  topic: "Risk",
  subtopic: null,
  approach: "Predictive",
  difficulty: "Medium",
  cognitive_level: "Apply",
  interaction_type: "standard",
  answer_type: "single",
  scenario_structure: "A PM discovers a new risk mid-sprint.",
  tested_decision: "Whether to escalate or update the risk register",
  correct_answer_principle: "Update the risk register first",
  distractor_strategies: ["premature escalation", "ignoring the process"],
  common_misconception: null,
  required_pmi_mindset: null,
  generation_guidance: null,
  source_question_ids: ["Q0001"],
  status: "active",
  times_used: 0,
  questions_generated: 0,
  questions_approved: 0,
  questions_rejected: 0,
  avg_quality_score: null,
  created_by: null,
};

const target: GenerationTargetSlice = { interactionType: "standard", answerType: "single", count: 1, domain: "Process" };

const rawDraft: RawGeneratedQuestion = {
  question_text_en: "What should the PM do first?",
  question_text_ar: "ماذا يجب أن يفعل مدير المشروع أولاً؟",
  explanation_en: "Because the register must reflect reality.",
  explanation_ar: "لأن السجل يجب أن يعكس الواقع.",
  domain: "Process",
  task: "Task 1",
  topic: "Risk",
  subtopic: "Risk Register",
  approach: "Predictive",
  difficulty: "Medium",
  cognitive_level: "Apply",
  tags: ["risk", "process"],
  options: [
    { option_key: "A", option_text_en: "Escalate immediately", option_text_ar: "تصعيد فوري", is_correct: false, feedback_en: "", feedback_ar: "" },
    { option_key: "B", option_text_en: "Update the risk register", option_text_ar: "تحديث سجل المخاطر", is_correct: true, feedback_en: "", feedback_ar: "" },
  ],
  matching_pairs: [],
  drag_and_drop_items: [],
  hotspot_brief: null,
  image_brief: null,
};

describe("adaptDraftToWorkbookRows", () => {
  it("always sets status to Needs Review, regardless of draft content - AI drafts are never auto-approved", () => {
    const adapted = adaptDraftToWorkbookRows(rawDraft, "AIQ000001", pattern, target, "PMP");
    expect(adapted.workbook.questions[0].status).toBe("Needs Review");
  });

  it("always sets has_image to FALSE at generation time, even for a graphic_based slice", () => {
    const graphicTarget: GenerationTargetSlice = { ...target, interactionType: "graphic_based" };
    const adapted = adaptDraftToWorkbookRows(rawDraft, "AIQ000002", pattern, graphicTarget, "PMP");
    expect(adapted.workbook.questions[0].has_image).toBe("FALSE");
    expect(adapted.imageBrief).toBeNull();
  });

  it("surfaces the image brief separately for graphic_based questions instead of fabricating image data", () => {
    const graphicTarget: GenerationTargetSlice = { ...target, interactionType: "graphic_based" };
    const draftWithBrief: RawGeneratedQuestion = { ...rawDraft, image_brief: "A Gantt chart showing a 3-week delay on the critical path" };
    const adapted = adaptDraftToWorkbookRows(draftWithBrief, "AIQ000003", pattern, graphicTarget, "PMP");
    expect(adapted.imageBrief).toBe("A Gantt chart showing a 3-week delay on the critical path");
    expect(adapted.workbook.images).toEqual([]);
  });

  it("never generates hotspot coordinates - hotspots array stays empty even when a hotspot brief is present", () => {
    const hotspotTarget: GenerationTargetSlice = { ...target, interactionType: "hotspot" };
    const draftWithHotspot: RawGeneratedQuestion = {
      ...rawDraft,
      hotspot_brief: { image_description: "A network diagram", target_description: "The critical path node" },
    };
    const adapted = adaptDraftToWorkbookRows(draftWithHotspot, "AIQ000004", pattern, hotspotTarget, "PMP");
    expect(adapted.workbook.hotspots).toEqual([]);
    expect(adapted.hotspotBrief).toEqual({ imageDescription: "A network diagram", targetDescription: "The critical path node" });
  });

  it("stamps the allocated AIQ question_id onto every generated row, never a self-computed ID", () => {
    const adapted = adaptDraftToWorkbookRows(rawDraft, "AIQ000005", pattern, target, "PMP");
    expect(adapted.workbook.questions[0].question_id).toBe("AIQ000005");
    expect(adapted.workbook.options.every((o) => o.question_id === "AIQ000005")).toBe(true);
  });

  it("tags the question source as AI Generated so downstream review queries can filter on it", () => {
    const adapted = adaptDraftToWorkbookRows(rawDraft, "AIQ000006", pattern, target, "PMP");
    expect(adapted.workbook.questions[0].source).toBe("AI Generated");
  });
});
