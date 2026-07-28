#!/usr/bin/env node
/**
 * One-off migration runner for migrations/005-012. There is no
 * schema_migrations tracking table in this project, so "already applied" is
 * determined the same way the migration files themselves already guard
 * against collisions: checking for a signature table/column that only
 * exists once that specific migration has run. Every migration file is
 * itself written idempotently (CREATE TABLE IF NOT EXISTS, DROP POLICY IF
 * EXISTS, etc.), but per explicit instruction this script still skips
 * anything already applied rather than re-running it.
 *
 * Reads from zenetexai/migrations/ - the in-repo, version-controlled copy
 * (as of Sprint 7). A duplicate copy previously lived one directory above
 * the repo root (outside git entirely, since this repo's root is
 * zenetexai/) - that copy is now stale; treat zenetexai/migrations/ as the
 * only canonical location for any migration written from here on.
 *
 * Requires DATABASE_URL (a direct Postgres connection string - the
 * Supabase REST API/service-role key cannot execute arbitrary DDL).
 *
 * Usage: npx tsx scripts/db/checkAndApplyMigrations.ts
 */

import fs from "node:fs";
import path from "node:path";
import { config as loadEnv } from "dotenv";
import { Client } from "pg";

loadEnv({ path: path.resolve(__dirname, "../../.env.local") });

const MIGRATIONS_DIR = path.resolve(__dirname, "../../migrations");

interface MigrationSpec {
  id: string;
  file: string;
  /** SQL that returns exactly one row with a boolean `applied` column. */
  signatureQuery: string;
}

const MIGRATIONS: MigrationSpec[] = [
  {
    id: "005_auth_walking_skeleton",
    file: "005_auth_walking_skeleton.sql",
    signatureQuery: `
      SELECT EXISTS (
        SELECT 1 FROM information_schema.routines
        WHERE routine_schema = 'public' AND routine_name = 'get_user_role'
      ) AND EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'profiles'
      ) AS applied
    `,
  },
  {
    id: "006_course_foundation",
    file: "006_course_foundation.sql",
    signatureQuery: `
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'courses' AND column_name = 'slug'
      ) AS applied
    `,
  },
  {
    id: "007_question_bank",
    file: "007_question_bank.sql",
    signatureQuery: `
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'questions' AND column_name = 'certification_id'
      ) AS applied
    `,
  },
  {
    id: "008_ai_question_generation",
    file: "008_ai_question_generation.sql",
    signatureQuery: `
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'question_patterns' AND column_name = 'scenario_structure'
      ) AS applied
    `,
  },
  {
    id: "009_student_learning_experience",
    file: "009_student_learning_experience.sql",
    signatureQuery: `
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'student_lesson_notes'
      ) AND EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'learning_assessment_question_links'
      ) AS applied
    `,
  },
  {
    id: "010_study_time_tracking",
    file: "010_study_time_tracking.sql",
    signatureQuery: `
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'student_study_time'
      ) AS applied
    `,
  },
  {
    id: "011_close_default_privilege_gap",
    file: "011_close_default_privilege_gap.sql",
    signatureQuery: `
      SELECT NOT COALESCE(
        (SELECT has_function_privilege('authenticated', 'import_question_bundle(jsonb)', 'EXECUTE')),
        false
      ) AS applied
    `,
  },
  {
    id: "012_practice_mode",
    file: "012_practice_mode.sql",
    signatureQuery: `
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'practice_sessions'
      ) AND EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'practice_session_questions'
      ) AND EXISTS (
        SELECT 1 FROM information_schema.routines
        WHERE routine_schema = 'public' AND routine_name = 'create_practice_session'
      ) AS applied
    `,
  },
  {
    id: "013_enrollments",
    file: "013_enrollments.sql",
    signatureQuery: `
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'enrollments'
      ) AS applied
    `,
  },
];

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("Missing DATABASE_URL in .env.local");
    process.exit(1);
  }

  let parsed: URL | null = null;
  try {
    parsed = new URL(connectionString);
  } catch {
    // ignore - diagnostic only
  }
  if (parsed) {
    console.log(`Connecting as user "${parsed.username}" to host "${parsed.hostname}:${parsed.port || "5432"}" (password not shown)...`);
  }

  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
  } catch (err) {
    const pgErr = err as { message?: string; code?: string };
    console.error(`\nFailed to connect: ${pgErr.message} (code: ${pgErr.code ?? "n/a"})`);
    console.error("Nothing was touched - connection never succeeded.");
    process.exit(1);
  }
  console.log("Connected to Postgres.\n");

  try {
    console.log("=== Checking which migrations are already applied ===");
    const status: { id: string; applied: boolean }[] = [];
    for (const m of MIGRATIONS) {
      const { rows } = await client.query(m.signatureQuery);
      const applied = rows[0]?.applied === true;
      status.push({ id: m.id, applied });
      console.log(`  ${applied ? "✓ already applied" : "✗ missing"}  — ${m.id}`);
    }

    const missing = MIGRATIONS.filter((m) => status.find((s) => s.id === m.id)?.applied === false);

    if (missing.length === 0) {
      console.log("\nAll migrations 005-010 are already applied. Nothing to do.");
    } else {
      console.log(`\n=== Applying ${missing.length} missing migration(s), in order ===`);
      for (const m of missing) {
        const filePath = path.join(MIGRATIONS_DIR, m.file);
        const sql = fs.readFileSync(filePath, "utf-8");
        console.log(`\n--- Applying ${m.id} ---`);
        try {
          await client.query("BEGIN");
          await client.query(sql);
          await client.query("COMMIT");
          console.log(`✓ ${m.id} applied successfully.`);
        } catch (err) {
          await client.query("ROLLBACK");
          const pgErr = err as { message?: string; code?: string; detail?: string; hint?: string; position?: string };
          console.error(`\n✗ MIGRATION FAILED: ${m.id}`);
          console.error(`  message: ${pgErr.message}`);
          if (pgErr.code) console.error(`  code: ${pgErr.code}`);
          if (pgErr.detail) console.error(`  detail: ${pgErr.detail}`);
          if (pgErr.hint) console.error(`  hint: ${pgErr.hint}`);
          if (pgErr.position) console.error(`  position: ${pgErr.position}`);
          console.error("\nStopping immediately. No further migrations were attempted. This migration was rolled back - nothing from it was left partially applied.");
          process.exit(1);
        }
      }
    }

    console.log("\n=== Post-migration verification ===");
    const checks: { label: string; query: string }[] = [
      { label: "profiles table", query: "SELECT to_regclass('public.profiles') IS NOT NULL AS ok" },
      { label: "get_user_role() function", query: "SELECT EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_schema='public' AND routine_name='get_user_role') AS ok" },
      { label: "courses / modules / lessons tables", query: "SELECT to_regclass('public.courses') IS NOT NULL AND to_regclass('public.modules') IS NOT NULL AND to_regclass('public.lessons') IS NOT NULL AS ok" },
      { label: "learning_assessments + lesson_progress tables", query: "SELECT to_regclass('public.learning_assessments') IS NOT NULL AND to_regclass('public.lesson_progress') IS NOT NULL AS ok" },
      { label: "certifications / questions / question_options tables", query: "SELECT to_regclass('public.certifications') IS NOT NULL AND to_regclass('public.questions') IS NOT NULL AND to_regclass('public.question_options') IS NOT NULL AS ok" },
      { label: "answer-key isolation tables (question_answer_key, matching_answer_key, drag_and_drop_answer_key, hotspots)", query: "SELECT to_regclass('public.question_answer_key') IS NOT NULL AND to_regclass('public.matching_answer_key') IS NOT NULL AND to_regclass('public.drag_and_drop_answer_key') IS NOT NULL AND to_regclass('public.hotspots') IS NOT NULL AS ok" },
      { label: "import_question_bundle() RPC", query: "SELECT EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_schema='public' AND routine_name='import_question_bundle') AS ok" },
      { label: "pgvector extension enabled", query: "SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') AS ok" },
      { label: "question_patterns / generation_batches / question_embeddings tables", query: "SELECT to_regclass('public.question_patterns') IS NOT NULL AND to_regclass('public.generation_batches') IS NOT NULL AND to_regclass('public.question_embeddings') IS NOT NULL AS ok" },
      { label: "next_ai_question_id() / set_question_status() / find_similar_questions() RPCs", query: "SELECT EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_schema='public' AND routine_name='next_ai_question_id') AND EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_schema='public' AND routine_name='set_question_status') AND EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_schema='public' AND routine_name='find_similar_questions') AS ok" },
      { label: "lesson_resources / learning_assessment_question_links / student_lesson_notes / learning_progress_pointer tables", query: "SELECT to_regclass('public.lesson_resources') IS NOT NULL AND to_regclass('public.learning_assessment_question_links') IS NOT NULL AND to_regclass('public.student_lesson_notes') IS NOT NULL AND to_regclass('public.learning_progress_pointer') IS NOT NULL AS ok" },
      { label: "student_study_time table", query: "SELECT to_regclass('public.student_study_time') IS NOT NULL AS ok" },
      { label: "increment_study_time() RPC", query: "SELECT EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_schema='public' AND routine_name='increment_study_time') AS ok" },
      { label: "practice_sessions / practice_session_questions tables", query: "SELECT to_regclass('public.practice_sessions') IS NOT NULL AND to_regclass('public.practice_session_questions') IS NOT NULL AS ok" },
      { label: "create_practice_session() / select_practice_questions() / count_eligible_practice_questions() RPCs", query: "SELECT EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_schema='public' AND routine_name='create_practice_session') AND EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_schema='public' AND routine_name='select_practice_questions') AND EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_schema='public' AND routine_name='count_eligible_practice_questions') AS ok" },
      { label: "practice RPCs are executable by authenticated (deliberately, per migration 012)", query: "SELECT has_function_privilege('authenticated', 'create_practice_session(uuid, question_domain, question_approach, question_difficulty, question_interaction_type, question_answer_type, text, int, boolean, int)', 'EXECUTE') AS ok" },
      { label: "enrollments table", query: "SELECT to_regclass('public.enrollments') IS NOT NULL AS ok" },
    ];

    let allOk = true;
    for (const check of checks) {
      const { rows } = await client.query(check.query);
      const ok = rows[0]?.ok === true;
      if (!ok) allOk = false;
      console.log(`  ${ok ? "✓" : "✗ MISSING"}  ${check.label}`);
    }

    // RLS + privilege spot-checks - confirm the answer-key tables and AI
    // write RPCs are still locked down exactly as every migration intended.
    console.log("\n=== Security spot-checks ===");
    const { rows: rlsRows } = await client.query(`
      SELECT c.relname, c.relrowsecurity
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relname IN ('question_answer_key','matching_answer_key','drag_and_drop_answer_key','hotspots','learning_assessment_answer_key','student_lesson_notes','student_study_time','practice_sessions','practice_session_questions')
    `);
    for (const row of rlsRows as { relname: string; relrowsecurity: boolean }[]) {
      console.log(`  ${row.relrowsecurity ? "✓" : "✗ RLS DISABLED"}  RLS enabled on ${row.relname}`);
    }

    const { rows: grantRows } = await client.query(`
      SELECT p.proname, r.rolname, has_function_privilege(r.oid, p.oid, 'EXECUTE') AS can_execute
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      CROSS JOIN pg_roles r
      WHERE n.nspname = 'public'
        AND p.proname IN ('import_question_bundle','set_question_status','store_question_embedding','next_ai_question_id','find_similar_questions','increment_pattern_usage')
        AND r.rolname IN ('anon','authenticated')
    `);
    const unexpectedGrants = (grantRows as { proname: string; rolname: string; can_execute: boolean }[]).filter((r) => r.can_execute);
    if (unexpectedGrants.length === 0) {
      console.log("  ✓ No write RPC is executable by anon/authenticated (service-role only, as intended).");
    } else {
      allOk = false;
      for (const g of unexpectedGrants) {
        console.log(`  ✗ UNEXPECTED GRANT: ${g.proname} is executable by ${g.rolname}`);
      }
    }

    console.log(`\n=== ${allOk ? "ALL CHECKS PASSED" : "SOME CHECKS FAILED - see ✗ above" } ===`);
    process.exit(allOk ? 0 : 1);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Migration runner crashed:", err);
  process.exit(1);
});
