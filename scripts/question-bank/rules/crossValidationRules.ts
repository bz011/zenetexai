/**
 * Category I - Cross Validation
 *
 * Some of these overlap in intent with checks in optionRules/hotspotRules/
 * etc. (e.g. "standard question has options" is checked both here and via
 * the correct-answer-count logic in optionRules). That overlap is
 * intentional per spec - both categories are required independently - and
 * doesn't skew the health score, since scoring counts distinct affected
 * questions, not raw issue counts.
 */

import type { WorkbookData, ValidationIssue } from "../types";

function countBy(ids: string[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const id of ids) map.set(id, (map.get(id) ?? 0) + 1);
  return map;
}

export function validateCrossReferences(data: WorkbookData): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  const optionsByQuestion = countBy(data.options.map((o) => o.question_id));
  const hotspotsByQuestion = countBy(data.hotspots.map((h) => h.question_id));
  const dragDropByQuestion = countBy(data.dragDrop.map((d) => d.question_id));
  const matchingByQuestion = countBy(data.matchingPairs.map((m) => m.question_id));
  const imagesByQuestion = countBy(data.images.map((i) => i.question_id));

  const correctByQuestion = new Map<string, number>();
  for (const o of data.options) {
    if (o.is_correct === "TRUE") {
      correctByQuestion.set(o.question_id, (correctByQuestion.get(o.question_id) ?? 0) + 1);
    }
  }

  for (const q of data.questions) {
    const qid = q.question_id;

    switch (q.interaction_type) {
      case "standard":
        if (!optionsByQuestion.get(qid)) {
          issues.push({ severity: "error", code: "STANDARD_MISSING_OPTIONS", message: "standard question has no question_options rows.", sheet: "questions", questionId: qid });
        }
        break;
      case "graphic_based":
        if (!optionsByQuestion.get(qid)) {
          issues.push({ severity: "error", code: "GRAPHIC_MISSING_OPTIONS", message: "graphic_based question has no question_options rows.", sheet: "questions", questionId: qid });
        }
        if (q.has_image !== "TRUE" || !imagesByQuestion.get(qid)) {
          issues.push({ severity: "error", code: "GRAPHIC_MISSING_IMAGE", message: "graphic_based question must have has_image=TRUE and a matching question_images row.", sheet: "questions", questionId: qid });
        }
        break;
      case "hotspot":
        if (!hotspotsByQuestion.get(qid)) {
          issues.push({ severity: "error", code: "HOTSPOT_MISSING_RECORD", message: "hotspot question has no hotspots rows.", sheet: "questions", questionId: qid });
        }
        break;
      case "drag_and_drop":
        if (!dragDropByQuestion.get(qid)) {
          issues.push({ severity: "error", code: "DRAGDROP_MISSING_ITEMS", message: "drag_and_drop question has no drag_and_drop rows.", sheet: "questions", questionId: qid });
        }
        break;
      case "matching":
        if (!matchingByQuestion.get(qid)) {
          issues.push({ severity: "error", code: "MATCHING_MISSING_PAIRS", message: "matching question has no matching_pairs rows.", sheet: "questions", questionId: qid });
        }
        break;
      default:
        break;
    }

    if ((q.interaction_type === "standard" || q.interaction_type === "graphic_based")) {
      const correct = correctByQuestion.get(qid) ?? 0;
      if (q.answer_type === "single" && correct !== 1) {
        issues.push({ severity: "error", code: "ANSWER_TYPE_MISMATCH", message: `answer_type=single but ${correct} option(s) marked correct.`, sheet: "questions", questionId: qid });
      }
      if (q.answer_type === "multiple_response" && correct < 2) {
        issues.push({ severity: "error", code: "ANSWER_TYPE_MISMATCH", message: `answer_type=multiple_response but only ${correct} option(s) marked correct.`, sheet: "questions", questionId: qid });
      }
    }
  }

  return issues;
}
