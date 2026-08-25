/**
 * Mock Exam grading - reuses the exact same PURE per-type comparison
 * functions quizGradingService.ts already has (isOptionSelectionCorrect /
 * isMatchingCorrect / isDragDropCorrect / isHotspotClickCorrect) - not a
 * second grading algorithm. What's different from practiceGradingService.ts
 * is the DATA-FETCHING strategy: at practice scale (<=50 questions),
 * gradeQuizAnswer's one-fetch-per-question-per-Promise.all is fine (still
 * parallel, never sequential). At Mock Exam scale (180), that's still 180
 * concurrent round trips - this file instead batch-fetches every answer-key
 * table ONCE across all 180 question_ids up front (a handful of queries
 * total, not one per question) and grades entirely in memory afterward.
 *
 * SECURITY: interaction_type is always re-read fresh from `questions` here
 * too, never trusted from anywhere else - same rule quizGradingService.ts
 * documents. Idempotent by construction, same guard as
 * practiceGradingService.ts: a terminal attempt is never re-graded.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  isOptionSelectionCorrect,
  isMatchingCorrect,
  isDragDropCorrect,
  isHotspotClickCorrect,
  type HotspotRegion,
} from "@/features/courses/services/quizGradingService";
import type { QuizSubmitAnswer, QuestionInteractionTypeValue } from "@/features/courses/types/course";

export interface SubmitMockExamResult {
  success: boolean;
  error?: string;
  alreadyGraded?: boolean;
}

interface AttemptQuestionRow {
  id: string;
  question_id: string | null;
  response: QuizSubmitAnswer | null;
}

export async function submitMockExamAttempt(
  supabase: SupabaseClient,
  attemptId: string,
  userId: string,
  reason: "manual" | "expired" = "manual"
): Promise<SubmitMockExamResult> {
  const { data: attempt } = await supabase
    .from("mock_exam_attempts")
    .select("id, status, user_id")
    .eq("id", attemptId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!attempt) {
    return { success: false, error: "Attempt not found" };
  }

  // Idempotency guard - identical reasoning to practiceGradingService.ts.
  if (attempt.status === "completed" || attempt.status === "expired") {
    return { success: true, alreadyGraded: true };
  }

  const { data: rows } = await supabase
    .from("mock_exam_attempt_questions")
    .select("id, question_id, response")
    .eq("attempt_id", attemptId);

  const attemptQuestions = (rows ?? []) as AttemptQuestionRow[];
  const questionIds = attemptQuestions.filter((r) => r.question_id).map((r) => r.question_id as string);

  // If every question_id on this attempt turned out null (e.g. every
  // question was deleted before submission), there is nothing to batch-fetch
  // - but the attempt must still be gradeable (everything unanswered) rather
  // than getting stuck un-gradeable forever, so the maps below are simply
  // left empty instead of bailing out early.
  const interactionTypeByQuestionId = new Map<string, QuestionInteractionTypeValue>();
  const correctOptionIdsByQuestion = new Map<string, Set<string>>();
  const matchingPairsByQuestion = new Map<string, Map<string, string>>();
  const dragDropOrderByQuestion = new Map<string, { item_id: string; correct_position: number }[]>();
  const hotspotRegionsByQuestion = new Map<string, HotspotRegion[]>();

  if (questionIds.length > 0) {
    // ---- Batch-fetch every answer-key table ONCE, not once per question ----
    const { data: questionMeta } = await supabaseAdmin
      .from("questions")
      .select("question_id, interaction_type")
      .in("question_id", questionIds);
    for (const q of (questionMeta ?? []) as { question_id: string; interaction_type: QuestionInteractionTypeValue }[]) {
      interactionTypeByQuestionId.set(q.question_id, q.interaction_type);
    }

    const { data: optionRows } = await supabaseAdmin.from("question_options").select("id, question_id").in("question_id", questionIds);
    const options = (optionRows ?? []) as { id: string; question_id: string }[];
    const optionIds = options.map((o) => o.id);

    const [{ data: answerKeyRows }, { data: matchingPairRows }, { data: dragDropPositionRows }, { data: hotspotRows }] = await Promise.all([
      optionIds.length
        ? supabaseAdmin.from("question_answer_key").select("option_id, is_correct").in("option_id", optionIds)
        : Promise.resolve({ data: [] as { option_id: string; is_correct: boolean }[] }),
      supabaseAdmin.from("matching_answer_key").select("question_id, left_item_id, right_item_id").in("question_id", questionIds),
      supabaseAdmin.from("drag_and_drop_answer_key").select("question_id, item_id, correct_position").in("question_id", questionIds),
      supabaseAdmin.from("hotspots").select("question_id, x, y, width, height").in("question_id", questionIds),
    ]);

    const correctByOptionId = new Map(((answerKeyRows ?? []) as { option_id: string; is_correct: boolean }[]).map((a) => [a.option_id, a.is_correct]));
    for (const opt of options) {
      if (!correctByOptionId.get(opt.id)) continue;
      const set = correctOptionIdsByQuestion.get(opt.question_id) ?? new Set<string>();
      set.add(opt.id);
      correctOptionIdsByQuestion.set(opt.question_id, set);
    }

    for (const p of (matchingPairRows ?? []) as { question_id: string; left_item_id: string; right_item_id: string }[]) {
      const map = matchingPairsByQuestion.get(p.question_id) ?? new Map<string, string>();
      map.set(p.left_item_id, p.right_item_id);
      matchingPairsByQuestion.set(p.question_id, map);
    }

    for (const d of (dragDropPositionRows ?? []) as { question_id: string; item_id: string; correct_position: number }[]) {
      const list = dragDropOrderByQuestion.get(d.question_id) ?? [];
      list.push(d);
      dragDropOrderByQuestion.set(d.question_id, list);
    }

    for (const h of (hotspotRows ?? []) as { question_id: string; x: number; y: number; width: number; height: number }[]) {
      const list = hotspotRegionsByQuestion.get(h.question_id) ?? [];
      list.push({ x: h.x, y: h.y, width: h.width, height: h.height });
      hotspotRegionsByQuestion.set(h.question_id, list);
    }
  }

  // ---- Grade entirely in memory - zero further DB calls ----
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;
  const gradedUpdates: { id: string; is_correct: boolean }[] = [];

  for (const row of attemptQuestions) {
    if (!row.question_id || !row.response) {
      unansweredCount += 1;
      continue;
    }

    const interactionType = interactionTypeByQuestionId.get(row.question_id);
    if (!interactionType) {
      unansweredCount += 1;
      continue;
    }

    let isCorrect: boolean;
    switch (interactionType) {
      case "standard":
      case "graphic_based": {
        const correct = correctOptionIdsByQuestion.get(row.question_id) ?? new Set<string>();
        isCorrect = isOptionSelectionCorrect(correct, row.response.selectedOptionIds ?? []);
        break;
      }
      case "matching": {
        const correct = matchingPairsByQuestion.get(row.question_id) ?? new Map<string, string>();
        isCorrect = isMatchingCorrect(correct, row.response.matchingPairs ?? []);
        break;
      }
      case "drag_and_drop": {
        const ordered = (dragDropOrderByQuestion.get(row.question_id) ?? []).sort((a, b) => a.correct_position - b.correct_position);
        isCorrect = isDragDropCorrect(ordered.map((o) => o.item_id), row.response.dragDropOrder ?? []);
        break;
      }
      case "hotspot": {
        const regions = hotspotRegionsByQuestion.get(row.question_id) ?? [];
        isCorrect = row.response.hotspotClick ? regions.some((r) => isHotspotClickCorrect(r, row.response!.hotspotClick!)) : false;
        break;
      }
      default:
        isCorrect = false;
    }

    gradedUpdates.push({ id: row.id, is_correct: isCorrect });
    if (isCorrect) correctCount += 1;
    else incorrectCount += 1;
  }

  await Promise.all(gradedUpdates.map((u) => supabase.from("mock_exam_attempt_questions").update({ is_correct: u.is_correct }).eq("id", u.id)));

  const totalQuestions = attemptQuestions.length;
  const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  const { error: updateError } = await supabase
    .from("mock_exam_attempts")
    .update({
      status: reason === "expired" ? "expired" : "completed",
      completed_at: new Date().toISOString(),
      score,
      correct_count: correctCount,
      incorrect_count: incorrectCount,
      unanswered_count: unansweredCount,
    })
    .eq("id", attemptId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  return { success: true };
}
