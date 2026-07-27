-- ============================================================================
-- MIGRATION 006: Course Foundation (Sprint 3)
-- ============================================================================
-- Builds on the Sprint 2 auth foundation (migration 005) ONLY. Does NOT
-- depend on, assume, or trust migrations 001-004 — those were never
-- approved, were never successfully run end-to-end (001 contains a syntax
-- error partway through), and are not treated as reliable schema.
--
-- IMPORTANT — table name collision risk:
-- Migrations 001-004 (unapproved) separately define tables named `courses`,
-- `modules`, `lessons`, `assessments`, and `assessment_questions` with a
-- DIFFERENT, incompatible shape (built around a `certification_id` FK to a
-- `certifications` table that doesn't exist in the approved schema).
--
-- If 001 was ever partially executed against this database before it hit
-- its syntax error, `courses`/`modules`/`lessons` may already exist in that
-- old, incompatible shape. `CREATE TABLE IF NOT EXISTS` would silently
-- no-op onto that old table instead of creating this sprint's schema,
-- which would break everything downstream in confusing ways.
--
-- To avoid that silently happening, this migration explicitly checks each
-- of the three colliding names for a column that ONLY exists in the Sprint
-- 3 shape (`slug` on courses, `is_published` on modules/lessons) before
-- creating anything. If the table exists WITHOUT that column, the
-- migration ABORTS with a clear error instead of proceeding.
--
-- The other new tables in this migration (learning_assessments and its
-- children) are deliberately named to NOT collide with 001's `assessments`/
-- `assessment_questions` at all, so there is nothing to reconcile there —
-- see the naming note before TABLE 4 below.
-- ============================================================================

-- ============================================================================
-- COLLISION GUARDS — run before creating anything
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'courses'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'courses' AND column_name = 'slug'
  ) THEN
    RAISE EXCEPTION
      'Migration 006 aborted: a "courses" table already exists but has no "slug" column. '
      'This matches the old, unapproved migrations/001 shape (certification_id-based), not '
      'the Sprint 3 schema. Resolve this conflict manually (rename/drop the old table with '
      'explicit approval) before re-running this migration. No changes have been made.';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'modules'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'modules' AND column_name = 'is_published'
  ) THEN
    RAISE EXCEPTION
      'Migration 006 aborted: a "modules" table already exists but has no "is_published" '
      'column. This matches the old, unapproved migrations/001 shape, not the Sprint 3 '
      'schema. Resolve this conflict manually before re-running this migration. No changes '
      'have been made.';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'lessons'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'lessons' AND column_name = 'is_published'
  ) THEN
    RAISE EXCEPTION
      'Migration 006 aborted: a "lessons" table already exists but has no "is_published" '
      'column. This matches the old, unapproved migrations/001 shape, not the Sprint 3 '
      'schema. Resolve this conflict manually before re-running this migration. No changes '
      'have been made.';
  END IF;
END $$;

-- ============================================================================
-- TABLE 1: courses
-- ============================================================================

CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  slug VARCHAR(100) NOT NULL UNIQUE,
  title_en VARCHAR(255) NOT NULL,
  title_ar VARCHAR(255),
  description_en TEXT,
  description_ar TEXT,
  cover_image_url TEXT,

  order_index INT NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  CONSTRAINT courses_slug_not_empty CHECK (slug != ''),
  CONSTRAINT courses_title_not_empty CHECK (title_en != '')
);

CREATE INDEX IF NOT EXISTS idx_courses_is_published ON courses(is_published) WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS set_courses_updated_at ON courses;
CREATE TRIGGER set_courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- TABLE 2: modules
-- ============================================================================

CREATE TABLE IF NOT EXISTS modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,

  title_en VARCHAR(255) NOT NULL,
  title_ar VARCHAR(255),
  description_en TEXT,
  description_ar TEXT,

  order_index INT NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  CONSTRAINT modules_title_not_empty CHECK (title_en != '')
);

CREATE INDEX IF NOT EXISTS idx_modules_course ON modules(course_id);
CREATE INDEX IF NOT EXISTS idx_modules_is_published ON modules(is_published) WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS set_modules_updated_at ON modules;
CREATE TRIGGER set_modules_updated_at
  BEFORE UPDATE ON modules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- TABLE 3: lessons
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE video_provider AS ENUM ('youtube', 'vimeo', 'none');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,

  title_en VARCHAR(255) NOT NULL,
  title_ar VARCHAR(255),
  content_en TEXT,   -- markdown
  content_ar TEXT,   -- markdown

  video_provider video_provider NOT NULL DEFAULT 'none',
  video_url TEXT,    -- full embeddable URL, e.g. https://www.youtube.com/embed/<id>
  duration_minutes INT,

  order_index INT NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  CONSTRAINT lessons_title_not_empty CHECK (title_en != '')
);

CREATE INDEX IF NOT EXISTS idx_lessons_module ON lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_lessons_is_published ON lessons(is_published) WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS set_lessons_updated_at ON lessons;
CREATE TRIGGER set_lessons_updated_at
  BEFORE UPDATE ON lessons
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- TABLE 4: learning_assessments (Learning Checkpoints + Module Assessments)
-- ============================================================================
-- Deliberately named "learning_assessments" (not "assessments") to avoid any
-- collision with migrations/001's unrelated `assessments` table, and to keep
-- this name free for a future, heavier mock-exam engine that will need its
-- own tables (timer state, domain weighting, repeat-tracking) rather than
-- extending this simple one.
--
-- Covers BOTH:
--   type = 'checkpoint'         -> attached to a single lesson (lesson_id set)
--   type = 'module_assessment'  -> attached to a whole module (module_id set)
-- Exactly one of lesson_id/module_id must be set, matching `type`.
--
-- Sprint 3 scope only: simple percent-correct scoring, no timer, no domain
-- weighting, no adaptive logic, no randomized generation.

DO $$ BEGIN
  CREATE TYPE learning_assessment_type AS ENUM ('checkpoint', 'module_assessment');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS learning_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  type learning_assessment_type NOT NULL,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE,

  title_en VARCHAR(255) NOT NULL,
  title_ar VARCHAR(255),
  passing_score INT NOT NULL DEFAULT 70 CHECK (passing_score >= 0 AND passing_score <= 100),

  order_index INT NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  CONSTRAINT learning_assessments_title_not_empty CHECK (title_en != ''),
  CONSTRAINT learning_assessments_parent_matches_type CHECK (
    (type = 'checkpoint' AND lesson_id IS NOT NULL AND module_id IS NULL) OR
    (type = 'module_assessment' AND module_id IS NOT NULL AND lesson_id IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_learning_assessments_lesson ON learning_assessments(lesson_id) WHERE lesson_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_learning_assessments_module ON learning_assessments(module_id) WHERE module_id IS NOT NULL;

DROP TRIGGER IF EXISTS set_learning_assessments_updated_at ON learning_assessments;
CREATE TRIGGER set_learning_assessments_updated_at
  BEFORE UPDATE ON learning_assessments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- TABLE 5: learning_assessment_questions
-- ============================================================================
-- TODO (Phase 2 — Question Bank centralization, do NOT implement now):
-- Question/option text here is authored per-assessment and duplicated if the
-- same question is reused across checkpoints. Phase 2 is expected to
-- introduce a centralized question_bank (and question_bank_options) table,
-- with learning_assessment_questions becoming a thin mapping table
-- (assessment_id, question_bank_id, order_index) instead of owning the text
-- directly. That migration will need to backfill question_bank rows from
-- the data seeded here and repoint learning_assessment_attempt_answers'
-- question_id accordingly. Not required for Sprint 3 — documenting the path
-- only, per explicit instruction not to redesign this now.

CREATE TABLE IF NOT EXISTS learning_assessment_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES learning_assessments(id) ON DELETE CASCADE,

  question_text_en TEXT NOT NULL,
  question_text_ar TEXT,
  explanation_en TEXT,
  explanation_ar TEXT,

  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT laq_question_text_not_empty CHECK (question_text_en != '')
);

CREATE INDEX IF NOT EXISTS idx_laq_assessment ON learning_assessment_questions(assessment_id);

-- ============================================================================
-- TABLE 6: learning_assessment_options
-- ============================================================================
-- Public-safe: option text only. Correctness lives in a SEPARATE, locked-down
-- table (learning_assessment_answer_key, below) — see that table's comment
-- for why. Never add an is_correct column here.

CREATE TABLE IF NOT EXISTS learning_assessment_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES learning_assessment_questions(id) ON DELETE CASCADE,

  option_text_en VARCHAR(500) NOT NULL,
  option_text_ar VARCHAR(500),
  order_index INT NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT lao_option_text_not_empty CHECK (option_text_en != '')
);

CREATE INDEX IF NOT EXISTS idx_lao_question ON learning_assessment_options(question_id);

-- ============================================================================
-- TABLE 7: learning_assessment_answer_key
-- ============================================================================
-- Deliberately isolated from learning_assessment_options.
--
-- Postgres RLS is ROW-level, not COLUMN-level: a policy that lets students
-- SELECT a question's options can't hide just an is_correct column on those
-- same rows. Keeping correctness in its own table lets us enable RLS here
-- with ZERO policies for the `authenticated` role — meaning even a valid,
-- logged-in user's browser client gets ZERO rows back querying this table
-- directly, full stop. The only way to read it is the service-role client
-- (supabaseAdmin, already scaffolded in lib/supabase/admin.ts), which is
-- exactly what the grading route uses. Nothing else in the app should ever
-- be given access to this table.
--
-- Sprint 3 has no admin authoring UI yet, so rows here are seeded manually
-- via the Supabase SQL editor (which runs as a superuser and is unaffected
-- by RLS) alongside learning_assessment_questions/options.

CREATE TABLE IF NOT EXISTS learning_assessment_answer_key (
  option_id UUID PRIMARY KEY REFERENCES learning_assessment_options(id) ON DELETE CASCADE,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_learning_assessment_answer_key_updated_at ON learning_assessment_answer_key;
CREATE TRIGGER set_learning_assessment_answer_key_updated_at
  BEFORE UPDATE ON learning_assessment_answer_key
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- TABLE 8: learning_assessment_attempts
-- ============================================================================

CREATE TABLE IF NOT EXISTS learning_assessment_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES learning_assessments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  score INT NOT NULL CHECK (score >= 0 AND score <= 100),
  passed BOOLEAN NOT NULL,

  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_laa_user ON learning_assessment_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_laa_assessment ON learning_assessment_attempts(assessment_id);

-- ============================================================================
-- TABLE 9: learning_assessment_attempt_answers
-- ============================================================================
-- Per-question record of what the student picked, for review/feedback.
-- is_correct here is a snapshot copied in by the grading route (which is
-- the only place with access to the answer key) — this table itself is NOT
-- the answer key and does not need the same lockdown, since is_correct is
-- only ever written once, server-side, at grading time.

CREATE TABLE IF NOT EXISTS learning_assessment_attempt_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES learning_assessment_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES learning_assessment_questions(id),
  selected_option_id UUID REFERENCES learning_assessment_options(id),
  is_correct BOOLEAN NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_laaa_attempt ON learning_assessment_attempt_answers(attempt_id);

-- ============================================================================
-- TABLE 10: lesson_progress
-- ============================================================================
-- Presence of a row = lesson completed. Course/module completion percentage
-- is computed on read (count completed / count total lessons) rather than
-- stored, so it can never drift out of sync.

CREATE TABLE IF NOT EXISTS lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,

  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_lesson_progress_user ON lesson_progress(user_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
-- Reuses get_user_role() defined in migration 005 — do not redefine it here.

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_assessment_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_assessment_answer_key ENABLE ROW LEVEL SECURITY; -- no policies added: zero access except service_role
ALTER TABLE learning_assessment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_assessment_attempt_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;

-- courses / modules / lessons: published rows visible to any authenticated
-- user (no paywall yet, per Sprint 3 scope); admins/instructors see + manage
-- everything; only admins can hard-delete.

DROP POLICY IF EXISTS "Published courses visible to authenticated" ON courses;
CREATE POLICY "Published courses visible to authenticated"
  ON courses FOR SELECT TO authenticated
  USING (is_published = TRUE OR get_user_role() IN ('admin', 'instructor'));

DROP POLICY IF EXISTS "Admins and instructors manage courses" ON courses;
CREATE POLICY "Admins and instructors manage courses"
  ON courses FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'instructor'));

DROP POLICY IF EXISTS "Admins and instructors update courses" ON courses;
CREATE POLICY "Admins and instructors update courses"
  ON courses FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin', 'instructor'))
  WITH CHECK (get_user_role() IN ('admin', 'instructor'));

DROP POLICY IF EXISTS "Admins delete courses" ON courses;
CREATE POLICY "Admins delete courses"
  ON courses FOR DELETE TO authenticated
  USING (get_user_role() = 'admin');

DROP POLICY IF EXISTS "Published modules visible to authenticated" ON modules;
CREATE POLICY "Published modules visible to authenticated"
  ON modules FOR SELECT TO authenticated
  USING (is_published = TRUE OR get_user_role() IN ('admin', 'instructor'));

DROP POLICY IF EXISTS "Admins and instructors manage modules" ON modules;
CREATE POLICY "Admins and instructors manage modules"
  ON modules FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'instructor'));

DROP POLICY IF EXISTS "Admins and instructors update modules" ON modules;
CREATE POLICY "Admins and instructors update modules"
  ON modules FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin', 'instructor'))
  WITH CHECK (get_user_role() IN ('admin', 'instructor'));

DROP POLICY IF EXISTS "Admins delete modules" ON modules;
CREATE POLICY "Admins delete modules"
  ON modules FOR DELETE TO authenticated
  USING (get_user_role() = 'admin');

DROP POLICY IF EXISTS "Published lessons visible to authenticated" ON lessons;
CREATE POLICY "Published lessons visible to authenticated"
  ON lessons FOR SELECT TO authenticated
  USING (is_published = TRUE OR get_user_role() IN ('admin', 'instructor'));

DROP POLICY IF EXISTS "Admins and instructors manage lessons" ON lessons;
CREATE POLICY "Admins and instructors manage lessons"
  ON lessons FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'instructor'));

DROP POLICY IF EXISTS "Admins and instructors update lessons" ON lessons;
CREATE POLICY "Admins and instructors update lessons"
  ON lessons FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin', 'instructor'))
  WITH CHECK (get_user_role() IN ('admin', 'instructor'));

DROP POLICY IF EXISTS "Admins delete lessons" ON lessons;
CREATE POLICY "Admins delete lessons"
  ON lessons FOR DELETE TO authenticated
  USING (get_user_role() = 'admin');

-- learning_assessments / questions / options: published assessment content
-- visible to authenticated users; admins/instructors manage. Options are
-- safe to expose (no is_correct column on this table — see TABLE 6).

DROP POLICY IF EXISTS "Published assessments visible to authenticated" ON learning_assessments;
CREATE POLICY "Published assessments visible to authenticated"
  ON learning_assessments FOR SELECT TO authenticated
  USING (is_published = TRUE OR get_user_role() IN ('admin', 'instructor'));

DROP POLICY IF EXISTS "Admins and instructors manage assessments" ON learning_assessments;
CREATE POLICY "Admins and instructors manage assessments"
  ON learning_assessments FOR ALL TO authenticated
  USING (get_user_role() IN ('admin', 'instructor'))
  WITH CHECK (get_user_role() IN ('admin', 'instructor'));

DROP POLICY IF EXISTS "Assessment questions visible with assessment access" ON learning_assessment_questions;
CREATE POLICY "Assessment questions visible with assessment access"
  ON learning_assessment_questions FOR SELECT TO authenticated
  USING (
    assessment_id IN (
      SELECT id FROM learning_assessments
      WHERE is_published = TRUE OR get_user_role() IN ('admin', 'instructor')
    )
  );

DROP POLICY IF EXISTS "Admins and instructors manage assessment questions" ON learning_assessment_questions;
CREATE POLICY "Admins and instructors manage assessment questions"
  ON learning_assessment_questions FOR ALL TO authenticated
  USING (get_user_role() IN ('admin', 'instructor'))
  WITH CHECK (get_user_role() IN ('admin', 'instructor'));

DROP POLICY IF EXISTS "Assessment options visible with question access" ON learning_assessment_options;
CREATE POLICY "Assessment options visible with question access"
  ON learning_assessment_options FOR SELECT TO authenticated
  USING (
    question_id IN (
      SELECT laq.id FROM learning_assessment_questions laq
      JOIN learning_assessments la ON la.id = laq.assessment_id
      WHERE la.is_published = TRUE OR get_user_role() IN ('admin', 'instructor')
    )
  );

DROP POLICY IF EXISTS "Admins and instructors manage assessment options" ON learning_assessment_options;
CREATE POLICY "Admins and instructors manage assessment options"
  ON learning_assessment_options FOR ALL TO authenticated
  USING (get_user_role() IN ('admin', 'instructor'))
  WITH CHECK (get_user_role() IN ('admin', 'instructor'));

-- learning_assessment_answer_key: NO policies for `authenticated` on purpose.
-- Do not add any. Only the service-role client can read/write this table.

-- learning_assessment_attempts / attempt_answers: users see + create their
-- own attempts only; admins can see all (for future reporting).

DROP POLICY IF EXISTS "Users view own assessment attempts" ON learning_assessment_attempts;
CREATE POLICY "Users view own assessment attempts"
  ON learning_assessment_attempts FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR get_user_role() = 'admin');

DROP POLICY IF EXISTS "Users create own assessment attempts" ON learning_assessment_attempts;
CREATE POLICY "Users create own assessment attempts"
  ON learning_assessment_attempts FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users view own attempt answers" ON learning_assessment_attempt_answers;
CREATE POLICY "Users view own attempt answers"
  ON learning_assessment_attempt_answers FOR SELECT TO authenticated
  USING (
    attempt_id IN (
      SELECT id FROM learning_assessment_attempts
      WHERE user_id = auth.uid() OR get_user_role() = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users create own attempt answers" ON learning_assessment_attempt_answers;
CREATE POLICY "Users create own attempt answers"
  ON learning_assessment_attempt_answers FOR INSERT TO authenticated
  WITH CHECK (
    attempt_id IN (
      SELECT id FROM learning_assessment_attempts WHERE user_id = auth.uid()
    )
  );

-- lesson_progress: users see + manage their own rows only; admins can see all.

DROP POLICY IF EXISTS "Users view own lesson progress" ON lesson_progress;
CREATE POLICY "Users view own lesson progress"
  ON lesson_progress FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR get_user_role() = 'admin');

DROP POLICY IF EXISTS "Users create own lesson progress" ON lesson_progress;
CREATE POLICY "Users create own lesson progress"
  ON lesson_progress FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- END OF MIGRATION 006
-- ============================================================================
