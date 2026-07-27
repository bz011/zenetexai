-- ============================================================================
-- MIGRATION 004: Add Translation Metadata
-- ============================================================================
-- This migration adds translation metadata to the questions table
-- Prepares for future Translation Agent functionality
--
-- Columns:
-- - original_language: Which language is the original (en/ar)
-- - translation_verified: Whether the translation has been reviewed
--
-- Use case:
-- English questions are authored first, then translated to Arabic
-- Translation Agent will translate, but human must verify
-- This tracks the verification status

-- ============================================================================
-- ENUM: Language
-- ============================================================================

CREATE TYPE language AS ENUM ('en', 'ar');

-- ============================================================================
-- ALTER TABLE: questions
-- ============================================================================
-- Add translation metadata columns

ALTER TABLE questions
ADD COLUMN original_language language DEFAULT 'en',
ADD COLUMN translation_verified BOOLEAN DEFAULT FALSE;

-- Create comment explaining the columns
COMMENT ON COLUMN questions.original_language IS 'Language in which the question was originally authored (en=English, ar=Arabic)';
COMMENT ON COLUMN questions.translation_verified IS 'For non-original language: whether the translation has been reviewed and approved by a human reviewer';

-- ============================================================================
-- END OF MIGRATION 004
-- ============================================================================
