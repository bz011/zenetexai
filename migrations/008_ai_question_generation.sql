-- ============================================================================
-- MIGRATION 008: AI Question Generation System (Sprint 5)
-- ============================================================================
-- Builds on migrations 005 (auth) and 007 (question bank) only. Does NOT
-- depend on or trust migrations 001-004 (unapproved, never successfully run).
--
-- COLLISION RISK: `question_patterns` (migration 001, TABLE 10) and
-- `question_embeddings` (migration 002) already exist in the unapproved
-- schema with incompatible shapes (UUID-keyed questions.id references, a
-- custom embedding_provider enum, no scenario/reasoning-abstraction
-- columns at all). Collision guards below abort with a clear error rather
-- than silently creating onto a mismatched table, same pattern as
-- migrations 006 and 007.
--
-- ADMIN-ONLY VISIBILITY: every table in this migration is invisible to
-- plain authenticated users (students) - RLS policies below check
-- get_user_role() IN ('admin','instructor') directly, with no
-- status/is_published OR-branch the way public content tables have. There
-- is no path by which a student session can read generation prompts,
-- pattern data, source-question links, similarity reports, or unapproved
-- drafts - the drafts themselves live in the SAME `questions` table from
-- migration 007 and are already hidden by that migration's existing
-- `status = 'approved' OR role IN (admin,instructor)` policy. Nothing here
-- reopens that.
--
-- NO SECOND INSERTION PATH: this migration does NOT add a new way to write
-- rows into questions/question_options/matching_items/drag_and_drop_items/
-- hotspots/question_images. The generation pipeline builds the exact same
-- WorkbookData-row shape the Sprint 4 importer uses and calls the EXISTING
-- import_question_bundle RPC to insert - see zenetexai/scripts/
-- question-generation/insertDraft.ts. The only new write RPCs here are
-- next_ai_question_id() (ID allocation), set_question_status() (approve/
-- reject/etc. status transitions), and store_question_embedding() (vector
-- upsert) - none of them touch question content directly.
-- ============================================================================

-- ============================================================================
-- COLLISION GUARDS
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'question_patterns'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'question_patterns' AND column_name = 'scenario_structure'
  ) THEN
    RAISE EXCEPTION
      'Migration 008 aborted: a "question_patterns" table already exists but has no "scenario_structure" '
      'column. This matches the old, unapproved migrations/001 shape, not the Sprint 5 schema. Resolve '
      'this conflict manually before re-running this migration. No changes have been made.';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'question_embeddings'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'question_embeddings'
      AND column_name = 'question_id' AND data_type <> 'text'
  ) THEN
    RAISE EXCEPTION
      'Migration 008 aborted: a "question_embeddings" table already exists but its "question_id" column '
      'is not TEXT-typed. This matches the old, unapproved migrations/002 shape (UUID-keyed against the '
      'old questions.id surrogate key), not the Sprint 5 schema (TEXT-keyed against questions.question_id). '
      'Resolve this conflict manually before re-running this migration. No changes have been made.';
  END IF;
END $$;

-- ============================================================================
-- EXTENSION
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- ENUMS
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE generation_batch_status AS ENUM ('draft', 'running', 'partially_completed', 'completed', 'failed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE pattern_status AS ENUM ('active', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE similarity_comparison_type AS ENUM ('lexical', 'semantic');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE similarity_threshold_kind AS ENUM ('hard_reject', 'warning', 'none');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- SEQUENCE + FUNCTION: AI question_id allocation
-- ============================================================================
-- Never compute this in application code by reading MAX(question_id) - that
-- races under concurrency. A Postgres sequence is atomic by construction.

CREATE SEQUENCE IF NOT EXISTS ai_question_id_seq;

CREATE OR REPLACE FUNCTION next_ai_question_id()
RETURNS TEXT
LANGUAGE sql
AS $$
  SELECT 'AIQ' || LPAD(nextval('ai_question_id_seq')::text, 6, '0');
$$;

REVOKE ALL ON FUNCTION next_ai_question_id() FROM PUBLIC;

-- ============================================================================
-- TABLE: question_patterns
-- ============================================================================
-- Abstracted reasoning/structure only. Deliberately no column exists here
-- for verbatim source-question text - source_question_ids are pointers,
-- never copies. See migration header for the collision-guard rationale.

CREATE TABLE IF NOT EXISTS question_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certification_id UUID NOT NULL REFERENCES certifications(id),

  eco_version TEXT,
  domain question_domain,
  task TEXT,
  topic TEXT,
  subtopic TEXT,
  approach question_approach,
  difficulty question_difficulty,
  cognitive_level TEXT,
  interaction_type question_interaction_type NOT NULL,
  answer_type question_answer_type NOT NULL,

  scenario_structure TEXT NOT NULL,
  tested_decision TEXT NOT NULL,
  correct_answer_principle TEXT NOT NULL,
  distractor_strategies TEXT[] NOT NULL DEFAULT '{}',
  common_misconception TEXT,
  required_pmi_mindset TEXT,
  generation_guidance TEXT,

  source_question_ids TEXT[] NOT NULL DEFAULT '{}',

  status pattern_status NOT NULL DEFAULT 'active',

  -- Quality statistics, maintained incrementally by the pipeline and by
  -- set_question_status() below rather than computed via a rollup job.
  times_used INT NOT NULL DEFAULT 0,
  questions_generated INT NOT NULL DEFAULT 0,
  questions_approved INT NOT NULL DEFAULT 0,
  questions_rejected INT NOT NULL DEFAULT 0,
  avg_quality_score NUMERIC(5,2),

  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_question_patterns_certification ON question_patterns(certification_id);
CREATE INDEX IF NOT EXISTS idx_question_patterns_domain ON question_patterns(domain);
CREATE INDEX IF NOT EXISTS idx_question_patterns_status ON question_patterns(status);

DROP TRIGGER IF EXISTS set_question_patterns_updated_at ON question_patterns;
CREATE TRIGGER set_question_patterns_updated_at
  BEFORE UPDATE ON question_patterns
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- TABLE: generation_batches
-- ============================================================================

CREATE TABLE IF NOT EXISTS generation_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certification_id UUID NOT NULL REFERENCES certifications(id),

  requested_count INT NOT NULL CHECK (requested_count > 0 AND requested_count <= 100),
  requested_distribution JSONB NOT NULL DEFAULT '{}',

  target_domains question_domain[],
  target_topics TEXT[],
  target_approaches question_approach[],
  target_difficulties question_difficulty[],
  target_interaction_types question_interaction_type[],
  target_answer_types question_answer_type[],
  selected_pattern_ids UUID[],

  llm_provider TEXT NOT NULL,
  llm_model TEXT NOT NULL,

  status generation_batch_status NOT NULL DEFAULT 'draft',
  generated_count INT NOT NULL DEFAULT 0,
  passed_count INT NOT NULL DEFAULT 0,
  rejected_count INT NOT NULL DEFAULT 0,
  approved_count INT NOT NULL DEFAULT 0,

  prompt_tokens INT NOT NULL DEFAULT 0,
  completion_tokens INT NOT NULL DEFAULT 0,
  estimated_cost_usd NUMERIC(10,4) NOT NULL DEFAULT 0,

  error_message TEXT,

  created_by TEXT NOT NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_generation_batches_status ON generation_batches(status);
CREATE INDEX IF NOT EXISTS idx_generation_batches_certification ON generation_batches(certification_id);

DROP TRIGGER IF EXISTS set_generation_batches_updated_at ON generation_batches;
CREATE TRIGGER set_generation_batches_updated_at
  BEFORE UPDATE ON generation_batches
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- TABLE: generation_batch_questions
-- ============================================================================
-- One row per generation ATTEMPT, whether it was accepted (passed the
-- automated quality gate and was inserted into `questions`) or hard-rejected
-- before ever reaching the database. This is generation-time telemetry -
-- distinct from and independent of the question's later human review
-- outcome, which lives on questions.status.

CREATE TABLE IF NOT EXISTS generation_batch_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES generation_batches(id) ON DELETE CASCADE,
  question_id TEXT REFERENCES questions(question_id) ON DELETE SET NULL,
  pattern_id UUID REFERENCES question_patterns(id),

  accepted BOOLEAN NOT NULL,
  rejection_reason TEXT,
  quality_scores JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_generation_batch_questions_batch ON generation_batch_questions(batch_id);
CREATE INDEX IF NOT EXISTS idx_generation_batch_questions_question ON generation_batch_questions(question_id);
CREATE INDEX IF NOT EXISTS idx_generation_batch_questions_pattern ON generation_batch_questions(pattern_id);

-- ============================================================================
-- TABLE: question_embeddings
-- ============================================================================
-- Fixed at 1536 dimensions (OpenAI text-embedding-3-small) since exactly one
-- provider is implemented in Sprint 5. Changing embedding models to a
-- different dimension later needs a follow-up migration - documenting this
-- now rather than over-generalizing a dimension nobody needs yet.

CREATE TABLE IF NOT EXISTS question_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id TEXT NOT NULL REFERENCES questions(question_id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  embedding VECTOR(1536) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(question_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_question_embeddings_question ON question_embeddings(question_id);
CREATE INDEX IF NOT EXISTS idx_question_embeddings_vector ON question_embeddings
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================================================
-- TABLE: generation_similarity_results
-- ============================================================================
-- Stores every comparison performed (both lexical and semantic), not just
-- the ones that breached a threshold, so the full similarity picture is
-- auditable per draft, not just the final accept/reject decision.

CREATE TABLE IF NOT EXISTS generation_similarity_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_question_id UUID NOT NULL REFERENCES generation_batch_questions(id) ON DELETE CASCADE,
  comparison_type similarity_comparison_type NOT NULL,

  -- Exactly one of these two is set: a real approved-bank/pattern-source
  -- question, or another draft from the same in-progress batch.
  matched_question_id TEXT REFERENCES questions(question_id),
  matched_batch_question_id UUID REFERENCES generation_batch_questions(id),

  similarity_score NUMERIC(5,4) NOT NULL,
  threshold_result similarity_threshold_kind NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT similarity_has_one_match CHECK (
    (matched_question_id IS NOT NULL AND matched_batch_question_id IS NULL) OR
    (matched_question_id IS NULL AND matched_batch_question_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_similarity_results_batch_question ON generation_similarity_results(batch_question_id);
CREATE INDEX IF NOT EXISTS idx_similarity_results_threshold ON generation_similarity_results(threshold_result);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
-- Every table here is admin/instructor-only, full stop - no OR-branch for
-- students the way public question-bank content has. Reuses get_user_role()
-- from migration 005.

ALTER TABLE question_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_batch_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_similarity_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin/instructor read patterns" ON question_patterns;
CREATE POLICY "Admin/instructor read patterns"
  ON question_patterns FOR SELECT TO authenticated
  USING (get_user_role() IN ('admin', 'instructor'));

DROP POLICY IF EXISTS "Admin/instructor read batches" ON generation_batches;
CREATE POLICY "Admin/instructor read batches"
  ON generation_batches FOR SELECT TO authenticated
  USING (get_user_role() IN ('admin', 'instructor'));

DROP POLICY IF EXISTS "Admin/instructor read batch questions" ON generation_batch_questions;
CREATE POLICY "Admin/instructor read batch questions"
  ON generation_batch_questions FOR SELECT TO authenticated
  USING (get_user_role() IN ('admin', 'instructor'));

DROP POLICY IF EXISTS "Admin/instructor read embeddings" ON question_embeddings;
CREATE POLICY "Admin/instructor read embeddings"
  ON question_embeddings FOR SELECT TO authenticated
  USING (get_user_role() IN ('admin', 'instructor'));

DROP POLICY IF EXISTS "Admin/instructor read similarity results" ON generation_similarity_results;
CREATE POLICY "Admin/instructor read similarity results"
  ON generation_similarity_results FOR SELECT TO authenticated
  USING (get_user_role() IN ('admin', 'instructor'));

-- No INSERT/UPDATE/DELETE policies anywhere above - every write to these
-- five tables happens via the service-role connection (the generation
-- pipeline scripts), never via a policy grant to `authenticated`.

-- ============================================================================
-- ADMIN REVIEW ACCESS TO ANSWER-KEY TABLES (correcting a Sprint 5 gap)
-- ============================================================================
-- Migration 007's answer-key isolation ("Postgres RLS is row-level, not
-- column-level, so hide the whole table") was scoped to keep STUDENTS from
-- ever seeing correct answers - it was never meant to block admins from
-- reviewing content, because Sprint 4 had no review UI yet. Sprint 5's
-- admin review page needs to see question_answer_key/matching_answer_key/
-- drag_and_drop_answer_key/hotspots to let a human actually judge whether a
-- generated question is correct. These four policies are narrowly scoped
-- to admin/instructor ONLY (never a blanket `authenticated` grant, unlike
-- the public content tables) - students still get zero rows from any of
-- these four tables, exactly as migration 007 intended.

DROP POLICY IF EXISTS "Admin/instructor review answer keys" ON question_answer_key;
CREATE POLICY "Admin/instructor review answer keys"
  ON question_answer_key FOR SELECT TO authenticated
  USING (get_user_role() IN ('admin', 'instructor'));

DROP POLICY IF EXISTS "Admin/instructor review matching answer keys" ON matching_answer_key;
CREATE POLICY "Admin/instructor review matching answer keys"
  ON matching_answer_key FOR SELECT TO authenticated
  USING (get_user_role() IN ('admin', 'instructor'));

DROP POLICY IF EXISTS "Admin/instructor review drag-and-drop answer keys" ON drag_and_drop_answer_key;
CREATE POLICY "Admin/instructor review drag-and-drop answer keys"
  ON drag_and_drop_answer_key FOR SELECT TO authenticated
  USING (get_user_role() IN ('admin', 'instructor'));

DROP POLICY IF EXISTS "Admin/instructor review hotspots" ON hotspots;
CREATE POLICY "Admin/instructor review hotspots"
  ON hotspots FOR SELECT TO authenticated
  USING (get_user_role() IN ('admin', 'instructor'));

-- ============================================================================
-- RPC: set_question_status(question_id, new_status, reviewer_note)
-- ============================================================================
-- The ONLY way a generated question's review status changes. Keeps the
-- associated batch's approved_count in sync so batch dashboards don't drift
-- from the questions table's actual state.

CREATE OR REPLACE FUNCTION set_question_status(
  p_question_id TEXT,
  p_new_status question_status,
  p_reviewer_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_old_status question_status;
  v_batch_id UUID;
  v_existing_notes TEXT;
BEGIN
  SELECT status, notes INTO v_old_status, v_existing_notes FROM questions WHERE question_id = p_question_id;
  IF v_old_status IS NULL THEN
    RAISE EXCEPTION 'No question found with question_id: %', p_question_id;
  END IF;

  UPDATE questions
  SET status = p_new_status,
      notes = CASE
        WHEN p_reviewer_note IS NOT NULL THEN
          COALESCE(v_existing_notes || ' | ', '') || '[REVIEW: ' || p_reviewer_note || ']'
        ELSE v_existing_notes
      END
  WHERE question_id = p_question_id;

  -- Keep the batch's approved_count in sync, if this question came from a
  -- generation batch at all (workbook-imported questions won't match here).
  SELECT batch_id INTO v_batch_id FROM generation_batch_questions WHERE question_id = p_question_id LIMIT 1;
  IF v_batch_id IS NOT NULL THEN
    IF p_new_status = 'approved'::question_status AND v_old_status <> 'approved'::question_status THEN
      UPDATE generation_batches SET approved_count = approved_count + 1 WHERE id = v_batch_id;
    ELSIF p_new_status <> 'approved'::question_status AND v_old_status = 'approved'::question_status THEN
      UPDATE generation_batches SET approved_count = GREATEST(0, approved_count - 1) WHERE id = v_batch_id;
    END IF;

    -- Pattern statistics: reflect the current approve/reject state.
    UPDATE question_patterns qp
    SET questions_approved = (
          SELECT COUNT(*) FROM generation_batch_questions gbq
          JOIN questions q ON q.question_id = gbq.question_id
          WHERE gbq.pattern_id = qp.id AND q.status = 'approved'::question_status
        ),
        questions_rejected = (
          SELECT COUNT(*) FROM generation_batch_questions gbq
          JOIN questions q ON q.question_id = gbq.question_id
          WHERE gbq.pattern_id = qp.id AND q.status = 'rejected'::question_status
        )
    WHERE qp.id = (SELECT pattern_id FROM generation_batch_questions WHERE question_id = p_question_id LIMIT 1);
  END IF;

  RETURN jsonb_build_object('success', true, 'question_id', p_question_id, 'old_status', v_old_status, 'new_status', p_new_status);

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'question_id', p_question_id, 'error', SQLERRM);
END;
$$;

REVOKE ALL ON FUNCTION set_question_status(TEXT, question_status, TEXT) FROM PUBLIC;

-- ============================================================================
-- RPC: store_question_embedding(question_id, provider, model, embedding)
-- ============================================================================
-- Takes the embedding as a JSONB array and casts it to vector inside
-- Postgres, rather than relying on the JS client library to serialize a
-- vector type correctly over PostgREST - one less thing to get subtly wrong
-- on the application side.

CREATE OR REPLACE FUNCTION store_question_embedding(
  p_question_id TEXT,
  p_provider TEXT,
  p_model TEXT,
  p_embedding JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_vector VECTOR(1536);
BEGIN
  SELECT ARRAY(SELECT jsonb_array_elements_text(p_embedding))::float4[]::vector INTO v_vector;

  INSERT INTO question_embeddings (question_id, provider, model, embedding)
  VALUES (p_question_id, p_provider, p_model, v_vector)
  ON CONFLICT (question_id, provider) DO UPDATE SET
    model = EXCLUDED.model,
    embedding = EXCLUDED.embedding;

  RETURN jsonb_build_object('success', true, 'question_id', p_question_id);

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'question_id', p_question_id, 'error', SQLERRM);
END;
$$;

REVOKE ALL ON FUNCTION store_question_embedding(TEXT, TEXT, TEXT, JSONB) FROM PUBLIC;

-- ============================================================================
-- RPC: increment_pattern_usage(pattern_id)
-- ============================================================================
-- Atomic counter bump - avoids the fetch-then-update race a plain client
-- side read-modify-write would have under concurrent generation.

CREATE OR REPLACE FUNCTION increment_pattern_usage(p_pattern_id UUID)
RETURNS VOID
LANGUAGE sql
AS $$
  UPDATE question_patterns
  SET times_used = times_used + 1, questions_generated = questions_generated + 1
  WHERE id = p_pattern_id;
$$;

REVOKE ALL ON FUNCTION increment_pattern_usage(UUID) FROM PUBLIC;

-- ============================================================================
-- RPC: find_similar_questions(embedding, match_count, exclude_question_id)
-- ============================================================================
-- Nearest-neighbor lookup used by the semantic similarity layer. Returns
-- the closest existing question embeddings by cosine distance.

CREATE OR REPLACE FUNCTION find_similar_questions(
  p_embedding JSONB,
  p_match_count INT DEFAULT 5,
  p_exclude_question_id TEXT DEFAULT NULL
)
RETURNS TABLE (question_id TEXT, similarity NUMERIC)
LANGUAGE plpgsql
AS $$
DECLARE
  v_vector VECTOR(1536);
BEGIN
  SELECT ARRAY(SELECT jsonb_array_elements_text(p_embedding))::float4[]::vector INTO v_vector;

  RETURN QUERY
  SELECT qe.question_id, (1 - (qe.embedding <=> v_vector))::NUMERIC AS similarity
  FROM question_embeddings qe
  WHERE p_exclude_question_id IS NULL OR qe.question_id <> p_exclude_question_id
  ORDER BY qe.embedding <=> v_vector
  LIMIT p_match_count;
END;
$$;

REVOKE ALL ON FUNCTION find_similar_questions(JSONB, INT, TEXT) FROM PUBLIC;

-- ============================================================================
-- END OF MIGRATION 008
-- ============================================================================
