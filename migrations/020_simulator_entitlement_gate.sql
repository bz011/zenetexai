-- ============================================================================
-- MIGRATION 020: Server-authoritative entitlement gate for the Simulator
-- (Sprint 10B — owner-approved: Practice/Mock Exam access becomes
-- commercial, not "any authenticated user")
-- ============================================================================
-- create_practice_session() (migration 012) and create_mock_exam_attempt()
-- (migrations 016/018) are GRANTed EXECUTE directly to `authenticated` -
-- correct when any logged-in user was meant to have Simulator access, no
-- longer correct now that Simulator access requires an entitlement.
--
-- This migration does NOT touch either function's body - no change to
-- question selection, blueprint composition, grading, timers, or retake
-- logic (per explicit Sprint 10 instruction not to modify the assessment
-- engines). It only changes WHO may call them directly: EXECUTE is revoked
-- from `authenticated` on the two real functions, and two new
-- capability-checking wrapper functions are added that verify
-- 'practice:pmp'/'mock_exam:pmp' via entitlements + product_capabilities
-- (migration 019) before delegating, unchanged, to the real function. The
-- application layer (practiceSessionService.ts, examAttemptService.ts) is
-- updated to call the *_gated wrapper names instead - see those files.
-- ============================================================================

CREATE OR REPLACE FUNCTION has_active_capability(p_user_id UUID, p_capability TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM entitlements e
    JOIN product_capabilities pc ON pc.product_id = e.product_id
    WHERE e.user_id = p_user_id
      AND e.status = 'active'
      AND (e.expires_at IS NULL OR e.expires_at > now())
      AND pc.capability = p_capability
  );
$$;

REVOKE ALL ON FUNCTION has_active_capability(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION has_active_capability(UUID, TEXT) TO authenticated;

REVOKE ALL ON FUNCTION create_practice_session(
  UUID, question_domain, question_approach, question_difficulty, question_interaction_type, question_answer_type, TEXT, INT, BOOLEAN, INT
) FROM authenticated;

REVOKE ALL ON FUNCTION create_mock_exam_attempt(
  UUID, TEXT, JSONB, TEXT[], INT[], INT, UUID
) FROM authenticated;

CREATE OR REPLACE FUNCTION create_practice_session_gated(
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
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT has_active_capability(auth.uid(), 'practice:pmp') THEN
    RETURN jsonb_build_object('success', false, 'error', 'capability_required');
  END IF;

  RETURN create_practice_session(
    p_certification_id, p_domain, p_approach, p_difficulty, p_interaction_type,
    p_answer_type, p_language, p_question_count, p_is_timed, p_duration_seconds
  );
END;
$$;

REVOKE ALL ON FUNCTION create_practice_session_gated(
  UUID, question_domain, question_approach, question_difficulty, question_interaction_type, question_answer_type, TEXT, INT, BOOLEAN, INT
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION create_practice_session_gated(
  UUID, question_domain, question_approach, question_difficulty, question_interaction_type, question_answer_type, TEXT, INT, BOOLEAN, INT
) TO authenticated;

CREATE OR REPLACE FUNCTION create_mock_exam_attempt_gated(
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
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT has_active_capability(auth.uid(), 'mock_exam:pmp') THEN
    RETURN jsonb_build_object('success', false, 'error', 'capability_required');
  END IF;

  RETURN create_mock_exam_attempt(
    p_certification_id, p_blueprint_version, p_blueprint_snapshot,
    p_question_ids, p_section_numbers, p_duration_seconds, p_retake_of_attempt_id
  );
END;
$$;

REVOKE ALL ON FUNCTION create_mock_exam_attempt_gated(
  UUID, TEXT, JSONB, TEXT[], INT[], INT, UUID
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION create_mock_exam_attempt_gated(
  UUID, TEXT, JSONB, TEXT[], INT[], INT, UUID
) TO authenticated;

-- ============================================================================
-- END OF MIGRATION 020
-- ============================================================================
