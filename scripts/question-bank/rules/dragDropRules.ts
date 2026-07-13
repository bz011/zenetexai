/** Category F - Drag & Drop Validation */

import type { WorkbookData, ValidationIssue, DragDropRow } from "../types";

export function validateDragDrop(data: WorkbookData): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const questionById = new Map(data.questions.map((q) => [q.question_id, q]));
  const byQuestion = new Map<string, DragDropRow[]>();

  for (const item of data.dragDrop) {
    if (!questionById.has(item.question_id)) {
      issues.push({
        severity: "error",
        code: "ORPHAN_DRAGDROP_ROW",
        message: `drag_and_drop row references question_id "${item.question_id}" which does not exist.`,
        sheet: "drag_and_drop",
        questionId: item.question_id,
        ref: item.item_id,
      });
      continue;
    }
    const list = byQuestion.get(item.question_id) ?? [];
    list.push(item);
    byQuestion.set(item.question_id, list);
  }

  for (const [qid, items] of byQuestion) {
    const positions = items.map((i) => Number(i.correct_position));
    const uniquePositions = new Set(positions);

    if (uniquePositions.size !== positions.length) {
      issues.push({ severity: "error", code: "DRAGDROP_DUPLICATE_POSITION", message: "correct_position values are not unique for this question.", sheet: "drag_and_drop", questionId: qid });
    }

    for (let i = 1; i <= positions.length; i++) {
      if (!uniquePositions.has(i)) {
        issues.push({ severity: "error", code: "DRAGDROP_MISSING_POSITION", message: `Position ${i} is missing from the sequence (expected a contiguous 1..${positions.length}).`, sheet: "drag_and_drop", questionId: qid });
        break;
      }
    }
  }

  return issues;
}
