-- ============================================================================
-- MIGRATION 023: Close entitlement gap in question-bank / simulator RLS
-- (Security Remediation Sprint 1 — audit findings F-01 and F-02)
-- ============================================================================
-- ROOT CAUSE: entitlement ('practice:pmp' / 'mock_exam:pmp') was enforced
-- only at the application layer (hasCapability() on each page) and at the
-- RPC layer (create_practice_session_gated / create_mock_exam_attempt_gated,
-- migration 020, via has_active_capability()). Table-level RLS itself never
-- checked entitlement:
--   - questions/question_options/matching_items/drag_and_drop_items/
--     question_images (migration 007) were readable by ANY authenticated
--     user once a question was 'approved', regardless of whether that user
--     had ever paid for Practice/Mock Exam.
--   - practice_sessions/practice_session_questions (migration 012) and
--     mock_exam_attempts/mock_exam_attempt_questions (migrations 016/018)
--     were insertable by ANY authenticated user for themselves, regardless
--     of entitlement - the *_gated RPCs are the intended entry point, but a
--     direct PostgREST INSERT bypasses them entirely, since RLS (not the
--     RPC) is the actual trust boundary for anyone calling Supabase
--     directly rather than through the Next.js app.
--
-- This migration adds an entitlement predicate to those SELECT/INSERT
-- policies, reusing has_active_capability() (already defined in migration
-- 020 - not redefined here). It does NOT touch:
--   - question_answer_key / matching_answer_key / drag_and_drop_answer_key /
--     hotspots (still zero policies for `authenticated` - unaffected)
--   - the *_gated RPCs or the underlying ungated RPCs' EXECUTE grants
--     (already correctly restricted to postgres/service_role - migration
--     020 - re-verified, not modified, by this migration)
--   - SELECT/UPDATE policies on practice_sessions/practice_session_questions/
--     mock_exam_attempts/mock_exam_attempt_questions (still ownership-only -
--     sufficient once INSERT requires entitlement, since a non-entitled
--     user can no longer create a row to select/update in the first place;
--     changing UPDATE would risk breaking an already-legitimately-started
--     session if entitlement lapses mid-attempt, which is a product
--     decision out of scope for this security fix)
--   - purchases, entitlements, products, prices, Ziina, Bunny, auth, or any
--     other table/policy not listed above
-- ============================================================================

-- ----------------------------------------------------------------------------
-- F-01: question-bank content SELECT policies
-- ----------------------------------------------------------------------------
-- Approved content is now visible to authenticated users ONLY when they
-- currently hold an active 'practice:pmp' OR 'mock_exam:pmp' entitlement
-- (has_active_capability re-derives this from entitlements/
-- product_capabilities server-side on every call - never trusts a client
-- flag). Admin/instructor access is fully preserved and unchanged (still
-- sees ALL rows regardless of status, exactly as before).
--
-- Every child table's policy repeats the same condition explicitly, rather
-- than relying on the implicit RLS-on-RLS cascade through `questions` (which
-- would also work, since a subquery against an RLS-protected table is
-- itself subject to that table's policies) - explicit is safer to audit and
-- matches this migration's own child tables having genuinely different
-- shapes (question_options/matching_items/drag_and_drop_items/
-- question_images each join back to `questions` differently already).

DROP POLICY IF EXISTS "Approved questions visible to authenticated" ON questions;
CREATE POLICY "Approved questions visible to authenticated"
  ON questions FOR SELECT TO authenticated
  USING (
    (
      status = 'approved'::question_status
      AND (
        has_active_capability(auth.uid(), 'practice:pmp')
        OR has_active_capability(auth.uid(), 'mock_exam:pmp')
      )
    )
    OR get_user_role() IN ('admin', 'instructor')
  );

DROP POLICY IF EXISTS "Options visible with question access" ON question_options;
CREATE POLICY "Options visible with question access"
  ON question_options FOR SELECT TO authenticated
  USING (
    question_id IN (
      SELECT question_id FROM questions
      WHERE (
        status = 'approved'::question_status
        AND (
          has_active_capability(auth.uid(), 'practice:pmp')
          OR has_active_capability(auth.uid(), 'mock_exam:pmp')
        )
      )
      OR get_user_role() IN ('admin', 'instructor')
    )
  );

DROP POLICY IF EXISTS "Matching items visible with question access" ON matching_items;
CREATE POLICY "Matching items visible with question access"
  ON matching_items FOR SELECT TO authenticated
  USING (
    question_id IN (
      SELECT question_id FROM questions
      WHERE (
        status = 'approved'::question_status
        AND (
          has_active_capability(auth.uid(), 'practice:pmp')
          OR has_active_capability(auth.uid(), 'mock_exam:pmp')
        )
      )
      OR get_user_role() IN ('admin', 'instructor')
    )
  );

DROP POLICY IF EXISTS "Drag-and-drop items visible with question access" ON drag_and_drop_items;
CREATE POLICY "Drag-and-drop items visible with question access"
  ON drag_and_drop_items FOR SELECT TO authenticated
  USING (
    question_id IN (
      SELECT question_id FROM questions
      WHERE (
        status = 'approved'::question_status
        AND (
          has_active_capability(auth.uid(), 'practice:pmp')
          OR has_active_capability(auth.uid(), 'mock_exam:pmp')
        )
      )
      OR get_user_role() IN ('admin', 'instructor')
    )
  );

DROP POLICY IF EXISTS "Images visible with question access" ON question_images;
CREATE POLICY "Images visible with question access"
  ON question_images FOR SELECT TO authenticated
  USING (
    question_id IN (
      SELECT question_id FROM questions
      WHERE (
        status = 'approved'::question_status
        AND (
          has_active_capability(auth.uid(), 'practice:pmp')
          OR has_active_capability(auth.uid(), 'mock_exam:pmp')
        )
      )
      OR get_user_role() IN ('admin', 'instructor')
    )
  );

-- question_answer_key / matching_answer_key / drag_and_drop_answer_key /
-- hotspots: NO policies for `authenticated`, unchanged - still zero access
-- except service_role, exactly as migration 007 defined. Not touched here.

-- ----------------------------------------------------------------------------
-- F-02: practice/mock-exam session tables - INSERT policies
-- ----------------------------------------------------------------------------
-- Ownership (user_id = auth.uid() / session-belongs-to-me) is PRESERVED
-- exactly as before, ANDed with the matching entitlement. A direct
-- PostgREST INSERT without the corresponding capability is now rejected by
-- the database itself, independent of whether the caller went through
-- create_practice_session_gated()/create_mock_exam_attempt_gated().

DROP POLICY IF EXISTS "Users insert own practice sessions" ON practice_sessions;
CREATE POLICY "Users insert own practice sessions"
  ON practice_sessions FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND has_active_capability(auth.uid(), 'practice:pmp')
  );

DROP POLICY IF EXISTS "Users insert own practice session questions" ON practice_session_questions;
CREATE POLICY "Users insert own practice session questions"
  ON practice_session_questions FOR INSERT TO authenticated
  WITH CHECK (
    session_id IN (
      SELECT id FROM practice_sessions
      WHERE user_id = auth.uid()
        AND has_active_capability(auth.uid(), 'practice:pmp')
    )
  );

DROP POLICY IF EXISTS "Users insert own mock exam attempts" ON mock_exam_attempts;
CREATE POLICY "Users insert own mock exam attempts"
  ON mock_exam_attempts FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND has_active_capability(auth.uid(), 'mock_exam:pmp')
  );

DROP POLICY IF EXISTS "Users insert own mock exam attempt questions" ON mock_exam_attempt_questions;
CREATE POLICY "Users insert own mock exam attempt questions"
  ON mock_exam_attempt_questions FOR INSERT TO authenticated
  WITH CHECK (
    attempt_id IN (
      SELECT id FROM mock_exam_attempts
      WHERE user_id = auth.uid()
        AND has_active_capability(auth.uid(), 'mock_exam:pmp')
    )
  );

-- SELECT/UPDATE policies on these four tables are UNCHANGED (still
-- ownership-only) - not touched by this migration. See header comment for
-- why that is sufficient and intentional.

-- ============================================================================
-- END OF MIGRATION 023
-- ============================================================================
