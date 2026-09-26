/**
 * Category D - Matching Validation
 *
 * Schema assumption (documented, unverified against real data - the
 * workbook has no matching-type questions yet): each row in matching_pairs
 * represents ONE correct left/right pair. "Every left item mapped" means
 * left_text and right_text must both be present on every row.
 */

import type { WorkbookData, ValidationIssue, MatchingPairRow } from "../types";

export function validateMatchingPairs(data: WorkbookData): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const questionById = new Map(data.questions.map((q) => [q.question_id, q]));
  const byQuestion = new Map<string, MatchingPairRow[]>();

  for (const pair of data.matchingPairs) {
    if (!questionById.has(pair.question_id)) {
      issues.push({
        severity: "error",
        code: "ORPHAN_MATCHING_ROW",
        message: `matching_pairs row references question_id "${pair.question_id}" which does not exist.`,
        sheet: "matching_pairs",
        questionId: pair.question_id,
        ref: pair.pair_id,
      });
      continue;
    }

    if (!pair.left_text_en || !pair.right_text_en) {
      issues.push({
        severity: "error",
        code: "MATCHING_ITEM_NOT_MAPPED",
        message: "Every left item must be mapped to a right item (left_text_en/right_text_en cannot be blank).",
        sheet: "matching_pairs",
        questionId: pair.question_id,
        ref: pair.pair_id,
      });
    }

    const list = byQuestion.get(pair.question_id) ?? [];
    list.push(pair);
    byQuestion.set(pair.question_id, list);
  }

  for (const [qid, pairs] of byQuestion) {
    const pairIds = pairs.map((p) => p.pair_id);
    const dupes = new Set(pairIds.filter((id, i) => pairIds.indexOf(id) !== i));
    for (const dupe of dupes) {
      issues.push({ severity: "error", code: "DUPLICATE_MATCHING_MAPPING", message: `pair_id "${dupe}" appears more than once for this question.`, sheet: "matching_pairs", questionId: qid, ref: dupe });
    }
  }

  return issues;
}
