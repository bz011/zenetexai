/**
 * Deterministic, idempotent seed for the 50 FINAL-APPROVED Module 2-6 PMP
 * Mastery Program quiz questions (see module2Questions.ts..module6Questions.ts
 * - the source of truth, transcribed verbatim from the approved content
 * review). Writes ONLY to the existing "legacy" learning-assessment tables
 * (learning_assessment_questions/options/answer_key) - the dedicated,
 * non-bank course-assessment path already defined in migration 006. Never
 * touches learning_assessment_question_links or the simulator question
 * bank.
 *
 * Safety model:
 *  - Matched by assessment_id (the five known module_assessment rows), never
 *    by position/guessing.
 *  - Idempotent: if an assessment already has exactly 10 questions whose
 *    English text matches this file's manifest exactly (in order), the
 *    assessment is skipped entirely - a rerun makes no writes. If it has a
 *    non-zero, non-matching, or partial question count, the script STOPS
 *    and reports the mismatch rather than guessing/overwriting/deleting.
 *  - One answer_key row per question (the correct option only) - matches
 *    quizGradingService's read path (it only ever needs is_correct=true
 *    rows) and the target count of 50 answer-key rows across all 5 quizzes.
 *  - Never touches is_published (seeding only - publishing is a separate,
 *    explicit step after verification).
 *  - Never touches simulator tables, purchases, entitlements, users,
 *    lessons, Bunny config, or Ziina config.
 *
 * Usage: npx tsx scripts/quizSeed/seedModuleQuizzes.ts
 */

import { config as loadEnv } from "dotenv";
import path from "node:path";
loadEnv({ path: path.resolve(__dirname, "../../.env.local") });

import { supabaseAdmin } from "../../src/lib/supabase/admin";
import type { QuizQuestionSeed } from "./types";
import { module2Questions } from "./module2Questions";
import { module3Questions } from "./module3Questions";
import { module4Questions } from "./module4Questions";
import { module5Questions } from "./module5Questions";
import { module6Questions } from "./module6Questions";

const ASSESSMENTS: { name: string; assessmentId: string; questions: QuizQuestionSeed[] }[] = [
  { name: "Module 2 - Foundations", assessmentId: "0d8d0755-fdd1-4e7b-a2c1-de4485766f67", questions: module2Questions },
  { name: "Module 3 - Agile & Hybrid", assessmentId: "77f89e56-1424-440f-a0e7-fb7920ecd15d", questions: module3Questions },
  { name: "Module 4 - People Domain", assessmentId: "5dd1aec3-c81b-4804-af4f-8ef7bd19e299", questions: module4Questions },
  { name: "Module 5 - Process Domain", assessmentId: "12f00388-4585-47be-bc00-dc034002d450", questions: module5Questions },
  { name: "Module 6 - Business Environment", assessmentId: "8a6190d3-3317-4112-9c5b-6dd0cf18e1a8", questions: module6Questions },
];

async function seedAssessment(name: string, assessmentId: string, questions: QuizQuestionSeed[]) {
  console.log(`\n=== ${name} (${assessmentId}) ===`);

  const { data: existing, error: existingErr } = await supabaseAdmin
    .from("learning_assessment_questions")
    .select("id, question_text_en, order_index")
    .eq("assessment_id", assessmentId)
    .order("order_index", { ascending: true });

  if (existingErr) {
    console.log(`  !!! STOP: failed to read existing questions: ${existingErr.message}`);
    return false;
  }

  const existingRows = existing ?? [];

  if (existingRows.length === 10) {
    const mismatch = questions.some((q, i) => existingRows[i]?.question_text_en !== q.questionEn);
    if (!mismatch) {
      console.log("  Already seeded with matching content (10/10 questions match manifest) - skipping (idempotent no-op).");
      return true;
    }
    console.log("  !!! STOP: assessment already has 10 questions, but content does NOT match the approved manifest.");
    console.log("  Refusing to overwrite. Manual review required.");
    return false;
  }

  if (existingRows.length !== 0) {
    console.log(`  !!! STOP: assessment has ${existingRows.length} existing questions (expected 0 or 10). Anomalous partial state - refusing to guess.`);
    return false;
  }

  console.log(`  0 existing questions - inserting ${questions.length} questions...`);

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];

    const { data: questionRow, error: qErr } = await supabaseAdmin
      .from("learning_assessment_questions")
      .insert({
        assessment_id: assessmentId,
        question_text_en: q.questionEn,
        question_text_ar: q.questionAr,
        explanation_en: q.explanationEn,
        explanation_ar: q.explanationAr,
        order_index: i,
      })
      .select("id")
      .single();

    if (qErr || !questionRow) {
      console.log(`  !!! FAILED inserting question ${i + 1}: ${qErr?.message}`);
      return false;
    }

    const optionInserts = q.options.map(([en, ar], oi) => ({
      question_id: questionRow.id,
      option_text_en: en,
      option_text_ar: ar,
      order_index: oi,
    }));

    const { data: optionRows, error: oErr } = await supabaseAdmin
      .from("learning_assessment_options")
      .insert(optionInserts)
      .select("id, order_index");

    if (oErr || !optionRows || optionRows.length !== 4) {
      console.log(`  !!! FAILED inserting options for question ${i + 1}: ${oErr?.message}`);
      return false;
    }

    const correctOption = optionRows.find((o) => o.order_index === q.correctIndex);
    if (!correctOption) {
      console.log(`  !!! FAILED: could not locate correct option (index ${q.correctIndex}) for question ${i + 1}`);
      return false;
    }

    const { error: keyErr } = await supabaseAdmin
      .from("learning_assessment_answer_key")
      .insert({ option_id: correctOption.id, is_correct: true });

    if (keyErr) {
      console.log(`  !!! FAILED inserting answer key for question ${i + 1}: ${keyErr.message}`);
      return false;
    }

    console.log(`  Q${i + 1} seeded (question ${questionRow.id}, correct option ${correctOption.id}).`);
  }

  console.log(`  Done: ${questions.length}/${questions.length} questions seeded for ${name}.`);
  return true;
}

async function main() {
  console.log(`Seeding ${ASSESSMENTS.length} module quizzes (${ASSESSMENTS.reduce((n, a) => n + a.questions.length, 0)} questions total)...`);

  let allOk = true;
  for (const a of ASSESSMENTS) {
    const ok = await seedAssessment(a.name, a.assessmentId, a.questions);
    if (!ok) allOk = false;
  }

  console.log(allOk ? "\nAll 5 assessments processed successfully." : "\n!!! One or more assessments FAILED or were STOPPED - see above. Nothing further should proceed until resolved.");
  process.exit(allOk ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
