-- ============================================================================
-- MIGRATION 018: Mock Exam Retakes (Sprint 9.1, item 7A)
-- ============================================================================
-- Two new self-referencing columns on mock_exam_attempts:
--   retake_of_attempt_id - the DIRECT parent this attempt is a retake of
--     (NULL for an independently-generated exam).
--   root_attempt_id - the top-most ancestor (for an independently-generated
--     exam, this is its own id; for any retake in a chain, it's always the
--     ORIGINAL exam's id, however many retakes deep). Denormalized rather
--     than walked recursively on every read, since History grouping needs
--     this on every list query.
--
-- This is what lets "Exam A -> Retake -> Retake -> Start New Exam B" (see
-- the 7A spec) compute B's <=40 overlap against Exam A specifically (the
-- most recent row with retake_of_attempt_id IS NULL), never against a
-- retake's question set, and lets History group every retake under its
-- original by a single root_attempt_id match.

ALTER TABLE mock_exam_attempts
  ADD COLUMN IF NOT EXISTS retake_of_attempt_id UUID REFERENCES mock_exam_attempts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS root_attempt_id UUID REFERENCES mock_exam_attempts(id) ON DELETE SET NULL;

COMMENT ON COLUMN mock_exam_attempts.retake_of_attempt_id IS 'Direct parent attempt this is a retake of (same 180 question_ids/order/section allocation, fresh timer/answers). NULL for an independently-generated exam.';
COMMENT ON COLUMN mock_exam_attempts.root_attempt_id IS 'Denormalized top-most ancestor - equals this row''s own id for an independently-generated exam, or the original exam''s id for any retake in the chain. Used for History grouping and the previous-independent-exam overlap lookup.';

-- Backfill: every existing row (all created before retakes existed) is its
-- own root.
UPDATE mock_exam_attempts SET root_attempt_id = id WHERE root_attempt_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_mock_exam_attempts_root ON mock_exam_attempts(root_attempt_id);
CREATE INDEX IF NOT EXISTS idx_mock_exam_attempts_retake_of ON mock_exam_attempts(retake_of_attempt_id);

-- ============================================================================
-- RPC: create_mock_exam_attempt - extended with an optional retake source
-- ============================================================================
-- Adds one optional trailing parameter (p_retake_of_attempt_id) so every
-- existing caller (the normal new-exam path) is unaffected. When provided,
-- verifies the source attempt belongs to the caller and is terminal
-- (completed/expired) before allowing the retake - never trusts the
-- client-supplied id's ownership, same posture as every other RPC here.
--
-- A new parameter LIST (even an optional trailing one) is a distinct
-- overload to Postgres, not a replacement - CREATE OR REPLACE alone would
-- leave the old 6-arg version behind as an ambiguous duplicate. Drop it
-- explicitly first.

DROP FUNCTION IF EXISTS create_mock_exam_attempt(UUID, TEXT, JSONB, TEXT[], INT[], INT);

CREATE OR REPLACE FUNCTION create_mock_exam_attempt(
  p_certification_id UUID,
  p_blueprint_version TEXT,
  p_blueprint_snapshot JSONB,
  p_question_ids TEXT[],
  p_section_numbers INT[],
  p_duration_seconds INT,
  p_retake_of_attempt_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_attempt_id UUID;
  v_question_count INT;
  v_distinct_count INT;
  v_approved_count INT;
  v_source_owner UUID;
  v_source_status mock_exam_attempt_status;
  v_root_attempt_id UUID;
BEGIN
  v_question_count := COALESCE(array_length(p_question_ids, 1), 0);

  IF v_question_count = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'question_ids must not be empty');
  END IF;
  IF array_length(p_section_numbers, 1) IS DISTINCT FROM v_question_count THEN
    RETURN jsonb_build_object('success', false, 'error', 'section_numbers must have the same length as question_ids');
  END IF;
  IF p_duration_seconds IS NULL OR p_duration_seconds <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'duration_seconds must be positive');
  END IF;

  SELECT COUNT(DISTINCT qid) INTO v_distinct_count FROM unnest(p_question_ids) AS qid;
  IF v_distinct_count != v_question_count THEN
    RETURN jsonb_build_object('success', false, 'error', 'question_ids contains duplicates');
  END IF;

  SELECT COUNT(*) INTO v_approved_count
  FROM questions q
  WHERE q.question_id = ANY(p_question_ids)
    AND q.certification_id = p_certification_id
    AND q.status = 'approved'::question_status
    AND q.deleted_at IS NULL;

  IF v_approved_count != v_question_count THEN
    RETURN jsonb_build_object(
      'success', false, 'error', 'not_all_questions_approved',
      'expected', v_question_count, 'approved', v_approved_count
    );
  END IF;

  IF p_retake_of_attempt_id IS NOT NULL THEN
    SELECT user_id, status, COALESCE(root_attempt_id, id)
      INTO v_source_owner, v_source_status, v_root_attempt_id
    FROM mock_exam_attempts WHERE id = p_retake_of_attempt_id;

    IF v_source_owner IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'retake source attempt not found');
    END IF;
    IF v_source_owner != auth.uid() THEN
      RETURN jsonb_build_object('success', false, 'error', 'cannot retake another user''s attempt');
    END IF;
    IF v_source_status NOT IN ('completed'::mock_exam_attempt_status, 'expired'::mock_exam_attempt_status) THEN
      RETURN jsonb_build_object('success', false, 'error', 'source attempt is not yet completed');
    END IF;
  END IF;

  INSERT INTO mock_exam_attempts (
    user_id, certification_id, blueprint_version, blueprint_snapshot,
    total_questions, duration_seconds, retake_of_attempt_id, root_attempt_id
  ) VALUES (
    auth.uid(), p_certification_id, p_blueprint_version, p_blueprint_snapshot,
    v_question_count, p_duration_seconds, p_retake_of_attempt_id, v_root_attempt_id
  ) RETURNING id INTO v_attempt_id;

  -- An independently-generated exam is its own root - can't self-reference
  -- inside the INSERT's VALUES, so this is a fast single-row follow-up.
  IF p_retake_of_attempt_id IS NULL THEN
    UPDATE mock_exam_attempts SET root_attempt_id = v_attempt_id WHERE id = v_attempt_id;
  END IF;

  INSERT INTO mock_exam_attempt_questions (attempt_id, question_id, sequence_number, section_number)
  SELECT v_attempt_id, qid, ordinality - 1, sect
  FROM unnest(p_question_ids, p_section_numbers) WITH ORDINALITY AS t(qid, sect, ordinality);

  RETURN jsonb_build_object('success', true, 'attempt_id', v_attempt_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

REVOKE ALL ON FUNCTION create_mock_exam_attempt(UUID, TEXT, JSONB, TEXT[], INT[], INT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_mock_exam_attempt(UUID, TEXT, JSONB, TEXT[], INT[], INT, UUID) TO authenticated;

-- ============================================================================
-- END OF MIGRATION 018
-- ============================================================================
