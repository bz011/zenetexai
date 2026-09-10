/**
 * Phase 5 read-only verification: confirms stored DB content exactly
 * matches the FINAL approved manifest (module2Questions.ts..module6Questions.ts)
 * before anything is published. Checks structure (counts, option counts,
 * answer-key counts, ordering) AND content (EN/AR text equality, correct
 * option matches manifest). Exits non-zero on ANY mismatch - nothing should
 * be published if this script fails.
 *
 * Usage: npx tsx scripts/quizSeed/verifySeed.ts
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

async function verifyAssessment(name: string, assessmentId: string, manifest: QuizQuestionSeed[]): Promise<boolean> {
  console.log(`\n=== ${name} ===`);
  let ok = true;

  const { data: questions } = await supabaseAdmin
    .from("learning_assessment_questions")
    .select("id, question_text_en, question_text_ar, explanation_en, explanation_ar, order_index")
    .eq("assessment_id", assessmentId)
    .order("order_index", { ascending: true });

  const qRows = questions ?? [];
  console.log(`  1. Question count: ${qRows.length} (expect 10)${qRows.length === 10 ? " OK" : " !!! MISMATCH"}`);
  if (qRows.length !== 10) ok = false;

  const orderIndexes = qRows.map((q) => q.order_index);
  const orderOk = JSON.stringify(orderIndexes) === JSON.stringify([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  console.log(`  6. Display order 0-9: ${JSON.stringify(orderIndexes)}${orderOk ? " OK" : " !!! MISMATCH"}`);
  if (!orderOk) ok = false;

  const questionIds = qRows.map((q) => q.id);
  const { data: options } = questionIds.length
    ? await supabaseAdmin
        .from("learning_assessment_options")
        .select("id, question_id, option_text_en, option_text_ar, order_index")
        .in("question_id", questionIds)
    : { data: [] };
  const optRows = options ?? [];
  console.log(`  2. Total option count: ${optRows.length} (expect 40)${optRows.length === 40 ? " OK" : " !!! MISMATCH"}`);
  if (optRows.length !== 40) ok = false;

  const optionIds = optRows.map((o) => o.id);
  const { data: keys } = optionIds.length
    ? await supabaseAdmin.from("learning_assessment_answer_key").select("option_id, is_correct").in("option_id", optionIds)
    : { data: [] };
  const keyRows = (keys ?? []).filter((k) => k.is_correct);
  console.log(`  3. Answer-key (is_correct=true) count: ${keyRows.length} (expect 10)${keyRows.length === 10 ? " OK" : " !!! MISMATCH"}`);
  if (keyRows.length !== 10) ok = false;

  const correctOptionIds = new Set(keyRows.map((k) => k.option_id));

  for (let i = 0; i < manifest.length; i++) {
    const manifestQ = manifest[i];
    const dbQ = qRows[i];
    if (!dbQ) {
      console.log(`  Q${i + 1}: !!! MISSING from DB`);
      ok = false;
      continue;
    }
    const qOpts = optRows.filter((o) => o.question_id === dbQ.id).sort((a, b) => a.order_index - b.order_index);

    const errs: string[] = [];
    if (qOpts.length !== 4) errs.push(`expected 4 options, found ${qOpts.length}`);
    const optOrderOk = JSON.stringify(qOpts.map((o) => o.order_index)) === JSON.stringify([0, 1, 2, 3]);
    if (!optOrderOk) errs.push(`option order not A/B/C/D (0-3): ${JSON.stringify(qOpts.map((o) => o.order_index))}`);

    if (dbQ.question_text_en !== manifestQ.questionEn) errs.push("EN question text mismatch");
    if (dbQ.question_text_ar !== manifestQ.questionAr) errs.push("AR question text mismatch");
    if (!dbQ.question_text_en?.trim()) errs.push("EN question text empty"); // check 8
    if (!dbQ.question_text_ar?.trim()) errs.push("AR question text empty"); // check 9
    if (dbQ.explanation_en !== manifestQ.explanationEn) errs.push("EN explanation mismatch");
    if (dbQ.explanation_ar !== manifestQ.explanationAr) errs.push("AR explanation mismatch");
    if (!dbQ.explanation_en?.trim()) errs.push("EN explanation empty"); // check 10
    if (!dbQ.explanation_ar?.trim()) errs.push("AR explanation empty"); // check 11

    qOpts.forEach((o, oi) => {
      const [manifestEn, manifestAr] = manifestQ.options[oi] ?? [null, null];
      if (o.option_text_en !== manifestEn) errs.push(`option ${oi} EN mismatch`);
      if (o.option_text_ar !== manifestAr) errs.push(`option ${oi} AR mismatch`);
    });

    const dbCorrectOpt = qOpts.find((o) => correctOptionIds.has(o.id));
    const dbCorrectIndex = dbCorrectOpt?.order_index;
    if (dbCorrectIndex !== manifestQ.correctIndex) {
      errs.push(`correct-answer letter mismatch: DB=${dbCorrectIndex} manifest=${manifestQ.correctIndex}`); // check 12
    }
    // exactly one correct answer per question (check 5)
    const correctCountForQ = qOpts.filter((o) => correctOptionIds.has(o.id)).length;
    if (correctCountForQ !== 1) errs.push(`expected exactly 1 correct option, found ${correctCountForQ}`);

    if (errs.length > 0) {
      console.log(`  Q${i + 1}: !!! ${errs.join("; ")}`);
      ok = false;
    }
  }

  if (ok) console.log(`  4/5/7/8/9/10/11/12. Every question: 4 options, exactly 1 correct, EN/AR populated, correct letter matches manifest - ALL OK.`);

  return ok;
}

async function main() {
  console.log("Verifying seeded content against the FINAL approved manifest...");
  let allOk = true;
  let totalQ = 0;
  let totalOpt = 0;
  let totalKeys = 0;

  for (const a of ASSESSMENTS) {
    const ok = await verifyAssessment(a.name, a.assessmentId, a.questions);
    if (!ok) allOk = false;

    const { count: qCount } = await supabaseAdmin
      .from("learning_assessment_questions")
      .select("id", { count: "exact", head: true })
      .eq("assessment_id", a.assessmentId);
    totalQ += qCount ?? 0;
  }

  // System-wide counts scoped to exactly these 5 assessments (not global table counts).
  const allAssessmentIds = ASSESSMENTS.map((a) => a.assessmentId);
  const { data: allQ } = await supabaseAdmin.from("learning_assessment_questions").select("id").in("assessment_id", allAssessmentIds);
  const allQIds = (allQ ?? []).map((q: any) => q.id);
  const { count: optCount } = await supabaseAdmin
    .from("learning_assessment_options")
    .select("id", { count: "exact", head: true })
    .in("question_id", allQIds);
  totalOpt = optCount ?? 0;
  const { data: allOpts } = await supabaseAdmin.from("learning_assessment_options").select("id").in("question_id", allQIds);
  const allOptIds = (allOpts ?? []).map((o: any) => o.id);
  const { count: keyCount } = await supabaseAdmin
    .from("learning_assessment_answer_key")
    .select("option_id", { count: "exact", head: true })
    .in("option_id", allOptIds)
    .eq("is_correct", true);
  totalKeys = keyCount ?? 0;

  console.log(`\n=== SYSTEM-WIDE TOTALS (scoped to these 5 assessments) ===`);
  console.log(`Questions: ${totalQ} (expect 50)`);
  console.log(`Options: ${totalOpt} (expect 200)`);
  console.log(`Answer keys (is_correct=true): ${totalKeys} (expect 50)`);

  if (totalQ !== 50 || totalOpt !== 200 || totalKeys !== 50) allOk = false;

  console.log(allOk ? "\n*** ALL VERIFICATION CHECKS PASSED - safe to publish. ***" : "\n!!! VERIFICATION FAILED - DO NOT PUBLISH. See mismatches above.");
  process.exit(allOk ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
