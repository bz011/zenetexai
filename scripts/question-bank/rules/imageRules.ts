/** Category G - Images Validation */

import type { WorkbookData, ValidationIssue } from "../types";
import { VALID_IMAGE_EXTENSIONS } from "../constants";

export function validateImages(data: WorkbookData): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const questionById = new Map(data.questions.map((q) => [q.question_id, q]));

  for (const img of data.images) {
    const question = questionById.get(img.question_id);
    if (!question) {
      issues.push({
        severity: "error",
        code: "ORPHAN_IMAGE_ROW",
        message: `question_images row references question_id "${img.question_id}" which does not exist.`,
        sheet: "question_images",
        questionId: img.question_id,
        ref: img.image_id,
      });
      continue;
    }

    if (!img.image_path || img.image_path.trim() === "") {
      issues.push({ severity: "error", code: "MISSING_IMAGE_PATH", message: "image_path is blank.", sheet: "question_images", questionId: img.question_id, ref: img.image_id });
    } else if (!VALID_IMAGE_EXTENSIONS.test(img.image_path.trim())) {
      issues.push({ severity: "warning", code: "SUSPICIOUS_IMAGE_PATH", message: `image_path "${img.image_path}" does not have a recognized image extension.`, sheet: "question_images", questionId: img.question_id, ref: img.image_id });
    }

    if (question.has_image !== "TRUE") {
      issues.push({ severity: "warning", code: "IMAGE_RECORD_MISMATCH", message: "question_images row exists but the question's has_image flag is not TRUE.", sheet: "question_images", questionId: img.question_id, ref: img.image_id });
    }
  }

  return issues;
}
