#!/usr/bin/env node
/**
 * Generic, content-agnostic image-completeness verification (Sprint 9.1,
 * scope-corrected in Sprint 9.2 to also cover hotspot - a hotspot question
 * needs its background image exactly as much as a graphic_based one does;
 * the original version only checked graphic_based and silently left
 * Q000247 (hotspot) unverified). NOT a one-off patch for specific
 * question_ids - this evaluates every image-dependent question the same
 * way and persists the result:
 *
 *   1. Zero question_images rows (or every row has a blank image_path) ->
 *      broken. No network call needed - this alone was true for every
 *      AI-generated graphic_based question (draftAdapter.ts never attaches
 *      a real image; see that file's comment).
 *   2. At least one row exists -> verify the object is actually reachable
 *      in Storage (scripts/content/setupQuestionImageBucket.ts's bucket).
 *      Broken if the bucket doesn't exist yet or the object isn't found.
 *
 * Sets questions.image_verified_broken + image_verified_at (migration 017).
 * Practice/Mock Exam selection already excludes image_verified_broken=TRUE
 * questions (count_eligible_practice_questions / select_practice_questions
 * / examInventoryService.fetchApprovedQuestionInventory) - re-running this
 * script after real images are uploaded automatically un-flags a repaired
 * question with no manual status changes.
 *
 * Usage: npx tsx scripts/content/verifyQuestionImages.ts
 */

import { config as loadEnv } from "dotenv";
import path from "node:path";
loadEnv({ path: path.resolve(__dirname, "../../.env.local") });

import { supabaseAdmin } from "@/lib/supabase/admin";
import { QUESTION_IMAGE_BUCKET } from "@/lib/supabase/imageUrls";

interface QuestionRow {
  question_id: string;
  image_verified_broken: boolean;
}
interface ImageRow {
  question_id: string;
  image_path: string;
}

async function objectExists(imagePath: string): Promise<boolean> {
  const cleanPath = imagePath.replace(/^\/+/, "");
  const lastSlash = cleanPath.lastIndexOf("/");
  const dir = lastSlash === -1 ? "" : cleanPath.slice(0, lastSlash);
  const file = lastSlash === -1 ? cleanPath : cleanPath.slice(lastSlash + 1);

  const { data, error } = await supabaseAdmin.storage.from(QUESTION_IMAGE_BUCKET).list(dir, { search: file, limit: 1 });
  if (error) return false; // bucket missing, permission issue, etc. - treat as unverifiable = broken
  return (data ?? []).some((entry) => entry.name === file);
}

async function main() {
  const { data: questions } = await supabaseAdmin
    .from("questions")
    .select("question_id, image_verified_broken")
    .in("interaction_type", ["graphic_based", "hotspot"]);

  const questionRows = (questions ?? []) as QuestionRow[];
  console.log(`Checking ${questionRows.length} graphic_based/hotspot question(s)...`);

  if (questionRows.length === 0) {
    console.log("Nothing to verify.");
    return;
  }

  const questionIds = questionRows.map((q) => q.question_id);
  const { data: images } = await supabaseAdmin.from("question_images").select("question_id, image_path").in("question_id", questionIds);
  const imageRows = (images ?? []) as ImageRow[];

  const imagesByQuestion = new Map<string, ImageRow[]>();
  for (const img of imageRows) {
    if (!img.image_path || img.image_path.trim() === "") continue;
    const list = imagesByQuestion.get(img.question_id) ?? [];
    list.push(img);
    imagesByQuestion.set(img.question_id, list);
  }

  let brokenCount = 0;
  let fixedCount = 0;
  const nowIso = new Date().toISOString();

  for (const q of questionRows) {
    const rows = imagesByQuestion.get(q.question_id) ?? [];
    let broken: boolean;

    if (rows.length === 0) {
      broken = true;
    } else {
      const checks = await Promise.all(rows.map((r) => objectExists(r.image_path)));
      broken = !checks.some(Boolean);
    }

    if (broken !== q.image_verified_broken) {
      if (broken) brokenCount++;
      else fixedCount++;
    }

    await supabaseAdmin.from("questions").update({ image_verified_broken: broken, image_verified_at: nowIso }).eq("question_id", q.question_id);
  }

  const totalBroken = questionRows.filter((q) => imagesByQuestion.get(q.question_id) === undefined).length;
  console.log(`Done. ${brokenCount} question(s) newly marked broken, ${fixedCount} newly cleared.`);
  console.log(`(${totalBroken} had zero valid question_images rows at all.)`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
