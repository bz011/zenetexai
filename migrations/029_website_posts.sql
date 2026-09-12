-- ============================================================================
-- MIGRATION 029: website_posts (versioned schema for the SEO blog table)
-- ============================================================================
-- website_posts already exists in the live database - it was brought into
-- being by an inline `CREATE TABLE IF NOT EXISTS` inside
-- src/app/api/publish-post/route.ts (pre-existing code) the first time that
-- statement ever ran, via scripts/seo/seedBlogPosts.ts. That is not
-- reproducible infrastructure: a fresh environment (new preview DB, disaster
-- recovery) would only get this table if that one API route happened to be
-- invoked first. This migration makes the schema an explicit, versioned,
-- reviewable artifact instead, exactly like every other table in this repo.
--
-- CREATE TABLE IF NOT EXISTS is safe to run against the existing database:
-- the table already matches this shape exactly (verified live before writing
-- this migration - see columns/constraints below), so this statement is a
-- no-op there. It only actually creates the table on an environment where it
-- doesn't exist yet (fresh DB, preview branch). Nothing here drops,
-- truncates, renames, or recreates the table, and no existing row is ever
-- touched by any statement in this file.
--
-- Column shape matches the live table byte-for-byte:
--   id                UUID PRIMARY KEY DEFAULT gen_random_uuid()
--   title             TEXT NOT NULL
--   slug              TEXT NOT NULL UNIQUE   (website_posts_slug_key)
--   body              TEXT NOT NULL
--   meta_title        TEXT NOT NULL
--   meta_description  TEXT NOT NULL
--   created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
--   published_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
--
-- PORTABILITY NOTE (added after discovering Vercel Production's DATABASE_URL
-- is actually a Neon database, role neondb_owner - a completely different
-- Postgres provider from the Supabase-hosted project this migration was
-- first written and applied against): this file was originally written with
-- an unconditional Supabase-specific hardening section below (ENABLE ROW
-- LEVEL SECURITY + REVOKE ... FROM anon, authenticated). That version would
-- have HARD-FAILED on Neon (or any plain Postgres instance) the moment a
-- sequential migration runner reached it, because `anon`/`authenticated` are
-- Supabase Auth/PostgREST-provisioned roles that do not exist outside a
-- Supabase project - a REVOKE naming a nonexistent role raises an error and
-- aborts the transaction. Since this repo has no per-provider migration
-- directories (a single flat, sequential migrations/ folder - see
-- scripts/db/checkAndApplyMigrations.ts), splitting this into a separate
-- "Neon-compatible" migration 030 would only move the landmine: a fresh
-- environment or any runner that applies migrations in order would still
-- execute the unconditional 029 first and fail before ever reaching 030.
-- The fix is to make 029 itself detect its environment and skip the
-- Supabase-only section everywhere those roles don't exist - see the guarded
-- block below.
-- ============================================================================

CREATE TABLE IF NOT EXISTS website_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  body TEXT NOT NULL,
  meta_title TEXT NOT NULL,
  meta_description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Every current read of this table (Home "Latest Articles", /resources,
-- /blog, /blog/[slug], src/app/sitemap.ts) orders by published_at DESC via
-- fetchPublishedPosts() (src/lib/posts.ts). That query has been running
-- unindexed since the table was created; this adds the missing index
-- without altering any data or behavior. Plain PostgreSQL, portable to any
-- provider.
CREATE INDEX IF NOT EXISTS idx_website_posts_published_at ON website_posts(published_at DESC);

-- ============================================================================
-- CONDITIONAL SECURITY FIX: close a default-privilege exposure, but ONLY on
-- a database that actually has the Supabase/PostgREST role environment this
-- fix targets
-- ============================================================================
-- Live audit (against the Supabase-hosted project) found website_posts with
-- RLS DISABLED and full INSERT/SELECT/UPDATE/DELETE/TRUNCATE grants to
-- `anon` AND `authenticated` - the same project-level "Supabase grants
-- default privileges on new public-schema objects to anon/authenticated
-- automatically" behavior already documented in migration 011 (there, for
-- functions; here, for a table). Verified impact live: an unauthenticated
-- request with only the public anon key could read website_posts directly
-- via the Supabase REST API (GET .../rest/v1/website_posts -> HTTP 200) -
-- completely bypassing the admin-only check in /api/publish-post. Given the
-- matching table-level grants, INSERT/UPDATE/DELETE were equally reachable
-- the same way.
--
-- This entire threat model is Supabase-specific: it exists only because
-- Supabase runs PostgREST in front of this database and auto-provisions
-- `anon`/`authenticated` roles for it. A database with no PostgREST layer
-- (Neon, or any bare Postgres instance) has no equivalent exposure to close
-- here, and blindly enabling RLS with zero policies on such a database
-- would be an unverified, potentially-breaking change with no offsetting
-- security benefit - it could silently empty out every read/write the
-- application makes through its own direct Postgres connection if that
-- connection's role ever turned out not to be the table owner (RLS applies
-- to non-owners even without FORCE ROW LEVEL SECURITY). So this hardening
-- only ever runs where its safety has actually been verified: a database
-- where `anon` and `authenticated` roles are both present is recognized
-- as "the Supabase project this fix was written and verified for", and the
-- REVOKEs only ever name roles confirmed to exist first.
--
-- Re-run safety on the Supabase project where this was already applied:
-- ENABLE ROW LEVEL SECURITY on an already-RLS-enabled table, and REVOKE of a
-- privilege that's already absent, are both no-ops in PostgreSQL (neither
-- raises an error) - this whole block remains idempotent there.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon')
     AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN

    -- Verified live (on the Supabase project) that the DATABASE_URL
    -- connection role has rolbypassrls = true, and every actual
    -- reader/writer of this table (fetchPublishedPosts() in
    -- src/lib/posts.ts, and POST /api/publish-post) exclusively uses
    -- getPool() - a direct Postgres connection as that role - never the
    -- Supabase JS client or PostgREST. So neither read nor write access
    -- from the application is affected by anything in this branch; only
    -- the anon/authenticated REST API path is closed. No policy is added
    -- for anon/authenticated on purpose - same pattern as
    -- course_certificates (migration 028) and
    -- learning_assessment_answer_key (migration 006): this table has no
    -- legitimate PostgREST consumer at all, so the correct policy is none.
    EXECUTE 'ALTER TABLE website_posts ENABLE ROW LEVEL SECURITY';
    EXECUTE 'REVOKE ALL ON website_posts FROM anon, authenticated';

    -- Forward-looking, second layer only - matches migration 011's same
    -- forward-looking DO block, extended to tables. Does not replace the
    -- explicit REVOKE above, which is what actually guarantees correctness
    -- today for this table.
    EXECUTE format(
      'ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated',
      current_user
    );

    RAISE NOTICE 'website_posts: anon/authenticated roles detected - Supabase PostgREST hardening applied (RLS enabled, anon/authenticated privileges revoked).';
  ELSE
    RAISE NOTICE 'website_posts: anon/authenticated roles not found - skipping Supabase-specific RLS/grant hardening (not applicable to this environment, e.g. Neon or plain Postgres). No schema or privilege change was made beyond the table/index above.';
  END IF;
END $$;

-- ============================================================================
-- END OF MIGRATION 029
-- ============================================================================
