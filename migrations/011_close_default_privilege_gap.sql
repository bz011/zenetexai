-- ============================================================================
-- MIGRATION 011: Close a default-privilege gap on write RPCs
-- ============================================================================
-- Discovered during the Sprint 6 live migration/verification run against
-- the real Supabase project (not visible from reading the SQL alone):
-- Supabase projects grant EXECUTE on newly-created public-schema functions
-- to anon/authenticated by DEFAULT, via a project-level
-- ALTER DEFAULT PRIVILEGES setting that exists outside any of this
-- project's own migration files. Every "REVOKE ALL ... FROM PUBLIC"
-- statement in migrations 007/008 correctly revoked the PUBLIC-level
-- grant, but that is a SEPARATE privilege from an explicit default grant
-- to anon/authenticated specifically - so on this real Supabase project,
-- unlike a bare/local Postgres instance, those two roles could actually
-- call these RPCs directly through PostgREST. A live has_function_privilege
-- check caught this; static review of the SQL could not have.
--
-- Actual impact was limited for most of these: they're SECURITY INVOKER
-- (the default), so the INSERT/UPDATE statements inside them still run
-- under RLS as the calling role, and none of questions/question_options/
-- matching_items/drag_and_drop_items/hotspots/question_embeddings grant
-- `authenticated` any INSERT/UPDATE policy - a direct call would already
-- have failed at the RLS layer even before this fix. next_ai_question_id()
-- is the one real exception: it only touches a bare SEQUENCE via nextval(),
-- which RLS cannot gate at all, so any authenticated (or anon) caller
-- really could have burned through AI question IDs before this fix - not a
-- data breach, but a genuine unintended capability, now closed.
-- ============================================================================

REVOKE ALL ON FUNCTION import_question_bundle(JSONB) FROM anon, authenticated;
REVOKE ALL ON FUNCTION next_ai_question_id() FROM anon, authenticated;
REVOKE ALL ON FUNCTION set_question_status(TEXT, question_status, TEXT) FROM anon, authenticated;
REVOKE ALL ON FUNCTION store_question_embedding(TEXT, TEXT, TEXT, JSONB) FROM anon, authenticated;
REVOKE ALL ON FUNCTION increment_pattern_usage(UUID) FROM anon, authenticated;
REVOKE ALL ON FUNCTION find_similar_questions(JSONB, INT, TEXT) FROM anon, authenticated;

-- increment_study_time() (migration 010) is the deliberate, documented
-- exception - it's SAFE and INTENDED to be callable by `authenticated`
-- directly, since it takes no user_id parameter (always auth.uid()) and
-- only ever affects the caller's own row. Left untouched here on purpose.

-- Forward-looking, second layer only - does not replace the explicit
-- REVOKEs above, which are what actually guarantee correctness today.
-- Prevents this from silently recurring for a function created by this
-- same connection role in a future migration that forgets an explicit
-- REVOKE FROM anon, authenticated.
DO $$
BEGIN
  EXECUTE format(
    'ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM anon, authenticated',
    current_user
  );
END $$;

-- ============================================================================
-- END OF MIGRATION 011
-- ============================================================================
