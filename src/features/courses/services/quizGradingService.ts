/**
 * Learning Quiz grading — the ONLY place in the app allowed to read
 * question_answer_key / matching_answer_key / drag_and_drop_answer_key /
 * hotspots / learning_assessment_answer_key (RLS blocks all of these for
 * every other role — see migrations 006/007/008). Always called with the
 * service-role client, and only from the submit route.
 *
 * SECURITY: the interaction_type used to decide how a question is graded is
 * always looked up here from the database, never trusted from the client's
 * submission — otherwise a client could label a question "standard" to
 * dodge matching/drag-drop/hotspot grading entirely.
 *
 * The pure comparison functions below take no Supabase client and are unit
 * tested directly; the async wrappers only fetch the relevant answer-key
 * rows and hand off to them.
 */

import type { SupabaseAdmin } from "@/lib/supabase/admin";
import type { QuestionInteractionTypeValue, QuizSource, QuizSubmitAnswer } from "@/features/courses/types/course";

export interface HotspotRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Exact-set match: every submitted option is correct AND every correct option was submitted. */
export function isOptionSelectionCorrect(correctOptionIds: Set<string>, submittedOptionIds: string[]): boolean {
  if (submittedOptionIds.length !== correctOptionIds.size) return false;
  return submittedOptionIds.every((id) => correctOptionIds.has(id));
}

/** Exact-set match on left→right pairing — no partial credit for a partially-correct matching. */
export function isMatchingCorrect(
  correctPairs: Map<string, string>,
  submittedPairs: { leftItemId: string; rightItemId: string }[]
): boolean {
  if (submittedPairs.length !== correctPairs.size) return false;
  return submittedPairs.every((p) => correctPairs.get(p.leftItemId) === p.rightItemId);
}

/** Exact ordered-sequence match — no partial credit for a partially-correct order. */
export function isDragDropCorrect(correctOrder: string[], submittedOrder: string[]): boolean {
  if (submittedOrder.length !== correctOrder.length) return false;
  return submittedOrder.every((id, i) => id === correctOrder[i]);
}

/** Click is correct if it falls inside the region's bounding box (all values 0-100, percent of image natural dimensions). */
export function isHotspotClickCorrect(region: HotspotRegion, click: { xPct: number; yPct: number }): boolean {
  return (
    click.xPct >= region.x &&
    click.xPct <= region.x + region.width &&
    click.yPct >= region.y &&
    click.yPct <= region.y + region.height
  );
}

async function getCorrectStandardOptionIds(
  supabaseAdmin: SupabaseAdmin,
  source: QuizSource,
  questionId: string
): Promise<Set<string>> {
  const optionsTable = source === "legacy" ? "learning_assessment_options" : "question_options";
  const answerKeyTable = source === "legacy" ? "learning_assessment_answer_key" : "question_answer_key";

  const { data: options } = await supabaseAdmin.from(optionsTable).select("id").eq("question_id", questionId);
  const optionIds = ((options ?? []) as { id: string }[]).map((o) => o.id);
  if (optionIds.length === 0) return new Set();

  const { data: keys } = await supabaseAdmin.from(answerKeyTable).select("option_id, is_correct").in("option_id", optionIds);
  return new Set(((keys ?? []) as { option_id: string; is_correct: boolean }[]).filter((k) => k.is_correct).map((k) => k.option_id));
}

async function getCorrectMatchingPairs(supabaseAdmin: SupabaseAdmin, questionId: string): Promise<Map<string, string>> {
  const { data } = await supabaseAdmin.from("matching_answer_key").select("left_item_id, right_item_id").eq("question_id", questionId);
  return new Map(((data ?? []) as { left_item_id: string; right_item_id: string }[]).map((p) => [p.left_item_id, p.right_item_id]));
}

async function getCorrectDragDropOrder(supabaseAdmin: SupabaseAdmin, questionId: string): Promise<string[]> {
  const { data } = await supabaseAdmin
    .from("drag_and_drop_answer_key")
    .select("item_id, correct_position")
    .eq("question_id", questionId)
    .order("correct_position", { ascending: true });
  return ((data ?? []) as { item_id: string; correct_position: number }[]).map((r) => r.item_id);
}

async function getHotspotRegions(supabaseAdmin: SupabaseAdmin, questionId: string): Promise<HotspotRegion[]> {
  const { data } = await supabaseAdmin.from("hotspots").select("x, y, width, height").eq("question_id", questionId);
  return (data ?? []) as HotspotRegion[];
}

export interface GradableQuestion {
  id: string;
  source: QuizSource;
  /** Authoritative — must come from a fresh DB lookup, never from the client's own submission. */
  interactionType: QuestionInteractionTypeValue;
}

export async function gradeQuizAnswer(
  supabaseAdmin: SupabaseAdmin,
  question: GradableQuestion,
  submitted: QuizSubmitAnswer
): Promise<boolean> {
  switch (question.interactionType) {
    case "standard":
    case "graphic_based": {
      const correct = await getCorrectStandardOptionIds(supabaseAdmin, question.source, question.id);
      return isOptionSelectionCorrect(correct, submitted.selectedOptionIds ?? []);
    }
    case "matching": {
      const correct = await getCorrectMatchingPairs(supabaseAdmin, question.id);
      return isMatchingCorrect(correct, submitted.matchingPairs ?? []);
    }
    case "drag_and_drop": {
      const correct = await getCorrectDragDropOrder(supabaseAdmin, question.id);
      return isDragDropCorrect(correct, submitted.dragDropOrder ?? []);
    }
    case "hotspot": {
      const regions = await getHotspotRegions(supabaseAdmin, question.id);
      if (!submitted.hotspotClick) return false;
      return regions.some((region) => isHotspotClickCorrect(region, submitted.hotspotClick!));
    }
    default:
      return false;
  }
}
