-- ============================================================================
-- MIGRATION 007: Question Bank Foundation & Import Pipeline (Sprint 4)
-- ============================================================================
-- Builds on migrations 005 (auth) and 006 (courses) only. Does NOT depend on
-- or trust migrations 001-004 (unapproved, never successfully run).
--
-- COLLISION RISK: `certifications`, `questions`, and `question_options` also
-- exist in the unapproved migrations/001 with an incompatible shape
-- (certification_id-based courses schema, option_a/b/c/d flattened columns).
-- Collision guards below abort with a clear error rather than silently
-- creating onto a mismatched table, same pattern as migration 006.
--
-- ANSWER-KEY ISOLATION: extends the Sprint 3 principle (Postgres RLS is
-- row-level, not column-level) to every interaction type, not just MCQ:
--   - question_options holds option text only; question_answer_key (secret)
--     holds is_correct.
--   - matching_items holds shuffled left/right items; matching_answer_key
--     (secret) holds the correct pairing.
--   - drag_and_drop_items holds item labels; drag_and_drop_answer_key
--     (secret) holds the correct position.
--   - hotspots has NO safe/secret split - the coordinates ARE the answer,
--     so the whole table is secret (zero policies for `authenticated`).
-- All "secret" tables are reachable only via the service-role connection,
-- through import_question_bundle() below. No table in this migration grants
-- INSERT/UPDATE/DELETE to `authenticated` at all - every write goes through
-- that one RPC, called only by the importer script.
--
-- TODO (Phase 2 - do NOT implement now):
--   - Content hashing (SHA-256 over the normalized payload) to let the
--     importer skip re-writing unchanged questions instead of always doing
--     delete-and-replace. Sprint 4 always tears down and rebuilds a
--     question's child rows on every import run - correct, just not
--     optimized for repeat imports of a mostly-unchanged bank.
--   - question_versions history table, so an edited-and-reimported question
--     doesn't lose its prior approved content. Sprint 4 stores only the
--     latest version per question_id (delete-and-replace has no memory).
--   - import_logs table to persist failed imports for historical auditing.
--     Sprint 4's JSON report file is sufficient for now (each run produces
--     one report on disk), but it isn't queryable and doesn't survive
--     independently of the machine/CI job that produced it. Phase 2 should
--     persist at least batch_id, source_file, imported_by, imported_at, and
--     the per-question rejection rows into a real table so past import runs
--     can be audited without digging through report files.
-- ============================================================================

-- ============================================================================
-- COLLISION GUARDS
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'certifications'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'certifications' AND column_name = 'total_questions'
  ) THEN
    RAISE EXCEPTION
      'Migration 007 aborted: a "certifications" table already exists with a "total_questions" column. '
      'This matches the old, unapproved migrations/001 shape, not the Sprint 4 schema. Resolve this '
      'conflict manually before re-running this migration. No changes have been made.';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'questions'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'questions' AND column_name = 'certification_id'
  ) THEN
    RAISE EXCEPTION
      'Migration 007 aborted: a "questions" table already exists but has no "certification_id" column. '
      'This matches the old, unapproved migrations/001 shape (option_a/b/c/d flattened columns), not the '
      'Sprint 4 schema. Resolve this conflict manually before re-running this migration. No changes have '
      'been made.';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'question_options'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'question_options' AND column_name = 'option_key'
  ) THEN
    RAISE EXCEPTION
      'Migration 007 aborted: a "question_options" table already exists but has no "option_key" column. '
      'This does not match the Sprint 4 schema. Resolve this conflict manually before re-running this '
      'migration. No changes have been made.';
  END IF;
END $$;

-- ============================================================================
-- ENUMS
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE question_interaction_type AS ENUM ('standard', 'graphic_based', 'drag_and_drop', 'hotspot', 'matching');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE question_answer_type AS ENUM ('single', 'multiple_response');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE question_status AS ENUM ('draft', 'needs_review', 'approved', 'rejected', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE question_domain AS ENUM ('People', 'Process', 'Business Environment');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE question_approach AS ENUM ('Predictive', 'Agile', 'Hybrid', 'Mixed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE question_difficulty AS ENUM ('Easy', 'Moderate', 'Difficult', 'Expert');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE matching_side AS ENUM ('left', 'right');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- cognitive_level, assessment_type, source, task, topic, subtopic stay plain
-- TEXT (not ENUM) - the Sprint 3.5 validator treats these as open/expandable
-- sets (warnings, not errors, on unknown values), unlike domain/approach/
-- difficulty which are closed and stable.

-- ============================================================================
-- TABLE: certifications
-- ============================================================================

CREATE TABLE IF NOT EXISTS certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Always stored uppercase (enforced below) so "PMP"/"pmp"/"PmP" from any
  -- caller all resolve to the same row - see the RPC's UPPER() lookup.
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  exam_version TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT certifications_code_not_empty CHECK (code != ''),
  CONSTRAINT certifications_code_uppercase CHECK (code = UPPER(code))
);

DROP TRIGGER IF EXISTS set_certifications_updated_at ON certifications;
CREATE TRIGGER set_certifications_updated_at
  BEFORE UPDATE ON certifications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO certifications (code, name, exam_version, is_active)
VALUES ('PMP', 'Project Management Professional', 'July 2026', TRUE)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- TABLE: questions
-- ============================================================================
-- question_id is the natural key from the workbook (e.g. "Q000182") - used
-- directly as the primary key rather than a surrogate UUID, so the database
-- always stays trivially traceable back to the source spreadsheet row.

CREATE TABLE IF NOT EXISTS questions (
  question_id TEXT PRIMARY KEY,
  certification_id UUID NOT NULL REFERENCES certifications(id),

  eco_version TEXT,
  interaction_type question_interaction_type NOT NULL,
  answer_type question_answer_type NOT NULL,

  question_text_en TEXT NOT NULL,
  question_text_ar TEXT,
  explanation_en TEXT,
  explanation_ar TEXT,

  domain question_domain,
  task TEXT,
  topic TEXT,
  subtopic TEXT,
  approach question_approach,
  difficulty question_difficulty,
  cognitive_level TEXT,
  assessment_type TEXT,

  original_language VARCHAR(5) NOT NULL DEFAULT 'en' CHECK (original_language IN ('en', 'ar')),
  translation_verified BOOLEAN NOT NULL DEFAULT FALSE,
  status question_status NOT NULL DEFAULT 'draft',

  tags TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT,
  reviewed_by TEXT,

  has_image BOOLEAN NOT NULL DEFAULT FALSE,
  source TEXT,

  -- Payload schema_version this row was last imported with (see the RPC
  -- below) - lets a future Phase 2 payload-shape change tell old rows apart
  -- from new ones without guessing.
  schema_version INT NOT NULL DEFAULT 1,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  CONSTRAINT questions_text_not_empty CHECK (question_text_en != '')
);

CREATE INDEX IF NOT EXISTS idx_questions_certification ON questions(certification_id);
CREATE INDEX IF NOT EXISTS idx_questions_status ON questions(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_questions_interaction_type ON questions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_questions_domain ON questions(domain);

DROP TRIGGER IF EXISTS set_questions_updated_at ON questions;
CREATE TRIGGER set_questions_updated_at
  BEFORE UPDATE ON questions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- TABLE: question_options (safe - option text only, no correctness)
-- ============================================================================

CREATE TABLE IF NOT EXISTS question_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id TEXT NOT NULL REFERENCES questions(question_id) ON DELETE CASCADE,

  option_key TEXT NOT NULL,
  option_text_en TEXT NOT NULL,
  option_text_ar TEXT,
  display_order INT NOT NULL DEFAULT 0,
  feedback_en TEXT,
  feedback_ar TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(question_id, option_key)
);

CREATE INDEX IF NOT EXISTS idx_question_options_question ON question_options(question_id);

-- ============================================================================
-- TABLE: question_answer_key (SECRET)
-- ============================================================================

CREATE TABLE IF NOT EXISTS question_answer_key (
  option_id UUID PRIMARY KEY REFERENCES question_options(id) ON DELETE CASCADE,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE: matching_items (safe - shuffled left/right items, no pairing)
-- ============================================================================

CREATE TABLE IF NOT EXISTS matching_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id TEXT NOT NULL REFERENCES questions(question_id) ON DELETE CASCADE,

  item_id TEXT NOT NULL,
  side matching_side NOT NULL,
  text_en TEXT NOT NULL,
  text_ar TEXT,
  display_order INT NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(question_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_matching_items_question ON matching_items(question_id);

-- ============================================================================
-- TABLE: matching_answer_key (SECRET)
-- ============================================================================
-- left_item_id as PK enforces "every left item mapped, exactly once" and
-- "no duplicate mappings" at the schema level, not just at import time.

CREATE TABLE IF NOT EXISTS matching_answer_key (
  left_item_id UUID PRIMARY KEY REFERENCES matching_items(id) ON DELETE CASCADE,
  right_item_id UUID NOT NULL REFERENCES matching_items(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES questions(question_id) ON DELETE CASCADE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(question_id, right_item_id)
);

-- ============================================================================
-- TABLE: drag_and_drop_items (safe - item labels, no position)
-- ============================================================================

CREATE TABLE IF NOT EXISTS drag_and_drop_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id TEXT NOT NULL REFERENCES questions(question_id) ON DELETE CASCADE,

  item_id TEXT NOT NULL,
  item_text_en TEXT NOT NULL,
  item_text_ar TEXT,
  category TEXT,
  display_order INT NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(question_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_drag_and_drop_items_question ON drag_and_drop_items(question_id);

-- ============================================================================
-- TABLE: drag_and_drop_answer_key (SECRET)
-- ============================================================================
-- question_id is denormalized here (redundant with the join through
-- drag_and_drop_items) solely to allow a compound UNIQUE(question_id,
-- correct_position) constraint - enforcing "positions unique, no gaps
-- checked at import time" with a DB-level backstop for the uniqueness part.

CREATE TABLE IF NOT EXISTS drag_and_drop_answer_key (
  item_id UUID PRIMARY KEY REFERENCES drag_and_drop_items(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES questions(question_id) ON DELETE CASCADE,
  correct_position INT NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(question_id, correct_position)
);

-- ============================================================================
-- TABLE: hotspots (ENTIRELY SECRET - no safe/secret split possible)
-- ============================================================================
-- Unlike options/matching/drag-and-drop, there is no "safe" portion of a
-- hotspot row to expose - the coordinates ARE the answer. Students only ever
-- see the underlying image (via question_images, which is safe); a future
-- practice UI submits a raw click (x,y) to a grading route that checks
-- server-side (service-role) whether it falls inside the stored box.

CREATE TABLE IF NOT EXISTS hotspots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id TEXT NOT NULL REFERENCES questions(question_id) ON DELETE CASCADE,

  hotspot_id TEXT NOT NULL,
  x NUMERIC NOT NULL,
  y NUMERIC NOT NULL,
  width NUMERIC NOT NULL CHECK (width > 0),
  height NUMERIC NOT NULL CHECK (height > 0),
  label TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(question_id, hotspot_id)
);

-- ============================================================================
-- TABLE: question_images (safe - purely descriptive assets)
-- ============================================================================

CREATE TABLE IF NOT EXISTS question_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id TEXT NOT NULL REFERENCES questions(question_id) ON DELETE CASCADE,

  image_id TEXT NOT NULL,
  image_path TEXT NOT NULL,
  image_alt_en TEXT,
  image_alt_ar TEXT,
  display_order INT NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(question_id, image_id)
);

CREATE INDEX IF NOT EXISTS idx_question_images_question ON question_images(question_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
-- Reuses get_user_role() from migration 005. No table in this migration
-- grants INSERT/UPDATE/DELETE to `authenticated` - every write goes through
-- import_question_bundle(), called only via the service-role connection.

ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_answer_key ENABLE ROW LEVEL SECURITY;       -- no policies below: zero access except service_role
ALTER TABLE matching_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE matching_answer_key ENABLE ROW LEVEL SECURITY;       -- no policies below: zero access except service_role
ALTER TABLE drag_and_drop_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE drag_and_drop_answer_key ENABLE ROW LEVEL SECURITY;  -- no policies below: zero access except service_role
ALTER TABLE hotspots ENABLE ROW LEVEL SECURITY;                  -- no policies below: zero access except service_role
ALTER TABLE question_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active certifications visible to authenticated" ON certifications;
CREATE POLICY "Active certifications visible to authenticated"
  ON certifications FOR SELECT TO authenticated
  USING (is_active = TRUE);

DROP POLICY IF EXISTS "Approved questions visible to authenticated" ON questions;
CREATE POLICY "Approved questions visible to authenticated"
  ON questions FOR SELECT TO authenticated
  USING (status = 'approved'::question_status OR get_user_role() IN ('admin', 'instructor'));

DROP POLICY IF EXISTS "Options visible with question access" ON question_options;
CREATE POLICY "Options visible with question access"
  ON question_options FOR SELECT TO authenticated
  USING (
    question_id IN (
      SELECT question_id FROM questions
      WHERE status = 'approved'::question_status OR get_user_role() IN ('admin', 'instructor')
    )
  );

DROP POLICY IF EXISTS "Matching items visible with question access" ON matching_items;
CREATE POLICY "Matching items visible with question access"
  ON matching_items FOR SELECT TO authenticated
  USING (
    question_id IN (
      SELECT question_id FROM questions
      WHERE status = 'approved'::question_status OR get_user_role() IN ('admin', 'instructor')
    )
  );

DROP POLICY IF EXISTS "Drag-and-drop items visible with question access" ON drag_and_drop_items;
CREATE POLICY "Drag-and-drop items visible with question access"
  ON drag_and_drop_items FOR SELECT TO authenticated
  USING (
    question_id IN (
      SELECT question_id FROM questions
      WHERE status = 'approved'::question_status OR get_user_role() IN ('admin', 'instructor')
    )
  );

DROP POLICY IF EXISTS "Images visible with question access" ON question_images;
CREATE POLICY "Images visible with question access"
  ON question_images FOR SELECT TO authenticated
  USING (
    question_id IN (
      SELECT question_id FROM questions
      WHERE status = 'approved'::question_status OR get_user_role() IN ('admin', 'instructor')
    )
  );

-- question_answer_key, matching_answer_key, drag_and_drop_answer_key,
-- hotspots: NO policies for `authenticated` on purpose. Do not add any.

-- ============================================================================
-- RPC: import_question_bundle(payload JSONB)
-- ============================================================================
-- Atomic per-question import. A single function call runs in one implicit
-- transaction; the EXCEPTION block creates a savepoint boundary so any
-- failure rolls back everything this call did and returns a structured
-- failure result instead of throwing - the importer always gets a
-- predictable JSON shape back, success or failure.
--
-- payload.schema_version gates forward-compatibility: only version 1 is
-- accepted today. A future payload shape change bumps this, and this
-- function (or a v2 sibling) can branch on it without breaking callers
-- still sending v1.

CREATE OR REPLACE FUNCTION import_question_bundle(payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_question_id TEXT;
  v_cert_id UUID;
  v_schema_version INT;
BEGIN
  v_schema_version := (payload->>'schema_version')::INT;
  IF v_schema_version IS NULL OR v_schema_version != 1 THEN
    RAISE EXCEPTION 'Unsupported schema_version: %', payload->>'schema_version';
  END IF;

  v_question_id := payload->'question'->>'question_id';
  IF v_question_id IS NULL OR v_question_id = '' THEN
    RAISE EXCEPTION 'payload.question.question_id is required';
  END IF;

  -- Normalized to uppercase on both sides so "PMP", "pmp", "PmP" all resolve
  -- to the same certification - codes are stored uppercase (see the seed
  -- insert above) and the lookup uppercases the incoming payload value too,
  -- rather than relying on the caller to have normalized it already.
  SELECT id INTO v_cert_id FROM certifications WHERE code = UPPER(payload->'question'->>'certification_code');
  IF v_cert_id IS NULL THEN
    RAISE EXCEPTION 'Unknown certification_code: %', payload->'question'->>'certification_code';
  END IF;

  INSERT INTO questions (
    question_id, certification_id, eco_version, interaction_type, answer_type,
    question_text_en, question_text_ar, explanation_en, explanation_ar,
    domain, task, topic, subtopic, approach, difficulty, cognitive_level,
    assessment_type, original_language, translation_verified, status,
    tags, notes, reviewed_by, has_image, source, schema_version
  )
  VALUES (
    v_question_id,
    v_cert_id,
    payload->'question'->>'eco_version',
    (payload->'question'->>'interaction_type')::question_interaction_type,
    (payload->'question'->>'answer_type')::question_answer_type,
    payload->'question'->>'question_text_en',
    payload->'question'->>'question_text_ar',
    payload->'question'->>'explanation_en',
    payload->'question'->>'explanation_ar',
    NULLIF(payload->'question'->>'domain', '')::question_domain,
    payload->'question'->>'task',
    payload->'question'->>'topic',
    payload->'question'->>'subtopic',
    NULLIF(payload->'question'->>'approach', '')::question_approach,
    NULLIF(payload->'question'->>'difficulty', '')::question_difficulty,
    payload->'question'->>'cognitive_level',
    payload->'question'->>'assessment_type',
    COALESCE(payload->'question'->>'original_language', 'en'),
    COALESCE((payload->'question'->>'translation_verified')::boolean, false),
    (payload->'question'->>'status')::question_status,
    COALESCE((SELECT array_agg(t) FROM jsonb_array_elements_text(payload->'question'->'tags') t), '{}'),
    payload->'question'->>'notes',
    payload->'question'->>'reviewed_by',
    COALESCE((payload->'question'->>'has_image')::boolean, false),
    payload->'question'->>'source',
    v_schema_version
  )
  ON CONFLICT (question_id) DO UPDATE SET
    certification_id = EXCLUDED.certification_id,
    eco_version = EXCLUDED.eco_version,
    interaction_type = EXCLUDED.interaction_type,
    answer_type = EXCLUDED.answer_type,
    question_text_en = EXCLUDED.question_text_en,
    question_text_ar = EXCLUDED.question_text_ar,
    explanation_en = EXCLUDED.explanation_en,
    explanation_ar = EXCLUDED.explanation_ar,
    domain = EXCLUDED.domain,
    task = EXCLUDED.task,
    topic = EXCLUDED.topic,
    subtopic = EXCLUDED.subtopic,
    approach = EXCLUDED.approach,
    difficulty = EXCLUDED.difficulty,
    cognitive_level = EXCLUDED.cognitive_level,
    assessment_type = EXCLUDED.assessment_type,
    original_language = EXCLUDED.original_language,
    translation_verified = EXCLUDED.translation_verified,
    status = EXCLUDED.status,
    tags = EXCLUDED.tags,
    notes = EXCLUDED.notes,
    reviewed_by = EXCLUDED.reviewed_by,
    has_image = EXCLUDED.has_image,
    source = EXCLUDED.source,
    schema_version = EXCLUDED.schema_version,
    updated_at = NOW();

  -- ATOMICITY NOTE: everything from here to the end of this function body -
  -- the deletes below, every subsequent INSERT, and the questions upsert
  -- above - executes inside the ONE implicit transaction of this single
  -- function call. If anything below raises, the EXCEPTION handler at the
  -- bottom of this function rolls all of it back, including the questions
  -- upsert. Do NOT split these DELETEs (or any part of this function) out
  -- into separate statements issued by the caller - that would let a
  -- question end up with a new parent row but stale/missing children, which
  -- is exactly the failure mode this RPC exists to prevent. Everything that
  -- needs to succeed or fail together belongs inside this one function.
  --
  -- Delete-and-replace children. ON DELETE CASCADE on question_options,
  -- matching_items, and drag_and_drop_items handles their respective
  -- *_answer_key tables automatically.
  --
  -- TODO (Phase 2): compare a content hash of `payload` against a stored
  -- hash before doing this teardown, and skip entirely when unchanged.
  DELETE FROM question_options WHERE question_id = v_question_id;
  DELETE FROM matching_items WHERE question_id = v_question_id;
  DELETE FROM drag_and_drop_items WHERE question_id = v_question_id;
  DELETE FROM hotspots WHERE question_id = v_question_id;
  DELETE FROM question_images WHERE question_id = v_question_id;

  -- question_options + question_answer_key (resolved via option_key, never
  -- a client-supplied UUID)
  IF payload ? 'options' THEN
    WITH inserted_options AS (
      INSERT INTO question_options (question_id, option_key, option_text_en, option_text_ar, display_order, feedback_en, feedback_ar)
      SELECT v_question_id, opt.option_key, opt.option_text_en, opt.option_text_ar, opt.display_order, opt.feedback_en, opt.feedback_ar
      FROM jsonb_to_recordset(payload->'options')
        AS opt(option_key TEXT, option_text_en TEXT, option_text_ar TEXT, display_order INT, is_correct BOOLEAN, feedback_en TEXT, feedback_ar TEXT)
      RETURNING id, option_key
    )
    INSERT INTO question_answer_key (option_id, is_correct)
    SELECT io.id, src.is_correct
    FROM inserted_options io
    JOIN jsonb_to_recordset(payload->'options')
      AS src(option_key TEXT, is_correct BOOLEAN) ON src.option_key = io.option_key;
  END IF;

  -- matching_items + matching_answer_key
  IF payload ? 'matching_items' THEN
    INSERT INTO matching_items (question_id, item_id, side, text_en, text_ar, display_order)
    SELECT v_question_id, mi.item_id, mi.side::matching_side, mi.text_en, mi.text_ar, mi.display_order
    FROM jsonb_to_recordset(payload->'matching_items')
      AS mi(item_id TEXT, side TEXT, text_en TEXT, text_ar TEXT, display_order INT);

    IF payload ? 'matching_pairs' THEN
      INSERT INTO matching_answer_key (left_item_id, right_item_id, question_id)
      SELECT li.id, ri.id, v_question_id
      FROM jsonb_to_recordset(payload->'matching_pairs')
        AS mp(left_item_id TEXT, right_item_id TEXT)
      JOIN matching_items li ON li.question_id = v_question_id AND li.item_id = mp.left_item_id
      JOIN matching_items ri ON ri.question_id = v_question_id AND ri.item_id = mp.right_item_id;
    END IF;
  END IF;

  -- drag_and_drop_items + drag_and_drop_answer_key
  IF payload ? 'drag_and_drop_items' THEN
    INSERT INTO drag_and_drop_items (question_id, item_id, item_text_en, item_text_ar, category, display_order)
    SELECT v_question_id, ddsrc.item_id, ddsrc.item_text_en, ddsrc.item_text_ar, ddsrc.category, ddsrc.display_order
    FROM jsonb_to_recordset(payload->'drag_and_drop_items')
      AS ddsrc(item_id TEXT, item_text_en TEXT, item_text_ar TEXT, category TEXT, display_order INT);

    IF payload ? 'drag_and_drop_positions' THEN
      INSERT INTO drag_and_drop_answer_key (item_id, question_id, correct_position)
      SELECT ddi.id, v_question_id, dpos.correct_position
      FROM jsonb_to_recordset(payload->'drag_and_drop_positions')
        AS dpos(item_id TEXT, correct_position INT)
      JOIN drag_and_drop_items ddi ON ddi.question_id = v_question_id AND ddi.item_id = dpos.item_id;
    END IF;
  END IF;

  -- hotspots
  IF payload ? 'hotspots' THEN
    INSERT INTO hotspots (question_id, hotspot_id, x, y, width, height, label)
    SELECT v_question_id, hp.hotspot_id, hp.x, hp.y, hp.width, hp.height, hp.label
    FROM jsonb_to_recordset(payload->'hotspots')
      AS hp(hotspot_id TEXT, x NUMERIC, y NUMERIC, width NUMERIC, height NUMERIC, label TEXT);
  END IF;

  -- question_images
  IF payload ? 'images' THEN
    INSERT INTO question_images (question_id, image_id, image_path, image_alt_en, image_alt_ar, display_order)
    SELECT v_question_id, img.image_id, img.image_path, img.image_alt_en, img.image_alt_ar, img.display_order
    FROM jsonb_to_recordset(payload->'images')
      AS img(image_id TEXT, image_path TEXT, image_alt_en TEXT, image_alt_ar TEXT, display_order INT);
  END IF;

  RETURN jsonb_build_object('success', true, 'question_id', v_question_id);

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'question_id', COALESCE(v_question_id, payload->'question'->>'question_id'),
    'error', SQLERRM
  );
END;
$$;

REVOKE ALL ON FUNCTION import_question_bundle(JSONB) FROM PUBLIC;
-- Deliberately SECURITY INVOKER (the default), not SECURITY DEFINER, and no
-- GRANT to anon/authenticated. Only the service-role connection (which
-- bypasses RLS at the role level) can actually write through this function -
-- if it were ever miscalled by a non-service-role client, the underlying
-- RLS (zero policies for authenticated on the secret tables) blocks the
-- writes anyway. Two independent layers, not one.

-- ============================================================================
-- END OF MIGRATION 007
-- ============================================================================
