/**
 * Turns raw generation_batch_questions rows into the distinct counts the
 * first Admin-UI pilot incident showed we needed - "Generated 5/5" alone
 * conflated attempts/LLM responses/valid drafts/quality rejections/pipeline
 * errors/saved-to-review-queue into one misleading number (see migration
 * 015's header comment). Kept as a plain module (no React) so it's
 * unit-testable the same way as every other pure computation in this
 * pipeline (computeFinalBatchStatus, discoverCombos, classifyGap).
 */

export type FailureStage =
  | "pattern_extraction"
  | "question_generation"
  | "critique_review"
  | "similarity_check"
  | "quality_gate"
  | "database_insertion"
  | "unexpected_error";

export const FAILURE_STAGE_LABELS: Record<FailureStage, string> = {
  pattern_extraction: "Pattern extraction",
  question_generation: "Question generation",
  critique_review: "Critique / translation / metadata review",
  similarity_check: "Similarity check",
  quality_gate: "Quality gate",
  database_insertion: "Database insertion",
  unexpected_error: "Unexpected error",
};

/**
 * A quality_gate rejection is the system working as designed - it produced
 * a valid draft and correctly declined to insert a weak one. Every other
 * stage means generation never even completed.
 */
const PIPELINE_ERROR_STAGES = new Set<FailureStage>([
  "pattern_extraction",
  "question_generation",
  "critique_review",
  "similarity_check",
  "database_insertion",
  "unexpected_error",
]);

export interface BatchQuestionAttempt {
  accepted: boolean;
  failure_stage: FailureStage | null;
  prompt_tokens: number | null;
  completion_tokens: number | null;
}

export interface AttemptsSummary {
  attempts: number;
  llmResponses: number;
  validDrafts: number;
  qualityRejected: number;
  pipelineErrors: number;
  savedToReviewQueue: number;
}

export function summarizeAttempts(rows: BatchQuestionAttempt[]): AttemptsSummary {
  return {
    attempts: rows.length,
    llmResponses: rows.filter((r) => (r.prompt_tokens ?? 0) + (r.completion_tokens ?? 0) > 0).length,
    validDrafts: rows.filter((r) => r.accepted || r.failure_stage === "quality_gate" || r.failure_stage === "database_insertion").length,
    qualityRejected: rows.filter((r) => r.failure_stage === "quality_gate").length,
    pipelineErrors: rows.filter((r) => r.failure_stage !== null && PIPELINE_ERROR_STAGES.has(r.failure_stage)).length,
    savedToReviewQueue: rows.filter((r) => r.accepted).length,
  };
}
