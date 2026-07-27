-- ============================================================================
-- MIGRATION 009: Student Learning Experience (Sprint 6)
-- ============================================================================
-- Builds on migrations 005 (auth), 006 (course foundation), 007 (question
-- bank), and 008 (AI generation) only.
--
-- CENTRAL DECISION (approved architecture, see Sprint 6 proposal): bridges
-- migration 006's `learning_assessments` (checkpoint / module_assessment
-- containers) to the migration 007 question bank via a new link table
-- (learning_assessment_question_links), rather than building a second quiz
-- engine. This is additive - existing Sprint 3 assessments built on
-- learning_assessment_questions/options/answer_key keep working completely
-- unmodified. A given assessment uses EITHER the legacy per-assessment
-- questions OR bank-linked questions (an admin/seeding choice), never both
-- rendered as one mixed set from a single assessment in this sprint.
--
-- This is exactly the "Phase 2 - Question Bank centralization" TODO that
-- migration 006 explicitly deferred (see its comment above TABLE 5).
--
-- NO SECOND ANSWER-KEY PATH: grading bank-linked questions reads
-- question_answer_key / matching_answer_key / drag_and_drop_answer_key /
-- hotspots exactly as migration 007 defined them - zero authenticated
-- policies, service-role only, same as every other reader of those tables.
-- Nothing here weakens or duplicates that isolation.
-- ============================================================================

-- ============================================================================
-- TABLE: lesson_resources
-- ============================================================================
-- Downloadable resources attached to a lesson (PDFs, slide decks, etc.).
-- Visibility mirrors `lessons` itself - if you can see the lesson, you can
-- see its resource list.

CREATE TABLE IF NOT EXISTS lesson_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,

  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  order_index INT NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT lesson_resources_file_name_not_empty CHECK (file_name != '')
);

CREATE INDEX IF NOT EXISTS idx_lesson_resources_lesson ON lesson_resources(lesson_id);

-- ============================================================================
-- TABLE: learning_assessment_question_links
-- ============================================================================
-- Lets a checkpoint/module_assessment reference bank questions (TEXT
-- question_id, per migration 007's natural key) instead of - or alongside,
-- across different assessments - the legacy learning_assessment_questions.
-- Only approved bank questions are ever reachable through this: the FK just
-- points at questions.question_id, and RLS on `questions` itself (migration
-- 007) already restricts a plain authenticated read to status = 'approved'.

CREATE TABLE IF NOT EXISTS learning_assessment_question_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES learning_assessments(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES questions(question_id) ON DELETE CASCADE,
  order_index INT NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(assessment_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_laql_assessment ON learning_assessment_question_links(assessment_id);
CREATE INDEX IF NOT EXISTS idx_laql_question ON learning_assessment_question_links(question_id);

-- ============================================================================
-- TABLE: student_lesson_notes
-- ============================================================================
-- Plain-text personal notes, one per (student, lesson), editable in place.
-- No rich text, no attachments, no sharing - a single TEXT column upserted
-- by its owner. Strictly private: no admin/instructor read policy at all,
-- unlike every other table in this project's RLS - there is no legitimate
-- reason for anyone but the note's own author to read it.

CREATE TABLE IF NOT EXISTS student_lesson_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,

  note_text TEXT NOT NULL DEFAULT '',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_student_lesson_notes_user ON student_lesson_notes(user_id);

DROP TRIGGER IF EXISTS set_student_lesson_notes_updated_at ON student_lesson_notes;
CREATE TRIGGER set_student_lesson_notes_updated_at
  BEFORE UPDATE ON student_lesson_notes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- TABLE: learning_progress_pointer
-- ============================================================================
-- One row per (student, course): the last module/lesson they viewed, so
-- "Resume Learning" is an O(1) lookup instead of scanning lesson_progress
-- history for a max timestamp. Updated on every lesson page view (not just
-- on completion) via recordLessonView() - see progressService.ts.

CREATE TABLE IF NOT EXISTS learning_progress_pointer (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  last_module_id UUID REFERENCES modules(id) ON DELETE SET NULL,
  last_lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
  last_visited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_learning_progress_pointer_user ON learning_progress_pointer(user_id);

-- ============================================================================
-- ALTER: learning_assessment_attempt_answers - support bank-linked answers
-- ============================================================================
-- Adds an alternate, bank-linked question reference and a generalized JSONB
-- response payload shaped per interaction_type (see quizGradingService.ts
-- for the exact shapes). Exactly one of question_id (legacy) /
-- question_bank_question_id (bank) is set per row - same XOR-CHECK pattern
-- already used for learning_assessments' own lesson_id/module_id columns
-- and migration 008's similarity_has_one_match constraint.
--
-- selected_option_id stays as-is for backward compatibility with the legacy
-- single-select path; `response` is the generalized shape used by every
-- bank-linked answer regardless of interaction_type (including standard/
-- graphic_based bank questions, which do NOT reuse selected_option_id).

ALTER TABLE learning_assessment_attempt_answers
  ALTER COLUMN question_id DROP NOT NULL;

ALTER TABLE learning_assessment_attempt_answers
  ADD COLUMN IF NOT EXISTS question_bank_question_id TEXT REFERENCES questions(question_id),
  ADD COLUMN IF NOT EXISTS response JSONB;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public' AND table_name = 'learning_assessment_attempt_answers'
      AND constraint_name = 'laaa_question_ref_matches_source'
  ) THEN
    ALTER TABLE learning_assessment_attempt_answers
      ADD CONSTRAINT laaa_question_ref_matches_source CHECK (
        (question_id IS NOT NULL AND question_bank_question_id IS NULL) OR
        (question_id IS NULL AND question_bank_question_id IS NOT NULL)
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_laaa_bank_question ON learning_assessment_attempt_answers(question_bank_question_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE lesson_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_assessment_question_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_lesson_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_progress_pointer ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Resources visible with lesson access" ON lesson_resources;
CREATE POLICY "Resources visible with lesson access"
  ON lesson_resources FOR SELECT TO authenticated
  USING (
    lesson_id IN (
      SELECT id FROM lessons
      WHERE is_published = TRUE OR get_user_role() IN ('admin', 'instructor')
    )
  );

DROP POLICY IF EXISTS "Admins and instructors manage lesson resources" ON lesson_resources;
CREATE POLICY "Admins and instructors manage lesson resources"
  ON lesson_resources FOR ALL TO authenticated
  USING (get_user_role() IN ('admin', 'instructor'))
  WITH CHECK (get_user_role() IN ('admin', 'instructor'));

DROP POLICY IF EXISTS "Question links visible with assessment access" ON learning_assessment_question_links;
CREATE POLICY "Question links visible with assessment access"
  ON learning_assessment_question_links FOR SELECT TO authenticated
  USING (
    assessment_id IN (
      SELECT id FROM learning_assessments
      WHERE is_published = TRUE OR get_user_role() IN ('admin', 'instructor')
    )
  );

DROP POLICY IF EXISTS "Admins and instructors manage question links" ON learning_assessment_question_links;
CREATE POLICY "Admins and instructors manage question links"
  ON learning_assessment_question_links FOR ALL TO authenticated
  USING (get_user_role() IN ('admin', 'instructor'))
  WITH CHECK (get_user_role() IN ('admin', 'instructor'));

-- student_lesson_notes: owner-only, full stop. No admin/instructor bypass -
-- these are private personal notes, not course content.

DROP POLICY IF EXISTS "Users manage own lesson notes" ON student_lesson_notes;
CREATE POLICY "Users manage own lesson notes"
  ON student_lesson_notes FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- learning_progress_pointer: owner-only read/write.

DROP POLICY IF EXISTS "Users manage own progress pointer" ON learning_progress_pointer;
CREATE POLICY "Users manage own progress pointer"
  ON learning_progress_pointer FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- END OF MIGRATION 009
-- ============================================================================
