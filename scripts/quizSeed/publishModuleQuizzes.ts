/**
 * Phase 6: publish the five Module 2-6 quiz assessments, ONLY after
 * verifySeed.ts has passed. Sets is_published = true on exactly the five
 * known assessment rows - no other rows are touched, and no new rows are
 * created (avoids duplicate assessment rows).
 *
 * Usage: npx tsx scripts/quizSeed/publishModuleQuizzes.ts
 */

import { config as loadEnv } from "dotenv";
import path from "node:path";
loadEnv({ path: path.resolve(__dirname, "../../.env.local") });

import { supabaseAdmin } from "../../src/lib/supabase/admin";

const ASSESSMENT_IDS = [
  "0d8d0755-fdd1-4e7b-a2c1-de4485766f67", // Module 2
  "77f89e56-1424-440f-a0e7-fb7920ecd15d", // Module 3
  "5dd1aec3-c81b-4804-af4f-8ef7bd19e299", // Module 4
  "12f00388-4585-47be-bc00-dc034002d450", // Module 5
  "8a6190d3-3317-4112-9c5b-6dd0cf18e1a8", // Module 6
];

async function main() {
  console.log(`Publishing ${ASSESSMENT_IDS.length} module quiz assessments...`);

  const { data, error } = await supabaseAdmin
    .from("learning_assessments")
    .update({ is_published: true })
    .in("id", ASSESSMENT_IDS)
    .select("id, title_en, is_published");

  if (error) {
    console.error("!!! FAILED to publish:", error.message);
    process.exit(1);
  }

  for (const row of data ?? []) {
    console.log(`  ${row.title_en}: is_published = ${row.is_published}`);
  }

  if ((data ?? []).length !== ASSESSMENT_IDS.length) {
    console.error(`!!! Expected to update ${ASSESSMENT_IDS.length} rows, updated ${(data ?? []).length}`);
    process.exit(1);
  }

  console.log("\nAll 5 module quizzes published.");
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
