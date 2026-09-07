-- ============================================================================
-- MIGRATION 026: Admin bypass for capability-gated access (full PMP access)
-- ============================================================================
-- Requirement: any authenticated user with profiles.role = 'admin' must have
-- full access to every capability-gated resource (PMP Course, Practice
-- Simulator, Mock Exam - course:pmp, practice:pmp, mock_exam:pmp) WITHOUT a
-- purchase, fake purchase, enrollment, or manually-inserted entitlement row.
--
-- has_active_capability(p_user_id, p_capability) (migration 020) is the
-- single, lowest-level function every capability check in the database
-- ultimately calls:
--   - RLS policies on question-bank/simulator-session tables (migration 023)
--   - RLS policies on course-assessment tables (migration 024), via
--     has_course_assessment_access() -> has_active_capability(auth.uid(), 'course:' || slug)
--   - create_practice_session_gated() / create_mock_exam_attempt_gated()
--     (migration 020), the RPCs the app calls to start a session/attempt
--
-- Adding the bypass HERE, once, cascades correctly through every one of
-- those layers with no other SQL changes - this is the "clean authorization
-- rule" requested, not a patch duplicated across policies/functions.
--
-- get_user_role() (migration 003) is the existing, already-battle-tested,
-- SECURITY DEFINER helper used by every other admin-bypass RLS policy in
-- this codebase (avoids any RLS-recursion/visibility concern on `profiles`
-- - see its own definition). Every real call site of has_active_capability
-- always passes p_user_id = auth.uid() (confirmed: it is never called with
-- another user's id anywhere in this codebase), so checking the CURRENT
-- session's role via get_user_role() is equivalent to checking p_user_id's
-- role in every actual invocation.
--
-- Ordinary students are entirely unaffected: get_user_role() = 'admin' is
-- false for them, so the OR short-circuits to exactly the same
-- entitlement-based EXISTS check as before - no behavior change for anyone
-- who isn't an admin.
--
-- COALESCE(..., false) matters: get_user_role() returns NULL (not 'student')
-- when no `profiles` row exists yet for auth.uid() (profiles.role is
-- NOT NULL, so this only happens when the row itself is missing entirely -
-- e.g. a signup-trigger race, or a genuinely orphaned auth user). Without
-- the COALESCE, `NULL OR EXISTS(...)` follows SQL three-valued logic and
-- returns NULL whenever the EXISTS side is false, silently turning this
-- BOOLEAN-typed function into one that can return SQL NULL - a real,
-- observed behavior change from the pre-migration version (a plain
-- EXISTS(...), which can never return NULL) caught by testing before this
-- shipped, not assumed. Confirmed via direct verification.
-- ============================================================================

CREATE OR REPLACE FUNCTION has_active_capability(p_user_id UUID, p_capability TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT
    COALESCE(get_user_role() = 'admin'::user_role, false)
    OR EXISTS (
      SELECT 1
      FROM entitlements e
      JOIN product_capabilities pc ON pc.product_id = e.product_id
      WHERE e.user_id = p_user_id
        AND e.status = 'active'
        AND (e.expires_at IS NULL OR e.expires_at > now())
        AND pc.capability = p_capability
    );
$$;

-- Grants are unchanged (already correct from migration 020) - CREATE OR
-- REPLACE preserves them, this is just a defensive re-statement.
REVOKE ALL ON FUNCTION has_active_capability(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION has_active_capability(UUID, TEXT) TO authenticated;

-- ============================================================================
-- END OF MIGRATION 026
-- ============================================================================
