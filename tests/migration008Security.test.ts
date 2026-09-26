import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * Static assertions against the migration 008 SQL text itself. This is not a
 * substitute for running the migration against a real Postgres instance (not
 * available in this environment - see the Sprint 5 final report), but it
 * catches the specific regression this schema is most at risk of: someone
 * loosening RLS or granting PUBLIC/authenticated execute on a write RPC
 * during a later edit without realizing the security implication.
 */
const migrationPath = path.resolve(__dirname, "../../migrations/008_ai_question_generation.sql");
const sql = fs.readFileSync(migrationPath, "utf-8");

const AI_ONLY_TABLES = ["question_patterns", "generation_batches", "generation_batch_questions", "question_embeddings", "generation_similarity_results"];

const WRITE_RPCS = ["next_ai_question_id", "set_question_status", "store_question_embedding", "increment_pattern_usage", "find_similar_questions"];

describe("migration 008 SQL - security invariants", () => {
  it("enables row level security on every new AI-generation table", () => {
    for (const table of AI_ONLY_TABLES) {
      expect(sql).toMatch(new RegExp(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`));
    }
  });

  it("only grants SELECT (never INSERT/UPDATE/DELETE) to authenticated on AI-generation tables", () => {
    for (const table of AI_ONLY_TABLES) {
      const policyPattern = new RegExp(`CREATE POLICY[^;]*ON ${table}[^;]*FOR (\\w+)[^;]*TO authenticated`, "g");
      const matches = [...sql.matchAll(policyPattern)];
      expect(matches.length).toBeGreaterThan(0);
      for (const match of matches) {
        expect(match[1]).toBe("SELECT");
      }
    }
  });

  it("revokes PUBLIC execute on every write RPC introduced by this migration", () => {
    for (const rpc of WRITE_RPCS) {
      expect(sql).toMatch(new RegExp(`REVOKE ALL ON FUNCTION ${rpc}\\(`));
    }
  });

  it("scopes the answer-key review policies to admin/instructor only, never a broader role", () => {
    const answerKeyPolicyPattern = /CREATE POLICY[^;]*review (answer keys|matching answer keys|drag-and-drop answer keys|hotspots)[^;]*USING \(get_user_role\(\) IN \('admin', 'instructor'\)\)/g;
    const matches = [...sql.matchAll(answerKeyPolicyPattern)];
    expect(matches.length).toBe(4);
  });

  it("guards against colliding with the unapproved legacy question_patterns/question_embeddings tables before creating anything", () => {
    const firstGuardIndex = sql.indexOf("RAISE EXCEPTION");
    const firstTableIndex = sql.indexOf("CREATE TABLE IF NOT EXISTS question_patterns");
    expect(firstGuardIndex).toBeGreaterThan(-1);
    expect(firstGuardIndex).toBeLessThan(firstTableIndex);
  });
});
