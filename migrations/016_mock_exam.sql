-- ============================================================================
-- MIGRATION 016: PMP Mock Exam Engine (Sprint 9)
-- ============================================================================
-- Builds on migrations 005 (auth), 006 (courses), 007 (question bank), 012
-- (practice mode - the direct structural precedent for everything here).
--
-- REUSE, NOT DUPLICATION: exactly two new tables, same shape philosophy as
-- practice_sessions/practice_session_questions - no answer-key access
-- change, no second grading mechanism, no question-content snapshotting
-- (question_id only, ON DELETE SET NULL, same reasoning as migration 012).
--
-- WHY NO SINGLE "select + insert" RPC LIKE create_practice_session:
-- select_practice_questions is a single `ORDER BY random() LIMIT N` because
-- practice mode's selection has no multi-dimensional constraint to satisfy.
-- A Mock Exam's blueprint (domain x approach x difficulty x interaction
-- type, with a documented fallback hierarchy - see
-- src/features/mock-exam/services/blueprintEngine.ts) is a real allocation
-- algorithm, not expressible as one SQL query without duplicating that
-- logic in PL/pgSQL. The blueprint engine runs in TypeScript (unit-tested
-- independently of the database) and produces a final, validated, ordered
-- question_id list; create_mock_exam_attempt only needs to persist that
-- list atomically (re-validating it server-side, never trusting the list's
-- provenance blindly) - same "one function call = one transaction"
-- atomicity as create_practice_session, just with the hard part computed
-- one layer up.
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE mock_exam_attempt_status AS ENUM ('active', 'on_break', 'completed', 'expired', 'abandoned');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- TABLE: mock_exam_attempts
-- ============================================================================

CREATE TABLE IF NOT EXISTS mock_exam_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  certification_id UUID NOT NULL REFERENCES certifications(id),

  status mock_exam_attempt_status NOT NULL DEFAULT 'active',

  -- Blueprint identity + the FULLY RESOLVED allocation actually used for
  -- THIS attempt (post-fallback, post-inventory-check) - the versioned
  -- POLICY itself lives in code (src/features/mock-exam/config/
  -- examBlueprint.ts), never here. This column is the audit trail: what
  -- was actually assembled, including which fallback rules fired.
  blueprint_version TEXT NOT NULL,
  blueprint_snapshot JSONB NOT NULL,

  total_questions INT NOT NULL CHECK (total_questions > 0),
  current_question_index INT NOT NULL DEFAULT 0 CHECK (current_question_index >= 0),

  duration_seconds INT NOT NULL CHECK (duration_seconds > 0),

  -- Break state machine. A candidate can take at most a small, blueprint-
  -- defined number of breaks (currently 2, after fixed section boundaries -
  -- see examBlueprint.ts) - explicit columns, not a JSONB blob, since the
  -- shape is fixed and small, matching this codebase's preference for
  -- typed columns over loose JSON where the shape doesn't vary (same
  -- reasoning as practice_sessions' explicit filter_* columns).
  on_break BOOLEAN NOT NULL DEFAULT FALSE,
  break_started_at TIMESTAMPTZ,
  current_section INT NOT NULL DEFAULT 1 CHECK (current_section >= 1),
  breaks_taken INT[] NOT NULL DEFAULT '{}',
  sections_locked INT[] NOT NULL DEFAULT '{}',

  score INT CHECK (score IS NULL OR (score >= 0 AND score <= 100)),
  correct_count INT NOT NULL DEFAULT 0,
  incorrect_count INT NOT NULL DEFAULT 0,
  unanswered_count INT NOT NULL DEFAULT 0,

  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mock_exam_attempts_user ON mock_exam_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_mock_exam_attempts_user_status ON mock_exam_attempts(user_id, status);

DROP TRIGGER IF EXISTS set_mock_exam_attempts_updated_at ON mock_exam_attempts;
CREATE TRIGGER set_mock_exam_attempts_updated_at
  BEFORE UPDATE ON mock_exam_attempts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- TABLE: mock_exam_attempt_questions
-- ============================================================================
-- Fixed order at creation time, never re-randomized (sequence_number) -
-- identical guarantee to practice_session_questions. section_number is
-- derived from the blueprint's section boundaries at creation time and
-- stored (not recomputed) so it survives a blueprint config change made
-- after this attempt was created.

CREATE TABLE IF NOT EXISTS mock_exam_attempt_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES mock_exam_attempts(id) ON DELETE CASCADE,
  question_id TEXT REFERENCES questions(question_id) ON DELETE SET NULL,
  sequence_number INT NOT NULL CHECK (sequence_number >= 0),
  section_number INT NOT NULL CHECK (section_number >= 1),

  response JSONB,
  is_correct BOOLEAN,
  is_flagged BOOLEAN NOT NULL DEFAULT FALSE,
  answered_at TIMESTAMPTZ,
  time_spent_seconds INT NOT NULL DEFAULT 0 CHECK (time_spent_seconds >= 0),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(attempt_id, sequence_number),
  UNIQUE(attempt_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_mock_exam_attempt_questions_attempt ON mock_exam_attempt_questions(attempt_id);
CREATE INDEX IF NOT EXISTS idx_mock_exam_attempt_questions_question ON mock_exam_attempt_questions(question_id);

DROP TRIGGER IF EXISTS set_mock_exam_attempt_questions_updated_at ON mock_exam_attempt_questions;
CREATE TRIGGER set_mock_exam_attempt_questions_updated_at
  BEFORE UPDATE ON mock_exam_attempt_questions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE mock_exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_exam_attempt_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users select own mock exam attempts" ON mock_exam_attempts;
CREATE POLICY "Users select own mock exam attempts"
  ON mock_exam_attempts FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR get_user_role() IN ('admin', 'instructor'));

DROP POLICY IF EXISTS "Users insert own mock exam attempts" ON mock_exam_attempts;
CREATE POLICY "Users insert own mock exam attempts"
  ON mock_exam_attempts FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users update own mock exam attempts" ON mock_exam_attempts;
CREATE POLICY "Users update own mock exam attempts"
  ON mock_exam_attempts FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- No admin UPDATE/INSERT policy, same reasoning as practice_sessions: only
-- the owning student (or service-role grading) ever writes an attempt.

DROP POLICY IF EXISTS "Users select own mock exam attempt questions" ON mock_exam_attempt_questions;
CREATE POLICY "Users select own mock exam attempt questions"
  ON mock_exam_attempt_questions FOR SELECT TO authenticated
  USING (
    attempt_id IN (
      SELECT id FROM mock_exam_attempts
      WHERE user_id = auth.uid() OR get_user_role() IN ('admin', 'instructor')
    )
  );

DROP POLICY IF EXISTS "Users insert own mock exam attempt questions" ON mock_exam_attempt_questions;
CREATE POLICY "Users insert own mock exam attempt questions"
  ON mock_exam_attempt_questions FOR INSERT TO authenticated
  WITH CHECK (attempt_id IN (SELECT id FROM mock_exam_attempts WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users update own mock exam attempt questions" ON mock_exam_attempt_questions;
CREATE POLICY "Users update own mock exam attempt questions"
  ON mock_exam_attempt_questions FOR UPDATE TO authenticated
  USING (attempt_id IN (SELECT id FROM mock_exam_attempts WHERE user_id = auth.uid()))
  WITH CHECK (attempt_id IN (SELECT id FROM mock_exam_attempts WHERE user_id = auth.uid()));

-- is_correct here is a graded-result snapshot, same precedent as
-- practice_session_questions.is_correct - safe for the owner to read after
-- grading. Nothing here grants access to question_answer_key /
-- matching_answer_key / drag_and_drop_answer_key / hotspots - those remain
-- zero-access to `authenticated`, exactly as migration 007 defined.

-- ============================================================================
-- RPC: create_mock_exam_attempt(...)
-- ============================================================================
-- Takes an ALREADY-COMPUTED, already-validated ordered question_id list
-- (produced by the TypeScript blueprint engine) and persists attempt +
-- fixed-order questions atomically. Re-validates defensively server-side -
-- never trusts the list's origin - matching every other RPC's "the caller
-- could be wrong or malicious" posture, even though the only real caller is
-- our own Server Action.

CREATE OR REPLACE FUNCTION create_mock_exam_attempt(
  p_certification_id UUID,
  p_blueprint_version TEXT,
  p_blueprint_snapshot JSONB,
  p_question_ids TEXT[],
  p_section_numbers INT[],
  p_duration_seconds INT
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

  INSERT INTO mock_exam_attempts (
    user_id, certification_id, blueprint_version, blueprint_snapshot,
    total_questions, duration_seconds
  ) VALUES (
    auth.uid(), p_certification_id, p_blueprint_version, p_blueprint_snapshot,
    v_question_count, p_duration_seconds
  ) RETURNING id INTO v_attempt_id;

  INSERT INTO mock_exam_attempt_questions (attempt_id, question_id, sequence_number, section_number)
  SELECT v_attempt_id, qid, ordinality - 1, sect
  FROM unnest(p_question_ids, p_section_numbers) WITH ORDINALITY AS t(qid, sect, ordinality);

  RETURN jsonb_build_object('success', true, 'attempt_id', v_attempt_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

REVOKE ALL ON FUNCTION create_mock_exam_attempt(UUID, TEXT, JSONB, TEXT[], INT[], INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_mock_exam_attempt(UUID, TEXT, JSONB, TEXT[], INT[], INT) TO authenticated;

-- ============================================================================
-- END OF MIGRATION 016
-- ============================================================================
