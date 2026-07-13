/** Category C - Options Validation */

import type { WorkbookData, ValidationIssue, OptionRow } from "../types";

export function validateOptions(data: WorkbookData): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const questionById = new Map(data.questions.map((q) => [q.question_id, q]));
  const byQuestion = new Map<string, OptionRow[]>();

  for (const opt of data.options) {
    if (!questionById.has(opt.question_id)) {
      issues.push({
        severity: "error",
        code: "ORPHAN_OPTION_ROW",
        message: `question_options row references question_id "${opt.question_id}" which does not exist in questions.`,
        sheet: "question_options",
        questionId: opt.question_id,
        ref: opt.option_key,
      });
      continue;
    }

    const list = byQuestion.get(opt.question_id) ?? [];
    list.push(opt);
    byQuestion.set(opt.question_id, list);

    const order = Number(opt.display_order);
    if (opt.display_order === "" || Number.isNaN(order) || order < 0) {
      issues.push({
        severity: "error",
        code: "INVALID_DISPLAY_ORDER",
        message: `display_order "${opt.display_order}" is not a valid non-negative number.`,
        sheet: "question_options",
        questionId: opt.question_id,
        ref: opt.option_key,
      });
    }
  }

  for (const [qid, opts] of byQuestion) {
    const keys = opts.map((o) => o.option_key);
    const dupeKeys = new Set(keys.filter((k, i) => keys.indexOf(k) !== i));
    for (const dupe of dupeKeys) {
      issues.push({ severity: "error", code: "DUPLICATE_OPTION_KEY", message: `option_key "${dupe}" appears more than once for this question.`, sheet: "question_options", questionId: qid, ref: dupe });
    }

    const question = questionById.get(qid)!;
    const correctCount = opts.filter((o) => o.is_correct === "TRUE").length;

    if (question.answer_type === "single" && correctCount !== 1) {
      issues.push({
        severity: "error",
        code: "SINGLE_CHOICE_WRONG_CORRECT_COUNT",
        message: `Single-choice question has ${correctCount} correct option(s) marked; expected exactly 1.`,
        sheet: "question_options",
        questionId: qid,
      });
    }
    if (question.answer_type === "multiple_response" && correctCount < 2) {
      issues.push({
        severity: "error",
        code: "MULTI_RESPONSE_TOO_FEW_CORRECT",
        message: `Multiple-response question has ${correctCount} correct option(s) marked; expected 2 or more.`,
        sheet: "question_options",
        questionId: qid,
      });
    }
  }

  return issues;
}
