/**
 * Transforms parsed workbook rows for one question into the JSON payload
 * `import_question_bundle` expects. This is where the workbook's staging
 * format (e.g. one matching_pairs row = one correct pair, text on both
 * sides together) gets restructured into the DB's safe/secret split (shuffled
 * `matching_items` + separate `matching_pairs` correctness list) - the
 * workbook itself never needs to change shape for this, only the payload
 * built from it.
 */

import type { QuestionRow, OptionRow, MatchingPairRow, HotspotRow, DragDropRow, ImageRow } from "./types";

const SCHEMA_VERSION = 1;

export interface RelatedRows {
  options: OptionRow[];
  matchingPairs: MatchingPairRow[];
  hotspots: HotspotRow[];
  dragDrop: DragDropRow[];
  images: ImageRow[];
}

function toBool(value: string): boolean {
  return value.trim().toUpperCase() === "TRUE";
}

function parseTags(tags: string): string[] {
  return tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function mapStatus(status: string): string {
  return status.trim().toLowerCase().replace(/\s+/g, "_");
}

function orNull(value: string | undefined): string | null {
  return value && value.trim() !== "" ? value : null;
}

function buildQuestionBlock(question: QuestionRow): Record<string, unknown> {
  return {
    question_id: question.question_id,
    // Uppercased here as well as in the RPC's lookup (UPPER() on both sides) -
    // "PMP"/"pmp"/"PmP" must all resolve to the same certification.
    certification_code: (question.certification || "PMP").toUpperCase(),
    interaction_type: question.interaction_type,
    answer_type: question.answer_type,
    eco_version: orNull(question.eco_version),
    question_text_en: question.question_text_en,
    question_text_ar: orNull(question.question_text_ar),
    explanation_en: orNull(question.explanation_en),
    explanation_ar: orNull(question.explanation_ar),
    domain: orNull(question.domain),
    task: orNull(question.task),
    topic: orNull(question.topic),
    subtopic: orNull(question.subtopic),
    approach: orNull(question.approach),
    difficulty: orNull(question.difficulty),
    cognitive_level: orNull(question.cognitive_level),
    assessment_type: orNull(question.assessment_type),
    original_language: (question.original_language || "en").toLowerCase(),
    translation_verified: toBool(question.translation_verified),
    status: mapStatus(question.status),
    tags: parseTags(question.tags),
    notes: orNull(question.notes),
    reviewed_by: orNull(question.reviewed_by),
    has_image: toBool(question.has_image),
    source: orNull(question.source),
  };
}

/** Builds the RPC payload for one question, shaped per its interaction_type. */
export function buildQuestionPayload(
  question: QuestionRow,
  related: RelatedRows
): Record<string, unknown> {
  const base = {
    schema_version: SCHEMA_VERSION,
    question: buildQuestionBlock(question),
  };

  const imagesBlock = () => ({
    images: related.images.map((img) => ({
      image_id: img.image_id,
      image_path: img.image_path,
      image_alt_en: orNull(img.image_alt_en),
      image_alt_ar: orNull(img.image_alt_ar),
      display_order: Number(img.display_order) || 0,
    })),
  });

  switch (question.interaction_type) {
    case "standard":
    case "graphic_based": {
      const payload: Record<string, unknown> = {
        ...base,
        options: related.options.map((o) => ({
          option_key: o.option_key,
          option_text_en: o.option_text_en,
          option_text_ar: orNull(o.option_text_ar),
          display_order: Number(o.display_order) || 0,
          is_correct: toBool(o.is_correct),
          feedback_en: orNull(o.feedback_en),
          feedback_ar: orNull(o.feedback_ar),
        })),
      };
      if (question.interaction_type === "graphic_based" && related.images.length > 0) {
        Object.assign(payload, imagesBlock());
      }
      return payload;
    }

    case "hotspot": {
      return {
        ...base,
        ...imagesBlock(),
        hotspots: related.hotspots.map((h) => ({
          hotspot_id: h.hotspot_id,
          x: Number(h.x),
          y: Number(h.y),
          width: Number(h.width),
          height: Number(h.height),
          label: orNull(h.label),
        })),
      };
    }

    case "matching": {
      // Workbook stores one row per correct pair (left+right text together).
      // Split into shuffled matching_items (safe) + matching_pairs (secret
      // mapping by generated item_id) for the database.
      const items: Record<string, unknown>[] = [];
      const pairs: Record<string, unknown>[] = [];
      related.matchingPairs.forEach((pair, i) => {
        const leftId = `${pair.pair_id}_L`;
        const rightId = `${pair.pair_id}_R`;
        items.push({ item_id: leftId, side: "left", text_en: pair.left_text_en, text_ar: orNull(pair.left_text_ar), display_order: i + 1 });
        items.push({ item_id: rightId, side: "right", text_en: pair.right_text_en, text_ar: orNull(pair.right_text_ar), display_order: i + 1 });
        pairs.push({ left_item_id: leftId, right_item_id: rightId });
      });
      return { ...base, matching_items: items, matching_pairs: pairs };
    }

    case "drag_and_drop": {
      return {
        ...base,
        drag_and_drop_items: related.dragDrop.map((item, i) => ({
          item_id: item.item_id,
          item_text_en: item.item_text_en,
          item_text_ar: orNull(item.item_text_ar),
          category: orNull(item.category),
          display_order: i + 1,
        })),
        drag_and_drop_positions: related.dragDrop.map((item) => ({
          item_id: item.item_id,
          correct_position: Number(item.correct_position),
        })),
      };
    }

    default:
      return base;
  }
}
