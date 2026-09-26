-- ============================================================================
-- MIGRATION 015: Generation failure audit logging (Sprint 8.1 incident follow-up)
-- ============================================================================
-- Root cause of the first Admin-UI pilot batch (298b560a-485a-4b5c-9eea-
-- e5f10222f1bc) showing "Generated 5/5, Rejected 5, Results 0" with zero
-- tokens: every one of the 5 attempts failed inside pattern extraction
-- (zero approved source questions existed for that exact domain/approach/
-- difficulty/interaction_type/answer_type slice) BEFORE any OpenAI call was
-- ever made. generateOneQuestion had no internal try/catch around that
-- stage, so the thrown error propagated all the way to runBatch's per-task
-- catch block, which only console.error'd it and incremented counters -
-- generation_batch_questions never got a row (no pattern_id/questionId to
-- attach it to) and generation_batches.error_message was never written
-- anywhere in the codebase despite the column existing since migration 008.
--
-- This migration adds the columns needed to persist a failure stage and
-- per-attempt token usage for EVERY attempt, including ones that die before
-- a draft or quality score ever exists. The application-side fix (making
-- generateOneQuestion record-and-return instead of throw for every pipeline
-- stage) is in generatePipeline.ts / generateBatch.ts - this migration only
-- adds the columns that fix depends on.
-- ============================================================================

ALTER TABLE generation_batch_questions
  ADD COLUMN IF NOT EXISTS failure_stage TEXT,
  ADD COLUMN IF NOT EXISTS prompt_tokens INT,
  ADD COLUMN IF NOT EXISTS completion_tokens INT;

COMMENT ON COLUMN generation_batch_questions.failure_stage IS
  'Which pipeline stage produced this outcome: pattern_extraction, question_generation, critique_review, similarity_check, quality_gate, database_insertion, or unexpected_error. NULL when accepted = true.';
COMMENT ON COLUMN generation_batch_questions.prompt_tokens IS
  'Prompt tokens consumed by THIS attempt specifically (not the batch aggregate on generation_batches) - lets a zero-token batch-level total be diagnosed down to which attempt(s) never reached the LLM at all.';
COMMENT ON COLUMN generation_batch_questions.completion_tokens IS
  'Completion tokens consumed by THIS attempt specifically - see prompt_tokens comment.';

-- pattern_id was already nullable (migration 008 never made it NOT NULL) -
-- confirmed here rather than assumed, since a pattern_extraction failure
-- means this row is inserted with pattern_id = NULL.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'generation_batch_questions'
      AND column_name = 'pattern_id'
      AND is_nullable = 'NO'
  ) THEN
    RAISE EXCEPTION 'generation_batch_questions.pattern_id is unexpectedly NOT NULL - this migration assumes it is nullable to record pattern_extraction failures.';
  END IF;
END $$;
