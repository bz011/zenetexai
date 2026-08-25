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
    .is("deleted_at", null);

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

/**
 * Question IDs this student has already seen across ANY past Mock Exam
 * attempt (any status - even an abandoned/expired attempt still means the
 * student was shown that question). Feeds pickQuestionsForDraw's unseen
 * preference (item 17) - a strong preference, not a hard filter, so reuse
 * degrades gracefully when the blueprint genuinely can't avoid it.
 */
export async function fetchSeenQuestionIds(supabase: SupabaseClient, userId: string): Promise<Set<string>> {
  const { data: attempts } = await supabase.from("mock_exam_attempts").select("id").eq("user_id", userId);
  const attemptIds = ((attempts ?? []) as { id: string }[]).map((a) => a.id);
  if (attemptIds.length === 0) return new Set();

  const { data: questions } = await supabase
    .from("mock_exam_attempt_questions")
    .select("question_id")
    .in("attempt_id", attemptIds)
    .not("question_id", "is", null);

  return new Set(((questions ?? []) as { question_id: string }[]).map((q) => q.question_id));
}
