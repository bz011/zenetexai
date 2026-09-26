-- ============================================================================
-- MIGRATION 003: Replace Free Text Fields with ENUMs
-- ============================================================================
-- This migration replaces VARCHAR fields with proper ENUMs for better data integrity
--
-- Changes:
-- 1. Create ENUM types: question_difficulty, question_type, question_source
-- 2. Alter questions table to use ENUMs

-- ============================================================================
-- ENUMS: Question Fields
-- ============================================================================

CREATE TYPE question_difficulty AS ENUM ('easy', 'moderate', 'difficult', 'expert');
CREATE TYPE question_type_enum AS ENUM ('single_choice', 'multiple_response');
CREATE TYPE question_source AS ENUM ('official', 'study_hall', 'generated', 'custom');

-- ============================================================================
-- ALTER TABLE: questions
-- ============================================================================
-- Convert VARCHAR columns to ENUMs

-- Change difficulty_level to use ENUM
-- Map old INT values: 1=easy, 2=moderate, 3=difficult, 4-5=expert
ALTER TABLE questions
DROP CONSTRAINT difficulty_level_check,
ALTER COLUMN difficulty_level DROP DEFAULT,
DROP COLUMN difficulty_level;

ALTER TABLE questions
ADD COLUMN difficulty question_difficulty DEFAULT 'moderate';

-- Change question_type to use ENUM
-- Old default 'multiple_choice' maps to 'single_choice'
ALTER TABLE questions
ALTER COLUMN question_type SET DATA TYPE question_type_enum
  USING CASE 
    WHEN question_type = 'multiple_choice' THEN 'single_choice'::question_type_enum
    WHEN question_type = 'multiple_select' THEN 'multiple_response'::question_type_enum
    ELSE 'single_choice'::question_type_enum
  END;

ALTER TABLE questions
ALTER COLUMN question_type SET DEFAULT 'single_choice'::question_type_enum;

-- Change source to use ENUM
ALTER TABLE questions
ALTER COLUMN source SET DATA TYPE question_source
  USING CASE 
    WHEN source = 'official_pmi' THEN 'official'::question_source
    WHEN source = 'ai_generated' THEN 'generated'::question_source
    WHEN source = 'custom' THEN 'custom'::question_source
    ELSE 'custom'::question_source
  END;

ALTER TABLE questions
ALTER COLUMN source SET DEFAULT 'custom'::question_source;

-- ============================================================================
-- END OF MIGRATION 003
-- ============================================================================
