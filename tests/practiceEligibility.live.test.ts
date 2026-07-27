import { describe, it, expect, beforeAll, afterAll } from "vitest";
import path from "node:path";
import { config as loadEnv } from "dotenv";
import { Client } from "pg";

/**
 * Regression coverage for the "0 questions available" incident: the root
 * cause was that the question bank had never been imported into the live
 * database (an empty `questions` table), not a bug in
 * count_eligible_practice_questions/select_practice_questions or an
 * enum/casing mismatch - every enum label and the RPC's own SQL matched
 * expectations exactly once real data existed.
 *
 * This is deliberately a live-database integration test, not a mocked
 * unit test: mocking Supabase here would only prove the mock is
 * internally consistent, not that the real RPCs return real approved
 * questions from the real question bank. It skips cleanly (not a failure)
 * whenever DATABASE_URL isn't available - CI/Vercel builds are not
 * expected to have direct Postgres access, so this never blocks a build;
 * it runs for real whenever a developer (or the migration-verification
 * step) has DB connectivity, which is exactly when it's meaningful.
 */

loadEnv({ path: path.resolve(__dirname, "../.env.local") });

const hasDatabaseUrl = !!process.env.DATABASE_URL;

describe.skipIf(!hasDatabaseUrl)("Practice question eligibility (live Supabase)", () => {
  let client: Client;
  let pmpCertificationId: string;

  beforeAll(async () => {
    client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
    await client.connect();
    const { rows } = await client.query("SELECT id FROM certifications WHERE code = 'PMP'");
    pmpCertificationId = rows[0]?.id;
  });

  afterAll(async () => {
    await client.end();
  });

  it("has a PMP certification row to select against", () => {
    expect(pmpCertificationId).toBeTruthy();
  });

  it("count_eligible_practice_questions with all filters null returns more than zero approved PMP questions", async () => {
    const { rows } = await client.query(
      `SELECT count_eligible_practice_questions($1, NULL, NULL, NULL, NULL, NULL, 'en') AS eligible_count`,
      [pmpCertificationId]
    );
    expect(rows[0].eligible_count).toBeGreaterThan(0);
  });

  it("count_eligible_practice_questions matches a manual query restricted to status = 'approved'", async () => {
    const { rows: rpcRows } = await client.query(
      `SELECT count_eligible_practice_questions($1, NULL, NULL, NULL, NULL, NULL, 'en') AS eligible_count`,
      [pmpCertificationId]
    );
    const { rows: manualRows } = await client.query(
      `SELECT COUNT(*)::int AS manual_count FROM questions
       WHERE certification_id = $1 AND status = 'approved'::question_status AND deleted_at IS NULL`,
      [pmpCertificationId]
    );
    expect(rpcRows[0].eligible_count).toBe(manualRows[0].manual_count);
  });

  it("select_practice_questions with all filters null returns the requested number of distinct questions, all approved", async () => {
    const { rows } = await client.query(
      `SELECT question_id FROM select_practice_questions($1, NULL, NULL, NULL, NULL, NULL, 'en', 10)`,
      [pmpCertificationId]
    );
    expect(rows.length).toBe(10);

    const uniqueIds = new Set(rows.map((r: { question_id: string }) => r.question_id));
    expect(uniqueIds.size).toBe(rows.length); // no duplicates

    const ids = rows.map((r: { question_id: string }) => r.question_id);
    const { rows: statusRows } = await client.query(
      `SELECT DISTINCT status FROM questions WHERE question_id = ANY($1)`,
      [ids]
    );
    expect(statusRows.every((r: { status: string }) => r.status === "approved")).toBe(true);
  });

  it("select_practice_questions never returns more than the eligible count when the pool is smaller than requested", async () => {
    const { rows: countRows } = await client.query(
      `SELECT count_eligible_practice_questions($1, NULL, 'Predictive', 'Expert', NULL, NULL, 'en') AS eligible_count`,
      [pmpCertificationId]
    );
    const eligibleCount = countRows[0].eligible_count as number;

    const { rows: selectRows } = await client.query(
      `SELECT question_id FROM select_practice_questions($1, NULL, 'Predictive', 'Expert', NULL, NULL, 'en', 500)`,
      [pmpCertificationId]
    );
    expect(selectRows.length).toBe(eligibleCount);
    expect(selectRows.length).toBeLessThanOrEqual(500);
  });
});
