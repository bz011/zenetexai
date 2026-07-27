#!/usr/bin/env node
/**
 * One-off diagnostic for the "0 questions available" Practice Mode report.
 * Read-only - no writes. Connects with the same DATABASE_URL the migration
 * runner uses.
 */
import path from "node:path";
import { config as loadEnv } from "dotenv";
import { Client } from "pg";

loadEnv({ path: path.resolve(__dirname, "../../.env.local") });

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("Missing DATABASE_URL");
    process.exit(1);
  }

  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log("Connected.\n");

  async function q(label: string, sql: string) {
    console.log(`--- ${label} ---`);
    try {
      const { rows } = await client.query(sql);
      console.table ? console.table(rows) : console.log(JSON.stringify(rows, null, 2));
    } catch (err) {
      console.error("QUERY FAILED:", (err as Error).message);
    }
    console.log();
  }

  // 0. Which database/host are we actually connected to?
  await q("current_database / current host info", `SELECT current_database() AS db, inet_server_addr()::text AS host, current_user AS "user"`);

  // 1. Total questions
  await q("total questions", `SELECT COUNT(*) AS total FROM questions`);

  // 2. By status (raw, no assumptions about casing)
  await q("questions by status (raw enum value)", `SELECT status, COUNT(*) FROM questions GROUP BY status ORDER BY 2 DESC`);

  // 3. lower(status) = 'approved'
  await q("questions where lower(status::text) = 'approved'", `SELECT COUNT(*) FROM questions WHERE lower(status::text) = 'approved'`);

  // 3b. exact enum match
  await q("questions where status = 'approved'::question_status", `SELECT COUNT(*) FROM questions WHERE status = 'approved'::question_status`);

  // 4. By certification
  await q(
    "questions by certification",
    `SELECT c.code, c.id, COUNT(q.*) FROM certifications c LEFT JOIN questions q ON q.certification_id = c.id GROUP BY c.code, c.id`
  );

  // 4b. certifications table itself
  await q("certifications table", `SELECT id, code, name, is_active FROM certifications`);

  // 5. By domain
  await q("questions by domain (raw)", `SELECT domain, COUNT(*) FROM questions GROUP BY domain ORDER BY 2 DESC`);

  // 6. By approach
  await q("questions by approach (raw)", `SELECT approach, COUNT(*) FROM questions GROUP BY approach ORDER BY 2 DESC`);

  // 7. By difficulty
  await q("questions by difficulty (raw)", `SELECT difficulty, COUNT(*) FROM questions GROUP BY difficulty ORDER BY 2 DESC`);

  // 8. By interaction_type
  await q("questions by interaction_type", `SELECT interaction_type, COUNT(*) FROM questions GROUP BY interaction_type ORDER BY 2 DESC`);

  // 8b. By answer_type
  await q("questions by answer_type", `SELECT answer_type, COUNT(*) FROM questions GROUP BY answer_type ORDER BY 2 DESC`);

  // 9. Missing/null classification fields
  await q(
    "questions with null classification fields",
    `SELECT
       COUNT(*) FILTER (WHERE domain IS NULL) AS null_domain,
       COUNT(*) FILTER (WHERE approach IS NULL) AS null_approach,
       COUNT(*) FILTER (WHERE difficulty IS NULL) AS null_difficulty,
       COUNT(*) FILTER (WHERE certification_id IS NULL) AS null_certification_id,
       COUNT(*) FILTER (WHERE deleted_at IS NOT NULL) AS soft_deleted
     FROM questions`
  );

  // 10. deleted_at distribution
  await q("deleted_at IS NULL vs NOT NULL", `SELECT (deleted_at IS NULL) AS not_deleted, COUNT(*) FROM questions GROUP BY 1`);

  // 11. enum labels actually defined in the DB (ground truth, not assumed)
  await q(
    "question_domain enum labels",
    `SELECT enumlabel FROM pg_enum WHERE enumtypid = 'question_domain'::regtype ORDER BY enumsortorder`
  );
  await q(
    "question_approach enum labels",
    `SELECT enumlabel FROM pg_enum WHERE enumtypid = 'question_approach'::regtype ORDER BY enumsortorder`
  );
  await q(
    "question_difficulty enum labels",
    `SELECT enumlabel FROM pg_enum WHERE enumtypid = 'question_difficulty'::regtype ORDER BY enumsortorder`
  );
  await q(
    "question_status enum labels",
    `SELECT enumlabel FROM pg_enum WHERE enumtypid = 'question_status'::regtype ORDER BY enumsortorder`
  );
  await q(
    "question_interaction_type enum labels",
    `SELECT enumlabel FROM pg_enum WHERE enumtypid = 'question_interaction_type'::regtype ORDER BY enumsortorder`
  );

  // 12. Execute the actual RPC with all-null filters, exactly as the app calls it
  await q(
    "count_eligible_practice_questions(PMP cert id, all filters null, language='en')",
    `SELECT count_eligible_practice_questions(
       (SELECT id FROM certifications WHERE code = 'PMP'),
       NULL, NULL, NULL, NULL, NULL, 'en'
     ) AS eligible_count`
  );

  await q(
    "select_practice_questions(PMP cert id, all filters null, limit 5)",
    `SELECT * FROM select_practice_questions(
       (SELECT id FROM certifications WHERE code = 'PMP'),
       NULL, NULL, NULL, NULL, NULL, 'en', 5
     )`
  );

  // 13. Manual equivalent of the RPC's WHERE clause, to compare against the RPC's own result
  await q(
    "manual equivalent of the RPC WHERE clause (PMP, approved, not deleted)",
    `SELECT COUNT(*) FROM questions q
     JOIN certifications c ON c.id = q.certification_id
     WHERE c.code = 'PMP'
       AND q.status = 'approved'::question_status
       AND q.deleted_at IS NULL`
  );

  // 14. Sample rows to eyeball actual values
  await q(
    "sample of 5 questions (raw values)",
    `SELECT question_id, certification_id, status, domain, approach, difficulty, interaction_type, answer_type, question_text_en IS NOT NULL AS has_text
     FROM questions LIMIT 5`
  );

  await client.end();
}

main().catch((err) => {
  console.error("Diagnostic script crashed:", err);
  process.exit(1);
});
