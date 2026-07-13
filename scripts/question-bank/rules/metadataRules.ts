/** Category H - Metadata Validation */

import type { WorkbookData, ValidationIssue } from "../types";
import { VALID_STATUSES, VALID_SOURCES } from "../constants";

export function validateMetadata(data: WorkbookData): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const q of data.questions) {
    if (q.tags) {
      const tagList = q.tags.split(",").map((t) => t.trim()).filter(Boolean);
      const dupes = new Set(tagList.filter((t, i) => tagList.indexOf(t) !== i));
      for (const dupe of dupes) {
        issues.push({ severity: "warning", code: "DUPLICATE_TAG", message: `Tag "${dupe}" is duplicated within this question's tags.`, sheet: "questions", questionId: q.question_id });
      }
    }

    if (q.translation_verified !== "TRUE" && q.translation_verified !== "FALSE") {
      issues.push({ severity: "error", code: "INVALID_TRANSLATION_FLAG", message: `translation_verified "${q.translation_verified}" must be TRUE or FALSE.`, sheet: "questions", questionId: q.question_id });
    }

    if (!VALID_STATUSES.includes(q.status)) {
      issues.push({ severity: "error", code: "INVALID_STATUS", message: `status "${q.status}" is not one of: ${VALID_STATUSES.join(", ")}.`, sheet: "questions", questionId: q.question_id });
    }

    if (!VALID_SOURCES.includes(q.source)) {
      issues.push({ severity: "warning", code: "UNKNOWN_SOURCE", message: `source "${q.source}" is not in the currently-known set (${VALID_SOURCES.join(", ")}).`, sheet: "questions", questionId: q.question_id });
    }

    const reviewedBy = q.reviewed_by?.trim();
    if (reviewedBy) {
      const looksLikePlaceholder = reviewedBy === "TRUE" || reviewedBy === "FALSE" || /^\d+$/.test(reviewedBy);
      if (looksLikePlaceholder) {
        issues.push({ severity: "error", code: "INVALID_REVIEWED_BY_FORMAT", message: `reviewed_by "${reviewedBy}" does not look like a reviewer name/email.`, sheet: "questions", questionId: q.question_id });
      }
    }
  }

  return issues;
}
