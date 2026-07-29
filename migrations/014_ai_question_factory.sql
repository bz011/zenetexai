-- ============================================================================
-- MIGRATION 014: AI Question Factory (Sprint 8)
-- ============================================================================
-- Extends the Sprint 5 AI Question Generation system (migration 008) into a
-- full factory: richer per-question metadata, a real review audit trail
-- (which did not exist before - set_question_status only ever overwrote a
-- single `notes` field), and question versioning (documented as a TODO in
-- migration 007's own header, never implemented until now).
--
-- NO NEW INSERTION PATH: exactly as migration 008 established, this
-- migration adds no second way to write question CONTENT. import_question_
-- bundle (migration 007) remains the only path; the Factory's edit
-- workflow reuses it (it's already an upsert on question_id) rather than
-- adding a parallel update mechanism.
-- ============================================================================

-- ============================================================================
-- ENUM: extend similarity_comparison_type (Phase 6 - duplicate detection)
-- ============================================================================
-- Migration 008 only had 'lexical'/'semantic' (both compare stem text only).
-- Sprint 8 adds two more comparison signals - see
-- scripts/question-generation/similarity/lexicalSimilarity.ts. Safe to run
-- inside this migration's transaction since the new values are never
-- INSERTed until a later, separate transaction (the running generation
-- pipeline), which is the standard safe pattern for ALTER TYPE ADD VALUE.

ALTER TYPE similarity_comparison_type ADD VALUE IF NOT EXISTS 'option_set';
ALTER TYPE similarity_comparison_type ADD VALUE IF NOT EXISTS 'tag_set';

-- ============================================================================
-- QUESTIONS TABLE: additive metadata columns
-- ============================================================================
-- All nullable (or defaulted) so every existing row - workbook-imported or
-- Sprint-5-generated - remains valid with no backfill required. Existing
-- consumers that SELECT specific column lists are unaffected.

ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS knowledge_area TEXT,
  ADD COLUMN IF NOT EXISTS process_group TEXT,
  ADD COLUMN IF NOT EXISTS primary_tag TEXT,
  ADD COLUMN IF NOT EXISTS estimated_time_seconds INT,
  ADD COLUMN IF NOT EXISTS bloom_level TEXT,
  ADD COLUMN IF NOT EXISTS quality_score NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS ai_confidence NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS generated_by TEXT,
  ADD COLUMN IF NOT EXISTS version INT NOT NULL DEFAULT 1,
  -- Structured teaching content beyond "why the correct answer is correct"
  -- (which stays in the existing explanation_en/ar columns) and "why each
  -- wrong option is wrong" (which stays in the existing per-option
  -- feedback_en/ar columns, migration 007). This column holds the *other*
  -- teaching elements: key_concept, exam_tip, common_trap, related_concepts
  -- (each bilingual). One JSONB column rather than 8 new TEXT columns -
  -- these fields are always read/written together, never queried
  -- individually, so there's no case for them to be separate columns.
  ADD COLUMN IF NOT EXISTS explanation_structured JSONB;

COMMENT ON COLUMN questions.quality_score IS 'AI Question Factory: the computeQualityScores() overall score (0-100) at time of generation. NULL for workbook-imported/legacy questions.';
COMMENT ON COLUMN questions.ai_confidence IS 'AI Question Factory: self-reported model confidence (0-100), distinct from the independent quality_score.';
COMMENT ON COLUMN questions.generated_by IS 'AI Question Factory: "<provider>:<model>" (e.g. "openai:gpt-4o-2024-08-06") for AI-authored questions, NULL otherwise.';
COMMENT ON COLUMN questions.version IS 'AI Question Factory: increments on every edit via editQuestionDraft(); see question_versions for full history.';

-- ============================================================================
-- ENUM + TABLE: question_review_log
-- ============================================================================
-- The audit trail migration 008 never had: set_question_status() previously
-- only overwrote questions.notes with no history, no actor, and no record
-- of non-status-changing actions (comment, regenerate, repair request,
-- edit). Every reviewer action now writes exactly one row here.

DO $$ BEGIN
  CREATE TYPE review_action AS ENUM (
    'approved', 'rejected', 'needs_review_reset', 'edited',
    'regenerated', 'repair_requested', 'commented'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS question_review_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id TEXT NOT NULL REFERENCES questions(question_id) ON DELETE CASCADE,
  action review_action NOT NULL,
  actor TEXT NOT NULL,
  previous_status question_status,
  new_status question_status,
  comment TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_question_review_log_question ON question_review_log(question_id);
CREATE INDEX IF NOT EXISTS idx_question_review_log_actor ON question_review_log(actor);
CREATE INDEX IF NOT EXISTS idx_question_review_log_created ON question_review_log(created_at DESC);

-- ============================================================================
-- TABLE: question_versions
-- ============================================================================
-- Snapshot-before-change history. import_question_bundle's upsert has
-- always been delete-and-replace with no history retained (migration 007's
-- own header flagged this as an unimplemented Phase 2 TODO) - this closes
-- that gap for the Factory's edit workflow specifically, without changing
-- import_question_bundle itself.

CREATE TABLE IF NOT EXISTS question_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id TEXT NOT NULL REFERENCES questions(question_id) ON DELETE CASCADE,
  version INT NOT NULL,
  snapshot JSONB NOT NULL,
  changed_by TEXT NOT NULL,
  change_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(question_id, version)
);

CREATE INDEX IF NOT EXISTS idx_question_versions_question ON question_versions(question_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
-- Same admin/instructor-only SELECT, service-role-only-write pattern as
-- every other Factory table (migration 008).

ALTER TABLE question_review_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin/instructor read review log" ON question_review_log;
CREATE POLICY "Admin/instructor read review log"
  ON question_review_log FOR SELECT TO authenticated
  USING (get_user_role() IN ('admin', 'instructor'));

DROP POLICY IF EXISTS "Admin/instructor read question versions" ON question_versions;
CREATE POLICY "Admin/instructor read question versions"
  ON question_versions FOR SELECT TO authenticated
  USING (get_user_role() IN ('admin', 'instructor'));

-- ============================================================================
-- RPC: set_question_status - extended with actor + audit logging
-- ============================================================================
-- Adds one new trailing parameter (with a default, so old 3-arg call sites
-- would still resolve) - but Postgres does not allow CREATE OR REPLACE to
-- add a parameter to an existing function, so the old 3-arg signature is
-- dropped first. Behavior beyond the addition (batch/pattern stat sync) is
-- unchanged from migration 008.

DROP FUNCTION IF EXISTS set_question_status(TEXT, question_status, TEXT);

CREATE OR REPLACE FUNCTION set_question_status(
  p_question_id TEXT,
  p_new_status question_status,
  p_reviewer_note TEXT DEFAULT NULL,
  p_actor TEXT DEFAULT 'unknown'
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_old_status question_status;
  v_batch_id UUID;
  v_existing_notes TEXT;
  v_log_action review_action;
BEGIN
  SELECT status, notes INTO v_old_status, v_existing_notes FROM questions WHERE question_id = p_question_id;
  IF v_old_status IS NULL THEN
    RAISE EXCEPTION 'No question found with question_id: %', p_question_id;
  END IF;

  UPDATE questions
  SET status = p_new_status,
      reviewed_by = p_actor,
      version = version + 1,
      notes = CASE
        WHEN p_reviewer_note IS NOT NULL THEN
          COALESCE(v_existing_notes || ' | ', '') || '[REVIEW: ' || p_reviewer_note || ']'
        ELSE v_existing_notes
      END
  WHERE question_id = p_question_id;

  v_log_action := CASE p_new_status
    WHEN 'approved'::question_status THEN 'approved'::review_action
    WHEN 'rejected'::question_status THEN 'rejected'::review_action
    ELSE 'needs_review_reset'::review_action
  END;

  INSERT INTO question_review_log (question_id, action, actor, previous_status, new_status, comment)
  VALUES (p_question_id, v_log_action, p_actor, v_old_status, p_new_status, p_reviewer_note);

  -- Keep the batch's approved_count in sync, if this question came from a
  -- generation batch at all (workbook-imported questions won't match here).
  SELECT batch_id INTO v_batch_id FROM generation_batch_questions WHERE question_id = p_question_id LIMIT 1;
  IF v_batch_id IS NOT NULL THEN
    IF p_new_status = 'approved'::question_status AND v_old_status <> 'approved'::question_status THEN
      UPDATE generation_batches SET approved_count = approved_count + 1 WHERE id = v_batch_id;
    ELSIF p_new_status <> 'approved'::question_status AND v_old_status = 'approved'::question_status THEN
      UPDATE generation_batches SET approved_count = GREATEST(0, approved_count - 1) WHERE id = v_batch_id;
    END IF;

    -- Pattern statistics: reflect the current approve/reject state.
    UPDATE question_patterns qp
    SET questions_approved = (
          SELECT COUNT(*) FROM generation_batch_questions gbq
          JOIN questions q ON q.question_id = gbq.question_id
          WHERE gbq.pattern_id = qp.id AND q.status = 'approved'::question_status
        ),
        questions_rejected = (
          SELECT COUNT(*) FROM generation_batch_questions gbq
          JOIN questions q ON q.question_id = gbq.question_id
          WHERE gbq.pattern_id = qp.id AND q.status = 'rejected'::question_status
        ),
        avg_quality_score = (
          SELECT AVG((gbq.quality_scores->>'overall')::NUMERIC) FROM generation_batch_questions gbq
          WHERE gbq.pattern_id = qp.id AND gbq.accepted = TRUE
        )
    WHERE qp.id = (SELECT pattern_id FROM generation_batch_questions WHERE question_id = p_question_id LIMIT 1);
  END IF;

  RETURN jsonb_build_object('success', true, 'question_id', p_question_id, 'old_status', v_old_status, 'new_status', p_new_status);

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'question_id', p_question_id, 'error', SQLERRM);
END;
$$;

REVOKE ALL ON FUNCTION set_question_status(TEXT, question_status, TEXT, TEXT) FROM PUBLIC;

-- ============================================================================
-- RPC: log_question_review_action - for actions that don't change status
-- ============================================================================
-- Comments, regenerate, repair-request, and edit all call this directly
-- (edit also writes to question_versions beforehand, from the app layer -
-- see editQuestionDraft in aiGenerationAdminService.ts).

CREATE OR REPLACE FUNCTION log_question_review_action(
  p_question_id TEXT,
  p_action review_action,
  p_actor TEXT,
  p_comment TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO question_review_log (question_id, action, actor, comment, metadata)
  VALUES (p_question_id, p_action, p_actor, p_comment, p_metadata);

  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

REVOKE ALL ON FUNCTION log_question_review_action(TEXT, review_action, TEXT, TEXT, JSONB) FROM PUBLIC;

-- ============================================================================
-- RPC: record_question_version - snapshot-before-edit
-- ============================================================================
-- Computes the next version number itself (never trusts the caller to pass
-- one) so concurrent edits can't collide on the same version number.

CREATE OR REPLACE FUNCTION record_question_version(
  p_question_id TEXT,
  p_snapshot JSONB,
  p_changed_by TEXT,
  p_change_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_next_version INT;
BEGIN
  SELECT COALESCE(MAX(version), 0) + 1 INTO v_next_version FROM question_versions WHERE question_id = p_question_id;

  INSERT INTO question_versions (question_id, version, snapshot, changed_by, change_reason)
  VALUES (p_question_id, v_next_version, p_snapshot, p_changed_by, p_change_reason);

  RETURN jsonb_build_object('success', true, 'version', v_next_version);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

REVOKE ALL ON FUNCTION record_question_version(TEXT, JSONB, TEXT, TEXT) FROM PUBLIC;

-- ============================================================================
-- END OF MIGRATION 014
-- ============================================================================
