-- ============================================================================
-- READ-ONLY verification: migrations 023 (simulator content/session RLS),
-- 024 (course-assessment RLS + bank-question extension), and 026 (admin
-- full-PMP-access bypass in has_active_capability).
--
-- Modifies nothing. Returns one human-readable row per check
-- (check_name, status) - no row contents, no user/PII data, just whether
-- the expected functions/policies/RLS flags exist. Run in the Supabase SQL
-- editor (or any client) against production with a role that can read
-- pg_policies/pg_class/pg_proc (the default postgres/service role can).
--
-- A FAIL here means the corresponding migration was not applied (or was
-- since reverted/altered) - it is not a data integrity issue, just a
-- schema/policy presence check. Investigate before assuming the underlying
-- security fix is live.
-- ============================================================================

WITH expected_policies (table_name, policy_name) AS (
  VALUES
    ('questions', 'Approved questions visible to authenticated'),
    ('question_options', 'Options visible with question access'),
    ('matching_items', 'Matching items visible with question access'),
    ('drag_and_drop_items', 'Drag-and-drop items visible with question access'),
    ('question_images', 'Images visible with question access'),
    ('practice_sessions', 'Users insert own practice sessions'),
    ('practice_session_questions', 'Users insert own practice session questions'),
    ('mock_exam_attempts', 'Users insert own mock exam attempts'),
    ('mock_exam_attempt_questions', 'Users insert own mock exam attempt questions'),
    ('learning_assessments', 'Published assessments visible to authenticated'),
    ('learning_assessment_questions', 'Assessment questions visible with assessment access'),
    ('learning_assessment_options', 'Assessment options visible with question access'),
    ('learning_assessment_question_links', 'Question links visible with assessment access'),
    ('learning_assessment_attempts', 'Users create own assessment attempts'),
    ('learning_assessment_attempt_answers', 'Users create own attempt answers')
),
policy_check AS (
  SELECT
    ep.table_name,
    ep.policy_name,
    EXISTS (
      SELECT 1 FROM pg_policies pp
      WHERE pp.schemaname = 'public' AND pp.tablename = ep.table_name AND pp.policyname = ep.policy_name
    ) AS policy_exists
  FROM expected_policies ep
),
rls_check AS (
  SELECT DISTINCT
    ep.table_name,
    (SELECT relrowsecurity FROM pg_class WHERE relname = ep.table_name AND relnamespace = 'public'::regnamespace) AS rls_enabled
  FROM expected_policies ep
),
function_checks (check_name, ok) AS (
  VALUES
    (
      'has_active_capability(uuid, text) exists',
      EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'has_active_capability')
    ),
    (
      'has_active_capability admin bypass present (migration 026)',
      EXISTS (
        SELECT 1 FROM pg_proc
        WHERE proname = 'has_active_capability'
          AND pg_get_functiondef(oid) ILIKE '%get_user_role() = ''admin''%'
      )
    ),
    (
      'has_course_assessment_access(uuid) exists (migration 024)',
      EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'has_course_assessment_access')
    ),
    (
      'questions SELECT policy includes course-assessment branch (migration 024, not just 023)',
      EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'questions' AND policyname = 'Approved questions visible to authenticated'
          AND qual ILIKE '%learning_assessment_question_links%'
      )
    )
)
SELECT 'RLS enabled: ' || table_name AS check_name,
       CASE WHEN rls_enabled THEN 'PASS' ELSE 'FAIL - RLS NOT ENABLED' END AS status
FROM rls_check

UNION ALL

SELECT 'Policy exists: "' || policy_name || '" ON ' || table_name,
       CASE WHEN policy_exists THEN 'PASS' ELSE 'FAIL - MISSING' END
FROM policy_check

UNION ALL

SELECT check_name,
       CASE WHEN ok THEN 'PASS' ELSE 'FAIL' END
FROM function_checks

ORDER BY status ASC, check_name;
