-- ============================================================================
-- MIGRATION 017: Question Image Validation (Sprint 9.1)
-- ============================================================================
-- ROOT CAUSE this migration addresses: a graphic_based question can be
-- approved and served to students with a stem that says "Refer to the
-- table..." while having either (a) zero question_images rows at all (the
-- AI Question Factory's draftAdapter.ts deliberately never generates a real
-- image - see its comment "a human must attach one before has_image should
-- ever be TRUE" - but nothing ever enforced that before approval), or (b)
-- a question_images row whose image_path points at a Storage object that
-- does not actually exist (live inspection during Sprint 9.1 found the
-- Supabase project has ZERO storage buckets at all, so every one of the 15
-- currently-approved graphic_based questions with an image row is
-- unrenderable regardless of the row's presence).
--
-- image_verified_broken is a generic, content-agnostic flag - NOT a
-- one-off patch for specific question_ids. A verification pass (see
-- scripts/content/verifyQuestionImages.ts) sets it based on real structural
-- + storage checks; eligibility queries below exclude it. This is
-- deliberately a boolean flag rather than removing/rejecting the question
-- outright, so a single re-run of the verification script after real image
-- assets are uploaded silently un-flags a repaired question with no manual
-- status changes required.

ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS image_verified_broken BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS image_verified_at TIMESTAMPTZ;

COMMENT ON COLUMN questions.image_verified_broken IS 'Set by scripts/content/verifyQuestionImages.ts: TRUE when this question structurally requires an image (interaction_type = graphic_based) but no accessible image asset was found at verification time. Practice/Mock Exam selection excludes these until re-verified as fixed.';
COMMENT ON COLUMN questions.image_verified_at IS 'Timestamp of the last image-verification pass that evaluated this question, NULL if never checked.';

CREATE INDEX IF NOT EXISTS idx_questions_image_verified_broken ON questions(image_verified_broken) WHERE image_verified_broken = TRUE;

-- ============================================================================
-- Practice Mode eligibility RPCs (migration 012): exclude broken-image
-- graphic_based questions from both the eligible-count check and actual
-- selection. Signatures unchanged, only the WHERE clause gains one
-- predicate, so every existing caller keeps working unmodified.
-- ============================================================================

CREATE OR REPLACE FUNCTION count_eligible_practice_questions(
  p_certification_id UUID,
  p_domain question_domain DEFAULT NULL,
  p_approach question_approach DEFAULT NULL,
  p_difficulty question_difficulty DEFAULT NULL,
  p_interaction_type question_interaction_type DEFAULT NULL,
  p_answer_type question_answer_type DEFAULT NULL,
  p_language TEXT DEFAULT 'en'
)
RETURNS INT
LANGUAGE sql
STABLE
AS $$
  SELECT COUNT(*)::INT FROM questions q
  WHERE q.certification_id = p_certification_id
    AND q.status = 'approved'::question_status
    AND q.deleted_at IS NULL
    AND q.image_verified_broken = FALSE
    AND (p_domain IS NULL OR q.domain = p_domain)
    AND (p_approach IS NULL OR q.approach = p_approach)
    AND (p_difficulty IS NULL OR q.difficulty = p_difficulty)
    AND (p_interaction_type IS NULL OR q.interaction_type = p_interaction_type)
    AND (p_answer_type IS NULL OR q.answer_type = p_answer_type)
    AND (p_language = 'en' OR q.question_text_ar IS NOT NULL);
$$;

REVOKE ALL ON FUNCTION count_eligible_practice_questions(UUID, question_domain, question_approach, question_difficulty, question_interaction_type, question_answer_type, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION count_eligible_practice_questions(UUID, question_domain, question_approach, question_difficulty, question_interaction_type, question_answer_type, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION select_practice_questions(
  p_certification_id UUID,
  p_domain question_domain DEFAULT NULL,
  p_approach question_approach DEFAULT NULL,
  p_difficulty question_difficulty DEFAULT NULL,
  p_interaction_type question_interaction_type DEFAULT NULL,
  p_answer_type question_answer_type DEFAULT NULL,
  p_language TEXT DEFAULT 'en',
  p_limit INT DEFAULT 10
)
RETURNS TABLE (question_id TEXT)
LANGUAGE sql
STABLE
AS $$
  SELECT q.question_id FROM questions q
  WHERE q.certification_id = p_certification_id
    AND q.status = 'approved'::question_status
    AND q.deleted_at IS NULL
    AND q.image_verified_broken = FALSE
    AND (p_domain IS NULL OR q.domain = p_domain)
    AND (p_approach IS NULL OR q.approach = p_approach)
    AND (p_difficulty IS NULL OR q.difficulty = p_difficulty)
    AND (p_interaction_type IS NULL OR q.interaction_type = p_interaction_type)
    AND (p_answer_type IS NULL OR q.answer_type = p_answer_type)
    AND (p_language = 'en' OR q.question_text_ar IS NOT NULL)
  ORDER BY random()
  LIMIT p_limit;
$$;

REVOKE ALL ON FUNCTION select_practice_questions(UUID, question_domain, question_approach, question_difficulty, question_interaction_type, question_answer_type, TEXT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION select_practice_questions(UUID, question_domain, question_approach, question_difficulty, question_interaction_type, question_answer_type, TEXT, INT) TO authenticated;

-- ============================================================================
-- END OF MIGRATION 017
-- ============================================================================
