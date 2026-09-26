-- ============================================================================
-- MIGRATION 021: Add 'bunny' to the video_provider enum
-- ============================================================================
-- Prepares lessons.video_provider (migration 006) for Bunny Stream-hosted
-- course videos, alongside the existing 'youtube'/'vimeo'/'none' values.
-- Purely additive - does not touch existing rows (zero lessons exist in
-- production at the time of this migration) or any other column/table.
--
-- ADD VALUE cannot run inside the same transaction that USES the new value,
-- but running it alone (as this migration does - no inserts/updates here)
-- is safe under the same BEGIN/COMMIT wrapping every other migration file.
-- ============================================================================

ALTER TYPE video_provider ADD VALUE IF NOT EXISTS 'bunny';

-- ============================================================================
-- END OF MIGRATION 021
-- ============================================================================
