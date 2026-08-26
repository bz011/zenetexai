/**
 * Real approved-bank inventory reads for the blueprint engine (Sprint 9).
 * The engine itself (blueprintEngine.ts) never touches Supabase - this file
 * is the one bridge between it and the live `questions` table, plus
 * question-reuse-avoidance (item 17: which questions has this student
 * already seen in a past Mock Exam attempt).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { PmpDomain, PmpApproach, PmpDifficulty, PmpInteractionType, PmpAnswerType } from "@/features/mock-exam/config/examBlueprint";
import { cellKey, type InventoryCounts, type InventoryQuestionRow } from "@/features/mock-exam/services/blueprintEngine";

interface QuestionInventoryRow {
  question_id: string;
  domain: string | null;
  approach: string | null;
  difficulty: string | null;
  interaction_type: string;
  answer_type: string;
}

/**
 * Every approved, non-deleted question for this certification with a
 * complete domain/approach/difficulty classification - a question missing
 * any of those three cannot be placed into the blueprint's cell grid, so it
 * is excluded here (logged as a count, not silently dropped without trace)
 * rather than crashing the allocator. In practice the current bank has zero
 * such rows (confirmed via inventory query during the Sprint 9 architecture
 * review), but the filter is defensive, not assumed.
 */
export async function fetchApprovedQuestionInventory(
  supabase: SupabaseClient,
  certificationId: string
): Promise<{ rows: InventoryQuestionRow[]; excludedIncompleteCount: number }> {
  const { data } = await supabase
    .from("questions")
    .select("question_id, domain, approach, difficulty, interaction_type, answer_type")
    .eq("certification_id", certificationId)
    .eq("status", "approved")
    .is("deleted_at", null)
    .eq("image_verified_broken", false);

  const allRows = (data ?? []) as QuestionInventoryRow[];
  const complete = allRows.filter((r) => r.domain && r.approach && r.difficulty);

  return {
    rows: complete.map((r) => ({
      questionId: r.question_id,
      domain: r.domain as PmpDomain,
      approach: r.approach as PmpApproach,
      difficulty: r.difficulty as PmpDifficulty,
      interactionType: r.interaction_type as PmpInteractionType,
      answerType: r.answer_type as PmpAnswerType,
    })),
    excludedIncompleteCount: allRows.length - complete.length,
  };
}

export function tallyCellCounts(rows: InventoryQuestionRow[]): InventoryCounts {
  const counts: InventoryCounts = {};
  for (const row of rows) {
    const key = cellKey(row.domain, row.approach, row.difficulty);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

export function tallyInteractionTypeCounts(rows: InventoryQuestionRow[]): Record<PmpInteractionType, number> {
  const counts: Record<PmpInteractionType, number> = { standard: 0, graphic_based: 0, drag_and_drop: 0, hotspot: 0, matching: 0 };
  for (const row of rows) counts[row.interactionType] += 1;
  return counts;
}

export function tallyAnswerTypeCounts(rows: InventoryQuestionRow[]): Record<PmpAnswerType, number> {
  const counts: Record<PmpAnswerType, number> = { single: 0, multiple_response: 0 };
  for (const row of rows) counts[row.answerType] += 1;
  return counts;
}

export interface QuestionHistoryForUser {
  /** How many times this student has been shown each question, across EVERY past attempt including retakes - a retake genuinely re-exposes those questions, so it counts here (Sprint 9.1 item 7). Feeds pickQuestionsForDraw's never-seen/least-seen tiers. */
  seenCounts: Map<string, number>;
  /** The question set of the student's most recent INDEPENDENTLY-GENERATED attempt (retake_of_attempt_id IS NULL) - retakes of that exam are deliberately excluded from this set, so a retake chain never distorts the <=40-overlap comparison (item 7A: "Exam B's overlap calculation should compare against the most recent independently generated exam set, not against each retake"). Empty on a student's first exam. */
  previousAttemptQuestionIds: Set<string>;
  /** The attempt id previousAttemptQuestionIds came from, for reporting - null if there is no prior independently-generated attempt. */
  previousAttemptId: string | null;
}

/**
 * Full per-student question-exposure history for the blueprint engine's
 * reuse-avoidance and overlap-cap policy (Sprint 9.1 item 7). Scoped
 * entirely by userId - RLS additionally backstops this at the query level
 * (a user can only ever read their own mock_exam_attempts rows), so User
 * A's history can never leak into User B's selection.
 */
export async function fetchQuestionHistoryForUser(supabase: SupabaseClient, userId: string): Promise<QuestionHistoryForUser> {
  const { data: attempts } = await supabase
    .from("mock_exam_attempts")
    .select("id, retake_of_attempt_id, started_at")
    .eq("user_id", userId)
    .order("started_at", { ascending: false });

  type AttemptRow = { id: string; retake_of_attempt_id: string | null; started_at: string };
  const attemptRows = (attempts ?? []) as AttemptRow[];
  if (attemptRows.length === 0) {
    return { seenCounts: new Map(), previousAttemptQuestionIds: new Set(), previousAttemptId: null };
  }

  const attemptIds = attemptRows.map((a) => a.id);
  const { data: questionRows } = await supabase
    .from("mock_exam_attempt_questions")
    .select("attempt_id, question_id")
    .in("attempt_id", attemptIds)
    .not("question_id", "is", null);

  type QuestionRow = { attempt_id: string; question_id: string };
  const rows = (questionRows ?? []) as QuestionRow[];

  const seenCounts = new Map<string, number>();
  for (const row of rows) {
    seenCounts.set(row.question_id, (seenCounts.get(row.question_id) ?? 0) + 1);
  }

  const mostRecentIndependent = attemptRows.find((a) => a.retake_of_attempt_id === null) ?? null;
  const previousAttemptQuestionIds = mostRecentIndependent
    ? new Set(rows.filter((r) => r.attempt_id === mostRecentIndependent.id).map((r) => r.question_id))
    : new Set<string>();

  return { seenCounts, previousAttemptQuestionIds, previousAttemptId: mostRecentIndependent?.id ?? null };
}
