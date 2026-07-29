/**
 * Converts an LLM-generated draft into the EXACT same row shapes the
 * Sprint 3.5 workbook validator and Sprint 4 buildQuestionPayload already
 * consume (QuestionRow/OptionRow/MatchingPairRow/DragDropRow/ImageRow -
 * all string-typed, workbook-CSV-shaped). This is what lets the AI pipeline
 * reuse both of those modules unmodified instead of maintaining a second,
 * parallel validation/insertion system.
 */

import type {
  QuestionRow,
  OptionRow,
  MatchingPairRow,
  HotspotRow,
  DragDropRow,
  ImageRow,
  WorkbookData,
} from "../question-bank/types";
import type { RawGeneratedQuestion, PatternRow, GenerationTargetSlice } from "./types";

export interface AdaptedDraft {
  workbook: WorkbookData;
  imageBrief: string | null;
  hotspotBrief: { imageDescription: string; targetDescription: string } | null;
  // Sprint 8 additions - not part of the workbook CSV row shape, so they
  // don't go through import_question_bundle. insertDraft.ts writes these
  // via a follow-up UPDATE after the bundle insert succeeds.
  factoryMetadata: {
    knowledgeArea: string | null;
    processGroup: string | null;
    primaryTag: string;
    estimatedTimeSeconds: number;
    bloomLevel: string;
    confidence: number;
    explanationStructured: {
      key_concept_en: string; key_concept_ar: string;
      exam_tip_en: string; exam_tip_ar: string;
      common_trap_en: string; common_trap_ar: string;
      related_concepts_en: string[]; related_concepts_ar: string[];
    };
  };
}

function boolToStr(value: boolean): string {
  return value ? "TRUE" : "FALSE";
}

export function adaptDraftToWorkbookRows(
  draft: RawGeneratedQuestion,
  questionId: string,
  pattern: PatternRow,
  target: GenerationTargetSlice,
  certificationCode: string
): AdaptedDraft {
  const question: QuestionRow = {
    question_id: questionId,
    certification: certificationCode,
    eco_version: pattern.eco_version ?? "",
    interaction_type: target.interactionType,
    answer_type: target.answerType,
    question_text_en: draft.question_text_en,
    question_text_ar: draft.question_text_ar,
    source: "AI Generated",
    domain: draft.domain,
    task: draft.task,
    topic: draft.topic,
    subtopic: draft.subtopic,
    approach: draft.approach,
    difficulty: draft.difficulty,
    cognitive_level: draft.cognitive_level,
    assessment_type: "Mock",
    original_language: "EN",
    translation_verified: "FALSE",
    status: "Needs Review",
    tags: draft.tags.join(","),
    notes: "",
    reviewed_by: "",
    // graphic_based/hotspot never claim to have a real image at generation
    // time - a human must attach one before has_image should ever be TRUE.
    has_image: "FALSE",
    image_path: "",
    explanation_en: draft.explanation_en,
    explanation_ar: draft.explanation_ar,
  };

  const options: OptionRow[] =
    target.interactionType === "standard" || target.interactionType === "graphic_based"
      ? draft.options.map((o, i) => ({
          question_id: questionId,
          option_key: o.option_key,
          option_text_en: o.option_text_en,
          option_text_ar: o.option_text_ar,
          display_order: String(i + 1),
          is_correct: boolToStr(o.is_correct),
          feedback_en: o.feedback_en,
          feedback_ar: o.feedback_ar,
        }))
      : [];

  const matchingPairs: MatchingPairRow[] =
    target.interactionType === "matching"
      ? draft.matching_pairs.map((p, i) => ({
          question_id: questionId,
          pair_id: `P${i + 1}`,
          left_text_en: p.left_text_en,
          left_text_ar: p.left_text_ar,
          right_text_en: p.right_text_en,
          right_text_ar: p.right_text_ar,
          display_order: String(i + 1),
        }))
      : [];

  const dragDrop: DragDropRow[] =
    target.interactionType === "drag_and_drop"
      ? draft.drag_and_drop_items.map((item, i) => ({
          question_id: questionId,
          item_id: `D${i + 1}`,
          item_text_en: item.item_text_en,
          item_text_ar: item.item_text_ar,
          correct_position: String(item.correct_position),
          category: item.category,
        }))
      : [];

  // Hotspot images/coordinates are never generated - both arrays stay
  // empty. The brief is surfaced separately for a human to act on.
  const hotspots: HotspotRow[] = [];
  const images: ImageRow[] = [];

  const workbook: WorkbookData = {
    sheetNames: ["questions", "question_options", "matching_pairs", "hotspots", "drag_and_drop", "question_images"],
    questions: [question],
    options,
    matchingPairs,
    hotspots,
    dragDrop,
    images,
  };

  return {
    workbook,
    imageBrief: target.interactionType === "graphic_based" ? draft.image_brief : null,
    hotspotBrief:
      target.interactionType === "hotspot" && draft.hotspot_brief
        ? { imageDescription: draft.hotspot_brief.image_description, targetDescription: draft.hotspot_brief.target_description }
        : null,
    factoryMetadata: {
      knowledgeArea: draft.knowledge_area,
      processGroup: draft.process_group,
      primaryTag: draft.primary_tag,
      estimatedTimeSeconds: draft.estimated_time_seconds,
      bloomLevel: draft.bloom_level,
      confidence: draft.confidence,
      explanationStructured: draft.explanation_extras,
    },
  };
}
