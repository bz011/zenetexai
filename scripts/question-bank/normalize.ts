/**
 * Deterministic, narrow normalization applied to freshly-parsed workbook
 * data, before validation ever sees it. Every transform here is safe by
 * construction (never changes meaning, never invents content) - see the
 * Phase 2 reconciliation audit for the exact evidence behind each one.
 *
 * Deliberately NOT here: anything that requires judgment or fills in
 * missing content (a missing correct-option row, missing question text,
 * ambiguous enum values like "Adaptive"). Those stay rejected by design -
 * see questionRules.ts/optionRules.ts.
 */

import type { WorkbookData, QuestionRow, OptionRow } from "./types";

/** A real question_id is always short (Q000001 / AIQ000001 style). Anything
 * absurdly long is not an ID at all - it's stray cell content (observed
 * cause: a multi-paragraph explanation that spilled into its own phantom
 * row's question_id cell instead of staying in the previous row's
 * explanation_ar cell). Filtered out here, never fabricated into a real
 * question - callers that need to know what was dropped can compare
 * input/output lengths themselves (see phase2Import.ts). */
const MAX_PLAUSIBLE_QUESTION_ID_LENGTH = 30;

function isPlausibleQuestionId(id: string | undefined): boolean {
  return !!id && id.length > 0 && id.length <= MAX_PLAUSIBLE_QUESTION_ID_LENGTH;
}

/** Excel sometimes ends up with a literal duplicated header row baked into
 * a sheet's data area (e.g. question_id cell literally containing the text
 * "question_id"). Dropped narrowly - only rows whose question_id is
 * EXACTLY the header token are removed; nothing else is touched. */
function dropLiteralHeaderRows<T extends { question_id: string }>(rows: T[]): T[] {
  return rows.filter((r) => r.question_id !== "question_id");
}

/** Known, unambiguous synonyms for enum values the platform already
 * supports. Never a fuzzy/guessed mapping - each entry here must be
 * confirmed (via the explanation text or equivalent) to mean exactly the
 * canonical value, not just "probably". Deliberately small. */
const ANSWER_TYPE_ALIASES: Record<string, string> = {
  multiple: "multiple_response",
};

function normalizeAnswerType(value: string): string {
  return ANSWER_TYPE_ALIASES[value] ?? value;
}

/** Removes option rows that are BYTE-IDENTICAL duplicates of another row
 * for the same question (same key, text, order, correctness, feedback).
 * Rows that merely share an option_key but differ in any other field are
 * NOT touched - those are a real conflict (DUPLICATE_OPTION_KEY) that must
 * surface to the owner, not be silently resolved. */
function dedupeExactOptionRows(options: OptionRow[]): OptionRow[] {
  const seen = new Set<string>();
  const result: OptionRow[] = [];
  for (const opt of options) {
    const signature = [
      opt.question_id,
      opt.option_key,
      opt.option_text_en,
      opt.option_text_ar,
      opt.display_order,
      opt.is_correct,
      opt.feedback_en,
      opt.feedback_ar,
    ].join("");
    if (seen.has(signature)) continue;
    seen.add(signature);
    result.push(opt);
  }
  return result;
}

export interface NormalizationReport {
  droppedPhantomRowIds: string[];
  droppedLiteralHeaderRowCount: number;
  answerTypeNormalizedQuestionIds: string[];
  dedupedExactOptionRowCount: number;
}

export function normalizeWorkbookData(data: WorkbookData): { data: WorkbookData; report: NormalizationReport } {
  const report: NormalizationReport = {
    droppedPhantomRowIds: [],
    droppedLiteralHeaderRowCount: 0,
    answerTypeNormalizedQuestionIds: [],
    dedupedExactOptionRowCount: 0,
  };

  const plausibleQuestions: QuestionRow[] = [];
  for (const q of data.questions) {
    if (!isPlausibleQuestionId(q.question_id)) {
      report.droppedPhantomRowIds.push(q.question_id?.slice(0, 60) ?? "(empty)");
      continue;
    }
    plausibleQuestions.push(q);
  }

  const normalizedQuestions = plausibleQuestions.map((q) => {
    const normalizedAnswerType = normalizeAnswerType(q.answer_type);
    if (normalizedAnswerType !== q.answer_type) {
      report.answerTypeNormalizedQuestionIds.push(q.question_id);
    }
    return normalizedAnswerType === q.answer_type ? q : { ...q, answer_type: normalizedAnswerType };
  });

  const optionsBeforeHeaderDrop = data.options;
  const optionsAfterHeaderDrop = dropLiteralHeaderRows(optionsBeforeHeaderDrop);
  report.droppedLiteralHeaderRowCount = optionsBeforeHeaderDrop.length - optionsAfterHeaderDrop.length;

  const optionsAfterDedup = dedupeExactOptionRows(optionsAfterHeaderDrop);
  report.dedupedExactOptionRowCount = optionsAfterHeaderDrop.length - optionsAfterDedup.length;

  return {
    data: {
      ...data,
      questions: normalizedQuestions,
      options: optionsAfterDedup,
      hotspots: dropLiteralHeaderRows(data.hotspots),
      dragDrop: dropLiteralHeaderRows(data.dragDrop),
      images: dropLiteralHeaderRows(data.images),
      matchingPairs: dropLiteralHeaderRows(data.matchingPairs),
    },
    report,
  };
}
