/** Category B - Question Validation */

import type { WorkbookData, ValidationIssue } from "../types";
import {
  VALID_DOMAINS,
  VALID_APPROACHES,
  VALID_DIFFICULTIES,
  VALID_INTERACTION_TYPES,
  VALID_ANSWER_TYPES,
  VALID_ASSESSMENT_TYPES,
} from "../constants";

function isBlank(value: string | undefined): boolean {
  return !value || value.trim() === "";
}

export function validateQuestions(data: WorkbookData): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const seenIds = new Map<string, number>();

  for (const q of data.questions) {
    const qid = q.question_id || "(missing id)";
    seenIds.set(qid, (seenIds.get(qid) ?? 0) + 1);

    if (isBlank(q.question_id)) {
      issues.push({ severity: "error", code: "MISSING_QUESTION_ID", message: "question_id is blank.", sheet: "questions", questionId: qid });
    }
    if (isBlank(q.certification) || isBlank(q.eco_version)) {
      issues.push({ severity: "error", code: "MISSING_REQUIRED_METADATA", message: "certification and/or eco_version is blank.", sheet: "questions", questionId: qid });
    }
    if (isBlank(q.question_text_en)) {
      issues.push({ severity: "error", code: "MISSING_ENGLISH_TEXT", message: "question_text_en is blank.", sheet: "questions", questionId: qid });
    }
    if (isBlank(q.question_text_ar)) {
      issues.push({ severity: "error", code: "MISSING_ARABIC_TEXT", message: "question_text_ar is blank.", sheet: "questions", questionId: qid });
    }
    if (isBlank(q.explanation_en)) {
      issues.push({ severity: "warning", code: "MISSING_EXPLANATION", message: "explanation_en is blank.", sheet: "questions", questionId: qid });
    }
    if (!VALID_DOMAINS.includes(q.domain)) {
      issues.push({ severity: "error", code: "INVALID_DOMAIN", message: `domain "${q.domain}" is not one of: ${VALID_DOMAINS.join(", ")}.`, sheet: "questions", questionId: qid });
    }
    // task/topic have no authoritative enum to validate against yet - flagged
    // as a documented limitation in the audit report. Non-blank is all that's
    // checked here.
    if (isBlank(q.task)) {
      issues.push({ severity: "warning", code: "MISSING_TASK", message: "task is blank.", sheet: "questions", questionId: qid });
    }
    if (isBlank(q.topic)) {
      issues.push({ severity: "warning", code: "MISSING_TOPIC", message: "topic is blank.", sheet: "questions", questionId: qid });
    }
    if (!VALID_DIFFICULTIES.includes(q.difficulty)) {
      issues.push({ severity: "error", code: "INVALID_DIFFICULTY", message: `difficulty "${q.difficulty}" is not one of: ${VALID_DIFFICULTIES.join(", ")}.`, sheet: "questions", questionId: qid });
    }
    if (!VALID_APPROACHES.includes(q.approach)) {
      issues.push({ severity: "error", code: "INVALID_APPROACH", message: `approach "${q.approach}" is not one of: ${VALID_APPROACHES.join(", ")}.`, sheet: "questions", questionId: qid });
    }
    if (!VALID_INTERACTION_TYPES.includes(q.interaction_type)) {
      issues.push({ severity: "error", code: "INVALID_INTERACTION_TYPE", message: `interaction_type "${q.interaction_type}" is not one of: ${VALID_INTERACTION_TYPES.join(", ")}.`, sheet: "questions", questionId: qid });
    }
    if (!VALID_ANSWER_TYPES.includes(q.answer_type)) {
      issues.push({ severity: "error", code: "INVALID_ANSWER_TYPE", message: `answer_type "${q.answer_type}" is not one of: ${VALID_ANSWER_TYPES.join(", ")}.`, sheet: "questions", questionId: qid });
    }
    if (!VALID_ASSESSMENT_TYPES.includes(q.assessment_type)) {
      issues.push({ severity: "warning", code: "UNKNOWN_ASSESSMENT_TYPE", message: `assessment_type "${q.assessment_type}" is not in the currently-known set (${VALID_ASSESSMENT_TYPES.join(", ")}) - confirm this is intentional before treating it as valid.`, sheet: "questions", questionId: qid });
    }
  }

  for (const [qid, count] of seenIds) {
    if (count > 1) {
      issues.push({ severity: "error", code: "DUPLICATE_QUESTION_ID", message: `question_id "${qid}" appears ${count} times.`, sheet: "questions", questionId: qid });
    }
  }

  return issues;
}
