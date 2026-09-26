-- ============================================================================
-- MIGRATION 027: Store each question image's natural pixel dimensions
-- ============================================================================
-- Root cause of the hotspot-grading bug: hotspots.x/y/width/height are
-- authored as PIXEL coordinates on the image's NATURAL (full-resolution)
-- dimensions - confirmed for all 4 existing hotspot questions by fetching
-- each image and checking its real PNG header dimensions (every region's
-- bounding box fits inside the natural size; none fit as a 0-100 percentage
-- on any axis). isHotspotClickCorrect() (quizGradingService.ts) has always
-- compared against a submitted click that IS a 0-100 percentage (see
-- HotspotQuestion.tsx) - the stored pixel values were never converted, so
-- no click could ever land inside any region's declared bounds.
--
-- The fix normalizes the stored region to a percentage AT GRADING TIME
-- (quizGradingService.ts), which requires knowing the image's natural
-- width/height. Nothing in the schema stored that before this migration -
-- grading must never fetch/decode the image itself to find out (fragile,
-- slow, and not deterministic across a CDN), so it's computed ONCE, up
-- front, server-side, and persisted here instead.
-- ============================================================================

ALTER TABLE question_images
  ADD COLUMN IF NOT EXISTS natural_width INT CHECK (natural_width IS NULL OR natural_width > 0),
  ADD COLUMN IF NOT EXISTS natural_height INT CHECK (natural_height IS NULL OR natural_height > 0);

COMMENT ON COLUMN question_images.natural_width IS 'The image file''s actual pixel width, computed once server-side from the file itself (see scripts/content/backfillImageDimensions.ts) - not client-reported, not re-derived at grading time. Required for hotspot questions (their region x/y/width/height are authored in these same pixel units); NULL is fine for any question type that does not need coordinate math against this image.';
COMMENT ON COLUMN question_images.natural_height IS 'See natural_width.';

-- ============================================================================
-- END OF MIGRATION 027
-- ============================================================================
