-- ============================================================================
-- MIGRATION 022: Stable slugs for modules/lessons + Bunny reference name
-- ============================================================================
-- Smallest safe extension needed to deterministically seed/re-sync the real
-- PMP Mastery Program curriculum (see scripts/curriculum/) and match it
-- against the Bunny Stream library server-side, without ever depending on
-- title text (which is student-facing and may be edited later) as an
-- upsert key.
--
-- modules.slug / lessons.slug: stable, human-readable identifiers used as
-- the upsert key by scripts/curriculum/seedPmpCurriculum.ts, so re-running
-- the seed is idempotent - it can never create a duplicate module or
-- lesson. Nullable (pre-existing rows, e.g. placeholder/test content
-- created before this migration, simply have none) but unique once set,
-- scoped to the parent (course_id / module_id respectively) so the same
-- slug can be reused across different courses/modules later without
-- collision. Format mirrors the existing courses.slug convention
-- (lowercase alnum + hyphen - see courseFormSchema in courseValidators.ts).
--
-- lessons.bunny_reference_name: the exact matching string used to locate a
-- lesson's video in the Bunny Stream library (e.g. "Module 1 Part 1",
-- "module2-part1.mp4"). Sync/audit metadata only - NEVER shown to
-- students (title_en/title_ar remain the only student-facing text) and
-- never a substitute for video_provider/video_url, which already exist
-- (migration 006) and remain exactly how the player resolves playback.
-- ============================================================================

ALTER TABLE modules ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS bunny_reference_name TEXT;

DO $$ BEGIN
  ALTER TABLE modules ADD CONSTRAINT modules_slug_format CHECK (slug IS NULL OR slug ~ '^[a-z0-9-]+$');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE lessons ADD CONSTRAINT lessons_slug_format CHECK (slug IS NULL OR slug ~ '^[a-z0-9-]+$');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_modules_course_slug ON modules(course_id, slug) WHERE slug IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_lessons_module_slug ON lessons(module_id, slug) WHERE slug IS NOT NULL;

-- ============================================================================
-- END OF MIGRATION 022
-- ============================================================================
