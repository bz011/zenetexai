-- ============================================================================
-- MIGRATION 012: Practice Mode and Assessment Engine (Sprint 7)
-- ============================================================================
-- Builds on migrations 005 (auth), 006 (courses), 007 (question bank), 008
-- (AI generation) only.
--
-- REUSE, NOT DUPLICATION: this migration adds exactly two new tables.
-- Grading reuses the exact same answer-key tables and isolation pattern
-- migration 007 established (question_answer_key / matching_answer_key /
-- drag_and_drop_answer_key / hotspots - zero authenticated access, service-
-- role only). Nothing here adds a second way to read or write those tables.
--
-- NO QUESTION-CONTENT SNAPSHOTTING (explicit decision, not an oversight):
-- practice_session_questions stores only question_id + the student's
-- response/outcome, never a copy of the question text/options/etc. This
-- system already treats an approved question as stable content - there is
-- no question_versions/history table yet (migration 007 explicitly flagged
-- that as a future Phase 2 item, not built), so there is nothing today that
-- would change an approved question's content out from under a past
-- session anyway. If Phase 2 adds real content versioning, snapshotting
-- can be revisited then. The one real edge case - a question later
-- deleted or unpublished - is handled structurally instead: question_id is
-- ON DELETE SET NULL, and the review/runner code treats a null question_id
-- as "unavailable", never as a crash.
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE practice_session_status AS ENUM ('active', 'completed', 'abandoned', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE practice_language_preference AS ENUM ('en', 'ar', 'bilingual');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- TABLE: practice_sessions
-- ============================================================================

CREATE TABLE IF NOT EXISTS practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  certification_id UUID NOT NULL REFERENCES certifications(id),

  status practice_session_status NOT NULL DEFAULT 'active',

  -- Filters are display/audit metadata (shown in history, used to recompute
  -- the eligible pool if ever needed) - NOT the source of truth for grading
  -- or analytics breakdowns, which always join practice_session_questions
  -- back to the live questions table for domain/approach/difficulty/type.
  filter_domain question_domain,
  filter_approach question_approach,
  filter_difficulty question_difficulty,
  filter_interaction_type question_interaction_type,
  filter_answer_type question_answer_type,
  language_preference practice_language_preference NOT NULL DEFAULT 'en',

  question_count INT NOT NULL CHECK (question_count > 0 AND question_count <= 50),
  current_question_index INT NOT NULL DEFAULT 0 CHECK (current_question_index >= 0),

  is_timed BOOLEAN NOT NULL DEFAULT FALSE,
  duration_seconds INT CHECK (duration_seconds IS NULL OR duration_seconds > 0),
  remaining_seconds INT,

  score INT CHECK (score IS NULL OR (score >= 0 AND score <= 100)),
  correct_count INT NOT NULL DEFAULT 0,
  incorrect_count INT NOT NULL DEFAULT 0,
  unanswered_count INT NOT NULL DEFAULT 0,

  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT practice_sessions_timed_has_duration CHECK (NOT is_timed OR duration_seconds IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_practice_sessions_user ON practice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_status ON practice_sessions(user_id, status);

DROP TRIGGER IF EXISTS set_practice_sessions_updated_at ON practice_sessions;
CREATE TRIGGER set_practice_sessions_updated_at
  BEFORE UPDATE ON practice_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- TABLE: practice_session_questions
-- ============================================================================
-- One row per question in the session's fixed order (sequence_number),
-- created once at session-start time and never re-randomized. `response`
-- is the exact same per-type JSONB shape the Learning Quiz submit route
-- already uses (QuizSubmitAnswer) - one generalized shape across both
-- features, not a second bespoke one.

CREATE TABLE IF NOT EXISTS practice_session_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES practice_sessions(id) ON DELETE CASCADE,
  question_id TEXT REFERENCES questions(question_id) ON DELETE SET NULL,
  sequence_number INT NOT NULL CHECK (sequence_number >= 0),

  response JSONB,
  is_correct BOOLEAN,
  is_flagged BOOLEAN NOT NULL DEFAULT FALSE,
  answered_at TIMESTAMPTZ,
  time_spent_seconds INT NOT NULL DEFAULT 0 CHECK (time_spent_seconds >= 0),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(session_id, sequence_number),
  UNIQUE(session_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_practice_session_questions_session ON practice_session_questions(session_id);
CREATE INDEX IF NOT EXISTS idx_practice_session_questions_question ON practice_session_questions(question_id);

DROP TRIGGER IF EXISTS set_practice_session_questions_updated_at ON practice_session_questions;
CREATE TRIGGER set_practice_session_questions_updated_at
  BEFORE UPDATE ON practice_session_questions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_session_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users select own practice sessions" ON practice_sessions;
CREATE POLICY "Users select own practice sessions"
  ON practice_sessions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR get_user_role() IN ('admin', 'instructor'));

DROP POLICY IF EXISTS "Users insert own practice sessions" ON practice_sessions;
CREATE POLICY "Users insert own practice sessions"
  ON practice_sessions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users update own practice sessions" ON practice_sessions;
CREATE POLICY "Users update own practice sessions"
  ON practice_sessions FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admins get read-only access ("may inspect") - no admin UPDATE/INSERT
-- policy is added on purpose; only the owning student (or service-role
-- grading) ever writes a practice session.

DROP POLICY IF EXISTS "Users select own practice session questions" ON practice_session_questions;
CREATE POLICY "Users select own practice session questions"
  ON practice_session_questions FOR SELECT TO authenticated
  USING (
    session_id IN (
      SELECT id FROM practice_sessions
      WHERE user_id = auth.uid() OR get_user_role() IN ('admin', 'instructor')
    )
  );

DROP POLICY IF EXISTS "Users insert own practice session questions" ON practice_session_questions;
CREATE POLICY "Users insert own practice session questions"
  ON practice_session_questions FOR INSERT TO authenticated
  WITH CHECK (session_id IN (SELECT id FROM practice_sessions WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users update own practice session questions" ON practice_session_questions;
CREATE POLICY "Users update own practice session questions"
  ON practice_session_questions FOR UPDATE TO authenticated
  USING (session_id IN (SELECT id FROM practice_sessions WHERE user_id = auth.uid()))
  WITH CHECK (session_id IN (SELECT id FROM practice_sessions WHERE user_id = auth.uid()));

-- is_correct on this table is a snapshot written by the grading service
-- (same precedent as learning_assessment_attempt_answers.is_correct) - it
-- is a GRADED RESULT, not the answer key itself, so a student reading their
-- own row after submission is safe and intended. Nothing here grants
-- access to question_answer_key / matching_answer_key /
-- drag_and_drop_answer_key / hotspots - those remain zero-access to
-- `authenticated`, exactly as migration 007 defined.

-- ============================================================================
-- RPC: count_eligible_practice_questions(...) / select_practice_questions(...)
-- ============================================================================
-- Both are SECURITY INVOKER (the default) and safe to grant directly to
-- `authenticated`: they only ever return question_id values already
-- readable via `questions`' own "status = 'approved'" RLS policy (migration
-- 007) - no new data is exposed, just a randomized/counted view of rows the
-- caller could already read one at a time.

CREATE OR REPLACE FUNCTION count_eligible_practice_questions(
  p_certification_id UUID,
  p_domain question_domain DEFAULT NULL,
  p_approach question_approach DEFAULT NULL,
  p_difficulty question_difficulty DEFAULT NULL,
  p_interaction_type question_interaction_type DEFAULT NULL,
  p_answer_type question_answer_type DEFAULT NULL,
  p_language TEXT DEFAULT 'en'
)
RETURNS INT
LANGUAGE sql
STABLE
AS $$
  SELECT COUNT(*)::INT FROM questions q
  WHERE q.certification_id = p_certification_id
    AND q.status = 'approved'::question_status
    AND q.deleted_at IS NULL
    AND (p_domain IS NULL OR q.domain = p_domain)
    AND (p_approach IS NULL OR q.approach = p_approach)
    AND (p_difficulty IS NULL OR q.difficulty = p_difficulty)
    AND (p_interaction_type IS NULL OR q.interaction_type = p_interaction_type)
    AND (p_answer_type IS NULL OR q.answer_type = p_answer_type)
    AND (p_language = 'en' OR q.question_text_ar IS NOT NULL);
$$;

REVOKE ALL ON FUNCTION count_eligible_practice_questions(UUID, question_domain, question_approach, question_difficulty, question_interaction_type, question_answer_type, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION count_eligible_practice_questions(UUID, question_domain, question_approach, question_difficulty, question_interaction_type, question_answer_type, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION select_practice_questions(
  p_certification_id UUID,
  p_domain question_domain DEFAULT NULL,
  p_approach question_approach DEFAULT NULL,
  p_difficulty question_difficulty DEFAULT NULL,
  p_interaction_type question_interaction_type DEFAULT NULL,
  p_answer_type question_answer_type DEFAULT NULL,
  p_language TEXT DEFAULT 'en',
  p_limit INT DEFAULT 10
)
RETURNS TABLE (question_id TEXT)
LANGUAGE sql
STABLE
AS $$
  SELECT q.question_id FROM questions q
  WHERE q.certification_id = p_certification_id
    AND q.status = 'approved'::question_status
    AND q.deleted_at IS NULL
    AND (p_domain IS NULL OR q.domain = p_domain)
    AND (p_approach IS NULL OR q.approach = p_approach)
    AND (p_difficulty IS NULL OR q.difficulty = p_difficulty)
    AND (p_interaction_type IS NULL OR q.interaction_type = p_interaction_type)
    AND (p_answer_type IS NULL OR q.answer_type = p_answer_type)
    AND (p_language = 'en' OR q.question_text_ar IS NOT NULL)
  ORDER BY random()
  LIMIT p_limit;
$$;

REVOKE ALL ON FUNCTION select_practice_questions(UUID, question_domain, question_approach, question_difficulty, question_interaction_type, question_answer_type, TEXT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION select_practice_questions(UUID, question_domain, question_approach, question_difficulty, question_interaction_type, question_answer_type, TEXT, INT) TO authenticated;

-- ============================================================================
-- RPC: create_practice_session(...)
-- ============================================================================
-- Atomic session creation, same "one function call = one transaction"
-- precedent as import_question_bundle (migration 007): selects the
-- questions, re-checks the eligible count is actually sufficient (never
-- trust the client's earlier eligible-count read - it could be stale by
-- the time the student clicks Start), and inserts the session + its fixed-
-- order question rows together. Never takes a user_id parameter - always
-- auth.uid(), same reasoning as increment_study_time (migration 010): safe
-- to grant directly to `authenticated` because it can only ever create a
-- session owned by the caller.

CREATE OR REPLACE FUNCTION create_practice_session(
  p_certification_id UUID,
  p_domain question_domain DEFAULT NULL,
  p_approach question_approach DEFAULT NULL,
  p_difficulty question_difficulty DEFAULT NULL,
  p_interaction_type question_interaction_type DEFAULT NULL,
  p_answer_type question_answer_type DEFAULT NULL,
  p_language TEXT DEFAULT 'en',
  p_question_count INT DEFAULT 10,
  p_is_timed BOOLEAN DEFAULT FALSE,
  p_duration_seconds INT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_session_id UUID;
  v_question_ids TEXT[];
  v_available INT;
BEGIN
  IF p_question_count IS NULL OR p_question_count <= 0 OR p_question_count > 50 THEN
    RETURN jsonb_build_object('success', false, 'error', 'question_count must be between 1 and 50');
  END IF;
  IF p_is_timed AND (p_duration_seconds IS NULL OR p_duration_seconds <= 0) THEN
    RETURN jsonb_build_object('success', false, 'error', 'duration_seconds is required for a timed session');
  END IF;

  SELECT ARRAY(
    SELECT question_id FROM select_practice_questions(
      p_certification_id, p_domain, p_approach, p_difficulty, p_interaction_type, p_answer_type, p_language, p_question_count
    )
  ) INTO v_question_ids;

  v_available := COALESCE(array_length(v_question_ids, 1), 0);
  IF v_available < p_question_count THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_enough_eligible_questions', 'available', v_available);
  END IF;

  INSERT INTO practice_sessions (
    user_id, certification_id, filter_domain, filter_approach, filter_difficulty,
    filter_interaction_type, filter_answer_type, language_preference,
    question_count, is_timed, duration_seconds, remaining_seconds
  ) VALUES (
    auth.uid(), p_certification_id, p_domain, p_approach, p_difficulty,
    p_interaction_type, p_answer_type, p_language::practice_language_preference,
    p_question_count, p_is_timed, p_duration_seconds, p_duration_seconds
  ) RETURNING id INTO v_session_id;

  INSERT INTO practice_session_questions (session_id, question_id, sequence_number)
  SELECT v_session_id, qid, ordinality - 1
  FROM unnest(v_question_ids) WITH ORDINALITY AS t(qid, ordinality);

  RETURN jsonb_build_object('success', true, 'session_id', v_session_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

REVOKE ALL ON FUNCTION create_practice_session(UUID, question_domain, question_approach, question_difficulty, question_interaction_type, question_answer_type, TEXT, INT, BOOLEAN, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_practice_session(UUID, question_domain, question_approach, question_difficulty, question_interaction_type, question_answer_type, TEXT, INT, BOOLEAN, INT) TO authenticated;

-- ============================================================================
-- END OF MIGRATION 012
-- ============================================================================
