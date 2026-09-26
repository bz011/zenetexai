-- ============================================================================
-- MIGRATION 024: Close entitlement gap in course-assessment RLS
-- (Security Remediation Sprint 2, Part A)
-- ============================================================================
-- ROOT CAUSE (verified live, migrations 006 and 009 - no assumptions):
-- learning_assessments/learning_assessment_questions/
-- learning_assessment_options/learning_assessment_question_links were
-- readable by ANY authenticated user once published, with no 'course:pmp'
-- check at all - the same class of gap as F-01/F-02 (migration 023), just
-- for course lesson checkpoints / module assessments instead of the
-- Simulator. learning_assessment_attempts/attempt_answers were insertable
-- by any authenticated user for themselves, with no capability check
-- either - same class of gap as F-02.
--
-- A learning_assessment always belongs to exactly one course, via one of
-- two paths (migration 006's own CHECK constraint enforces exactly one):
--   type = 'checkpoint'        -> lesson_id -> lessons.module_id -> modules.course_id
--   type = 'module_assessment' -> module_id -> modules.course_id
-- has_course_assessment_access() below resolves either path to the owning
-- course's slug and checks 'course:' || slug via has_active_capability()
-- (already defined in migration 020 - not redefined here), so the app
-- never has to duplicate that resolution logic per policy.
--
-- SECOND, DISTINCT GAP DISCOVERED WHILE VERIFYING THE ACTUAL APPLICATION
-- FLOW (quizService.ts): a checkpoint/module_assessment can source its
-- questions from the BANK (learning_assessment_question_links ->
-- questions.question_id, migration 009) instead of the legacy
-- learning_assessment_questions table. getBankQuestions() reads
-- questions/question_options/question_images/matching_items/
-- drag_and_drop_items with the RLS-respecting client - the SAME tables
-- migration 023 (Sprint 1) just gated behind 'practice:pmp' OR
-- 'mock_exam:pmp'. Without this migration, a course:pmp-only student (no
-- Simulator purchase) would get ZERO rows back from a bank-linked course
-- checkpoint - not a security hole, but a real functional break of
-- "legitimate course assessment submission" the moment any admin links a
-- bank question to a course checkpoint. There are currently zero
-- learning_assessments/learning_assessment_question_links rows in
-- production (verified live), so this has no live impact yet, but it is
-- fixed now rather than shipped broken. This is why this migration also
-- touches (extends, via DROP+CREATE - never edits migration 023's file)
-- the questions/question_options/matching_items/drag_and_drop_items/
-- question_images SELECT policies: adding a third OR-branch that grants
-- visibility when the specific row is linked to a course-assessment the
-- caller already has course:pmp access to, alongside the two existing
-- branches (practice/mock_exam entitlement, admin/instructor) - neither
-- existing branch is narrowed.
--
-- Not touched: answer-key tables (question_answer_key, etc. - migration
-- 007, and learning_assessment_answer_key - migration 006) remain zero-
-- access to `authenticated`. SELECT/UPDATE on learning_assessment_attempts/
-- attempt_answers are unchanged (ownership-only remains sufficient once
-- INSERT requires entitlement - same reasoning as migration 023 for the
-- Simulator session tables). Ziina, Bunny, auth, pricing, purchases,
-- entitlements, and every migration 023 table's INSERT policy are
-- untouched.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Helper: does the CURRENT caller have course:pmp-equivalent access to a
-- given learning_assessment, via whichever course it actually belongs to?
--
-- MUST be SECURITY DEFINER, not INVOKER: this function reads
-- learning_assessments, and (below) learning_assessments' own SELECT
-- policy calls this function - if this function ran as SECURITY INVOKER,
-- evaluating its internal `FROM learning_assessments` would re-trigger
-- learning_assessments' RLS policy, which calls this function again,
-- infinitely (observed live as Postgres error 54001 "stack depth limit
-- exceeded" during testing - caught and fixed before this migration was
-- ever committed). SECURITY DEFINER runs this function's body as its
-- owner, bypassing RLS on the tables it reads internally, exactly the
-- same reasoning migration 005 already documents for get_user_role()
-- ("via SECURITY DEFINER to avoid RLS recursion"). This is still safe:
-- the function returns only a boolean, never row contents, and the
-- boolean itself is derived from has_active_capability(auth.uid(), ...)
-- - i.e. still gated on the CALLING user's own real entitlements, never
-- on the definer's privileges.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION has_course_assessment_access(p_assessment_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM learning_assessments la
    LEFT JOIN lessons l ON l.id = la.lesson_id
    JOIN modules m ON m.id = COALESCE(l.module_id, la.module_id)
    JOIN courses c ON c.id = m.course_id
    WHERE la.id = p_assessment_id
      AND la.is_published = TRUE
      AND has_active_capability(auth.uid(), 'course:' || c.slug)
  );
$$;

REVOKE ALL ON FUNCTION has_course_assessment_access(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION has_course_assessment_access(UUID) TO authenticated;

-- ----------------------------------------------------------------------------
-- learning_assessments / questions / options / bank links - SELECT
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Published assessments visible to authenticated" ON learning_assessments;
CREATE POLICY "Published assessments visible to authenticated"
  ON learning_assessments FOR SELECT TO authenticated
  USING (
    has_course_assessment_access(id)
    OR get_user_role() IN ('admin', 'instructor')
  );

DROP POLICY IF EXISTS "Assessment questions visible with assessment access" ON learning_assessment_questions;
CREATE POLICY "Assessment questions visible with assessment access"
  ON learning_assessment_questions FOR SELECT TO authenticated
  USING (
    has_course_assessment_access(assessment_id)
    OR get_user_role() IN ('admin', 'instructor')
  );

DROP POLICY IF EXISTS "Assessment options visible with question access" ON learning_assessment_options;
CREATE POLICY "Assessment options visible with question access"
  ON learning_assessment_options FOR SELECT TO authenticated
  USING (
    question_id IN (
      SELECT laq.id FROM learning_assessment_questions laq
      WHERE has_course_assessment_access(laq.assessment_id)
        OR get_user_role() IN ('admin', 'instructor')
    )
  );

DROP POLICY IF EXISTS "Question links visible with assessment access" ON learning_assessment_question_links;
CREATE POLICY "Question links visible with assessment access"
  ON learning_assessment_question_links FOR SELECT TO authenticated
  USING (
    has_course_assessment_access(assessment_id)
    OR get_user_role() IN ('admin', 'instructor')
  );

-- learning_assessment_answer_key: NO policies for `authenticated`, unchanged.

-- ----------------------------------------------------------------------------
-- learning_assessment_attempts / attempt_answers - INSERT
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users create own assessment attempts" ON learning_assessment_attempts;
CREATE POLICY "Users create own assessment attempts"
  ON learning_assessment_attempts FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND has_course_assessment_access(assessment_id)
  );

DROP POLICY IF EXISTS "Users create own attempt answers" ON learning_assessment_attempt_answers;
CREATE POLICY "Users create own attempt answers"
  ON learning_assessment_attempt_answers FOR INSERT TO authenticated
  WITH CHECK (
    attempt_id IN (
      SELECT laa.id FROM learning_assessment_attempts laa
      WHERE laa.user_id = auth.uid()
        AND has_course_assessment_access(laa.assessment_id)
    )
  );

-- SELECT/UPDATE on both tables unchanged (ownership-only) - see header comment.

-- ----------------------------------------------------------------------------
-- Extend migration 023's question-bank SELECT policies with a third
-- visibility branch: a bank question is also visible when it is linked to
-- a course-assessment the caller already has course:pmp-equivalent access
-- to. The existing 'practice:pmp'/'mock_exam:pmp' branch and the
-- admin/instructor branch are unchanged, only widened with an OR.
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Approved questions visible to authenticated" ON questions;
CREATE POLICY "Approved questions visible to authenticated"
  ON questions FOR SELECT TO authenticated
  USING (
    (
      status = 'approved'::question_status
      AND (
        has_active_capability(auth.uid(), 'practice:pmp')
        OR has_active_capability(auth.uid(), 'mock_exam:pmp')
        OR EXISTS (
          SELECT 1 FROM learning_assessment_question_links laql
          WHERE laql.question_id = questions.question_id
            AND has_course_assessment_access(laql.assessment_id)
        )
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
          OR EXISTS (
            SELECT 1 FROM learning_assessment_question_links laql
            WHERE laql.question_id = questions.question_id
              AND has_course_assessment_access(laql.assessment_id)
          )
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
          OR EXISTS (
            SELECT 1 FROM learning_assessment_question_links laql
            WHERE laql.question_id = questions.question_id
              AND has_course_assessment_access(laql.assessment_id)
          )
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
          OR EXISTS (
            SELECT 1 FROM learning_assessment_question_links laql
            WHERE laql.question_id = questions.question_id
              AND has_course_assessment_access(laql.assessment_id)
          )
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
          OR EXISTS (
            SELECT 1 FROM learning_assessment_question_links laql
            WHERE laql.question_id = questions.question_id
              AND has_course_assessment_access(laql.assessment_id)
          )
        )
      )
      OR get_user_role() IN ('admin', 'instructor')
    )
  );

-- ============================================================================
-- END OF MIGRATION 024
-- ============================================================================
