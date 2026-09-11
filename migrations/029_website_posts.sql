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
-- the table and its 8 seeded rows already match this shape exactly (verified
-- live before writing this migration - see columns/constraints below), so
-- this statement is a no-op there. It only actually creates the table on an
-- environment where it doesn't exist yet (fresh DB, preview branch). Nothing
-- here drops, truncates, renames, or recreates the table, and no existing
-- row is touched.
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
-- without altering any data or behavior.
CREATE INDEX IF NOT EXISTS idx_website_posts_published_at ON website_posts(published_at DESC);

-- ============================================================================
-- SECURITY FIX: close a live default-privilege exposure
-- ============================================================================
-- Live audit performed while writing this migration found that
-- website_posts currently has RLS DISABLED and full INSERT/SELECT/UPDATE/
-- DELETE/TRUNCATE grants to `anon` AND `authenticated` - the same
-- project-level "Supabase grants default privileges on new public-schema
-- objects to anon/authenticated automatically" behavior already documented
-- in migration 011 (there, for functions; here, for a table). Because this
-- table was created by a raw `CREATE TABLE` statement outside this
-- project's normal Supabase-dashboard/migration flow, nothing ever revoked
-- those defaults or enabled RLS, unlike every other table in this schema.
--
-- Verified impact live: an unauthenticated request with only the public
-- anon key could read website_posts directly via the Supabase REST API
-- (GET .../rest/v1/website_posts succeeded, HTTP 200) - completely
-- bypassing the admin-only check in /api/publish-post. Given the matching
-- table-level grants, INSERT/UPDATE/DELETE were equally reachable the same
-- way (not executed here - read-only verification only, per instruction not
-- to run destructive checks against production).
--
-- This is safe to close completely: verified live that the DATABASE_URL
-- connection role (`postgres`) has `rolbypassrls = true`, and every actual
-- reader/writer of this table (fetchPublishedPosts() in src/lib/posts.ts,
-- and POST /api/publish-post) exclusively uses getPool() - a direct
-- Postgres connection as that role - never the Supabase JS client or
-- PostgREST. So neither read nor write access from the application is
-- affected by anything below; only the previously-open anon/authenticated
-- REST API path is closed.
ALTER TABLE website_posts ENABLE ROW LEVEL SECURITY;

-- No policy is added for anon/authenticated on purpose - same pattern as
-- course_certificates (migration 028) and learning_assessment_answer_key
-- (migration 006): this table has no legitimate PostgREST consumer at all,
-- so the correct policy is none, leaving it reachable only by a role that
-- bypasses RLS (postgres/service_role).
REVOKE ALL ON website_posts FROM anon, authenticated;

-- Forward-looking, second layer only - matches migration 011's same
-- forward-looking DO block, extended to tables. Does not replace the
-- explicit REVOKE above, which is what actually guarantees correctness
-- today for this table.
DO $$
BEGIN
  EXECUTE format(
    'ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated',
    current_user
  );
END $$;

-- ============================================================================
-- END OF MIGRATION 029
-- ============================================================================
