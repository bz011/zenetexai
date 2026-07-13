/** Category E - Hotspot Validation */

import type { WorkbookData, ValidationIssue } from "../types";

export function validateHotspots(data: WorkbookData): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const questionById = new Map(data.questions.map((q) => [q.question_id, q]));
  const imageCountByQuestion = new Map<string, number>();
  for (const img of data.images) {
    imageCountByQuestion.set(img.question_id, (imageCountByQuestion.get(img.question_id) ?? 0) + 1);
  }

  for (const hs of data.hotspots) {
    const question = questionById.get(hs.question_id);
    if (!question) {
      issues.push({
        severity: "error",
        code: "ORPHAN_HOTSPOT_ROW",
        message: `hotspots row references question_id "${hs.question_id}" which does not exist.`,
        sheet: "hotspots",
        questionId: hs.question_id,
        ref: hs.hotspot_id,
      });
      continue;
    }

    const x = Number(hs.x);
    const y = Number(hs.y);
    const width = Number(hs.width);
    const height = Number(hs.height);

    if (hs.x === "" || hs.y === "" || Number.isNaN(x) || Number.isNaN(y)) {
      issues.push({ severity: "warning", code: "HOTSPOT_NEEDS_REVIEW_COORDINATES", message: "x/y coordinates are missing or non-numeric - needs review before this question can be used.", sheet: "hotspots", questionId: hs.question_id, ref: hs.hotspot_id });
    }
    if (hs.width === "" || Number.isNaN(width) || width <= 0) {
      issues.push({ severity: "warning", code: "HOTSPOT_INVALID_WIDTH", message: "width is missing or not a positive number.", sheet: "hotspots", questionId: hs.question_id, ref: hs.hotspot_id });
    }
    if (hs.height === "" || Number.isNaN(height) || height <= 0) {
      issues.push({ severity: "warning", code: "HOTSPOT_INVALID_HEIGHT", message: "height is missing or not a positive number.", sheet: "hotspots", questionId: hs.question_id, ref: hs.hotspot_id });
    }
    if (question.has_image !== "TRUE" || !imageCountByQuestion.get(hs.question_id)) {
      issues.push({ severity: "error", code: "HOTSPOT_MISSING_IMAGE", message: "Hotspot question has no associated image (has_image must be TRUE with a matching question_images row).", sheet: "hotspots", questionId: hs.question_id, ref: hs.hotspot_id });
    }
  }

  return issues;
}
