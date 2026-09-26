/**
 * Results/review reads for a COMPLETED (or expired) Mock Exam attempt only -
 * same posture as practiceResultsService.ts: the score summary reads
 * already-graded is_correct snapshots, the per-question review additionally
 * reveals the answer key via supabaseAdmin, and NONE of this is reachable
 * while an attempt is still active/on_break (getOwnedTerminalAttempt is the
 * single gate every function here goes through first).
 *
 * Adds a byTopic breakdown on top of practiceResultsService.ts's shape
 * (item 14 - results dashboard breakdowns), using the questions table's
 * plain `topic` TEXT column.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { MockExamResultsSummary, MockExamBreakdownEntry, MockExamAttempt, MockExamRetakeComparison } from "@/features/mock-exam/types/mockExam";
import type { AssessmentReviewListEntry, AssessmentReviewQuestionDetail } from "@/components/assessment/assessmentReviewTypes";

const ATTEMPT_COLUMNS =
  "id, status, blueprint_version, total_questions, current_question_index, duration_seconds, on_break, break_started_at, current_section, breaks_taken, sections_locked, score, correct_count, incorrect_count, unanswered_count, started_at, completed_at, retake_of_attempt_id, root_attempt_id";

interface AttemptRow {
  id: string;
  status: MockExamAttempt["status"];
  blueprint_version: string;
  total_questions: number;
  current_question_index: number;
  duration_seconds: number;
  on_break: boolean;
  break_started_at: string | null;
  current_section: number;
  breaks_taken: number[];
  sections_locked: number[];
  score: number | null;
  correct_count: number;
  incorrect_count: number;
  unanswered_count: number;
  started_at: string;
  completed_at: string | null;
  retake_of_attempt_id: string | null;
  root_attempt_id: string | null;
}

function mapAttemptRow(row: AttemptRow): MockExamAttempt {
  return {
    id: row.id,
    status: row.status,
    blueprintVersion: row.blueprint_version,
    totalQuestions: row.total_questions,
    currentQuestionIndex: row.current_question_index,
    durationSeconds: row.duration_seconds,
    onBreak: row.on_break,
    breakStartedAt: row.break_started_at,
    currentSection: row.current_section,
    breaksTaken: row.breaks_taken,
    sectionsLocked: row.sections_locked,
    score: row.score,
    correctCount: row.correct_count,
    incorrectCount: row.incorrect_count,
    unansweredCount: row.unanswered_count,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    retakeOfAttemptId: row.retake_of_attempt_id,
    rootAttemptId: row.root_attempt_id,
  };
}

async function getOwnedTerminalAttempt(supabase: SupabaseClient, attemptId: string, userId: string): Promise<MockExamAttempt | null> {
  const { data } = await supabase.from("mock_exam_attempts").select(ATTEMPT_COLUMNS).eq("id", attemptId).eq("user_id", userId).maybeSingle();
  if (!data) return null;
  const attempt = mapAttemptRow(data as AttemptRow);
  if (attempt.status !== "completed" && attempt.status !== "expired") return null;
  return attempt;
}

function addToBreakdown(map: Map<string, MockExamBreakdownEntry>, label: string | null, isCorrect: boolean | null): void {
  const key = label ?? "Unspecified";
  const entry = map.get(key) ?? { label: key, total: 0, correct: 0 };
  entry.total += 1;
  if (isCorrect) entry.correct += 1;
  map.set(key, entry);
}

export async function getMockExamResultsSummary(supabase: SupabaseClient, attemptId: string, userId: string): Promise<MockExamResultsSummary | null> {
  const attempt = await getOwnedTerminalAttempt(supabase, attemptId, userId);
  if (!attempt) return null;

  const { data: rows } = await supabase
    .from("mock_exam_attempt_questions")
    .select("question_id, is_correct, is_flagged, time_spent_seconds")
    .eq("attempt_id", attemptId);

  type Row = { question_id: string | null; is_correct: boolean | null; is_flagged: boolean; time_spent_seconds: number };
  const questionRows = (rows ?? []) as Row[];

  const questionIds = questionRows.filter((r) => r.question_id).map((r) => r.question_id as string);
  const { data: meta } = questionIds.length
    ? await supabase.from("questions").select("question_id, domain, approach, difficulty, interaction_type, topic").in("question_id", questionIds)
    : { data: [] as { question_id: string; domain: string | null; approach: string | null; difficulty: string | null; interaction_type: string; topic: string | null }[] };

  const metaByQuestionId = new Map(
    (
      (meta ?? []) as { question_id: string; domain: string | null; approach: string | null; difficulty: string | null; interaction_type: string; topic: string | null }[]
    ).map((m) => [m.question_id, m])
  );

  const byDomain = new Map<string, MockExamBreakdownEntry>();
  const byApproach = new Map<string, MockExamBreakdownEntry>();
  const byDifficulty = new Map<string, MockExamBreakdownEntry>();
  const byQuestionType = new Map<string, MockExamBreakdownEntry>();
  const byTopic = new Map<string, MockExamBreakdownEntry>();

  let totalTimeSpentSeconds = 0;
  let flaggedCount = 0;

  for (const row of questionRows) {
    totalTimeSpentSeconds += row.time_spent_seconds;
    if (row.is_flagged) flaggedCount += 1;

    const m = row.question_id ? metaByQuestionId.get(row.question_id) : undefined;
    addToBreakdown(byDomain, m?.domain ?? null, row.is_correct);
    addToBreakdown(byApproach, m?.approach ?? null, row.is_correct);
    addToBreakdown(byDifficulty, m?.difficulty ?? null, row.is_correct);
    addToBreakdown(byQuestionType, m?.interaction_type ?? null, row.is_correct);
    addToBreakdown(byTopic, m?.topic ?? null, row.is_correct);
  }

  const totalQuestions = questionRows.length;

  return {
    attempt,
    totalTimeSpentSeconds,
    averageTimePerQuestionSeconds: totalQuestions > 0 ? Math.round(totalTimeSpentSeconds / totalQuestions) : 0,
    byDomain: Array.from(byDomain.values()),
    byApproach: Array.from(byApproach.values()),
    byDifficulty: Array.from(byDifficulty.values()),
    byQuestionType: Array.from(byQuestionType.values()),
    byTopic: Array.from(byTopic.values()),
    flaggedCount,
  };
}

/**
 * Cheap review list for the compact grid + filter counts (item 5/9) - no
 * answer-key join at all, is_correct is already a graded snapshot on
 * mock_exam_attempt_questions. Every question, unfiltered; the UI filters
 * this small in-memory array client-side rather than round-tripping per
 * filter change.
 */
export async function getMockExamReviewList(supabase: SupabaseClient, attemptId: string, userId: string): Promise<AssessmentReviewListEntry[]> {
  const attempt = await getOwnedTerminalAttempt(supabase, attemptId, userId);
  if (!attempt) return [];

  const { data: rows } = await supabase
    .from("mock_exam_attempt_questions")
    .select("question_id, sequence_number, response, is_correct, is_flagged")
    .eq("attempt_id", attemptId)
    .order("sequence_number", { ascending: true });

  type Row = { question_id: string | null; sequence_number: number; response: unknown; is_correct: boolean | null; is_flagged: boolean };
  return ((rows ?? []) as Row[]).map((r) => ({
    questionId: r.question_id,
    sequenceNumber: r.sequence_number,
    isCorrect: r.is_correct,
    isFlagged: r.is_flagged,
    hasResponse: r.response !== null,
  }));
}

/**
 * Full answer-key-enriched review for exactly ONE question - fetched
 * on-demand when a student opens the review panel for that question, never
 * eagerly for an entire filtered list (item 9). Gated on the same
 * terminal-attempt + ownership check as every other review read here.
 */
export async function getMockExamReviewQuestionDetail(
  supabase: SupabaseClient,
  attemptId: string,
  userId: string,
  questionId: string
): Promise<AssessmentReviewQuestionDetail | null> {
  const attempt = await getOwnedTerminalAttempt(supabase, attemptId, userId);
  if (!attempt) return null;

  const { data: attemptQuestionRow } = await supabase
    .from("mock_exam_attempt_questions")
    .select("sequence_number, response, is_correct, is_flagged, time_spent_seconds")
    .eq("attempt_id", attemptId)
    .eq("question_id", questionId)
    .maybeSingle();
  if (!attemptQuestionRow) return null;

  const { data: question } = await supabase
    .from("questions")
    .select("question_id, question_text_en, question_text_ar, interaction_type, answer_type, domain, approach, difficulty, explanation_en, explanation_ar, explanation_structured")
    .eq("question_id", questionId)
    .maybeSingle();
  if (!question) return null;

  const [{ data: options }, { data: matchingItems }, { data: dragDropItems }, { data: images }] = await Promise.all([
    supabase.from("question_options").select("id, option_text_en, option_text_ar, feedback_en, feedback_ar, display_order").eq("question_id", questionId).order("display_order"),
    supabase.from("matching_items").select("id, side, text_en, text_ar, display_order").eq("question_id", questionId).order("display_order"),
    supabase.from("drag_and_drop_items").select("id, item_text_en, item_text_ar, category, display_order").eq("question_id", questionId).order("display_order"),
    supabase.from("question_images").select("image_path, image_alt_en, image_alt_ar").eq("question_id", questionId),
  ]);

  const optionRows = (options ?? []) as { id: string; option_text_en: string; option_text_ar: string | null; feedback_en: string | null; feedback_ar: string | null }[];
  const matchingRows = (matchingItems ?? []) as { id: string; side: "left" | "right"; text_en: string; text_ar: string | null }[];
  const dragDropRows = (dragDropItems ?? []) as { id: string; item_text_en: string; item_text_ar: string | null; category: string | null }[];
  const imageRows = (images ?? []) as { image_path: string; image_alt_en: string | null; image_alt_ar: string | null }[];

  const optionIds = optionRows.map((o) => o.id);
  const matchingItemIds = matchingRows.map((m) => m.id);
  const dragDropItemIds = dragDropRows.map((d) => d.id);

  const [{ data: answerKeyRows }, { data: matchingPairRows }, { data: positionRows }] = await Promise.all([
    optionIds.length
      ? supabaseAdmin.from("question_answer_key").select("option_id, is_correct").in("option_id", optionIds)
      : Promise.resolve({ data: [] as { option_id: string; is_correct: boolean }[] }),
    matchingItemIds.length
      ? supabaseAdmin.from("matching_answer_key").select("left_item_id, right_item_id").in("left_item_id", matchingItemIds)
      : Promise.resolve({ data: [] as { left_item_id: string; right_item_id: string }[] }),
    dragDropItemIds.length
      ? supabaseAdmin.from("drag_and_drop_answer_key").select("item_id, correct_position").in("item_id", dragDropItemIds)
      : Promise.resolve({ data: [] as { item_id: string; correct_position: number }[] }),
  ]);

  const correctByOptionId = new Map(((answerKeyRows ?? []) as { option_id: string; is_correct: boolean }[]).map((a) => [a.option_id, a.is_correct]));
  const correctRightIdByLeft = new Map(((matchingPairRows ?? []) as { left_item_id: string; right_item_id: string }[]).map((p) => [p.left_item_id, p.right_item_id]));
  const positionByItemId = new Map(((positionRows ?? []) as { item_id: string; correct_position: number }[]).map((p) => [p.item_id, p.correct_position]));

  type StructuredExplanation = {
    key_concept_en?: string; key_concept_ar?: string;
    exam_tip_en?: string; exam_tip_ar?: string;
    common_trap_en?: string; common_trap_ar?: string;
  } | null;
  const structured = question.explanation_structured as StructuredExplanation;

  const aq = attemptQuestionRow as { sequence_number: number; response: AssessmentReviewQuestionDetail["response"]; is_correct: boolean | null; is_flagged: boolean; time_spent_seconds: number };

  return {
    questionId,
    sequenceNumber: aq.sequence_number,
    questionTextEn: question.question_text_en,
    questionTextAr: question.question_text_ar,
    interactionType: question.interaction_type,
    answerType: question.answer_type,
    domain: question.domain,
    approach: question.approach,
    difficulty: question.difficulty,
    options: optionRows.map((o) => ({
      id: o.id,
      textEn: o.option_text_en,
      textAr: o.option_text_ar,
      isCorrect: correctByOptionId.get(o.id) ?? false,
      feedbackEn: o.feedback_en,
      feedbackAr: o.feedback_ar,
    })),
    matchingLeft: matchingRows.filter((m) => m.side === "left").map((m) => ({ id: m.id, textEn: m.text_en, textAr: m.text_ar })),
    matchingRight: matchingRows.filter((m) => m.side === "right").map((m) => ({ id: m.id, textEn: m.text_en, textAr: m.text_ar })),
    matchingCorrectRightIdByLeft: Object.fromEntries(matchingRows.filter((m) => m.side === "left").map((m) => [m.id, correctRightIdByLeft.get(m.id) ?? ""])),
    dragDropItems: dragDropRows.map((d) => ({ id: d.id, textEn: d.item_text_en, textAr: d.item_text_ar, category: d.category, correctPosition: positionByItemId.get(d.id) ?? null })),
    images: imageRows.map((i) => ({ imagePath: i.image_path, altEn: i.image_alt_en, altAr: i.image_alt_ar })),
    explanationEn: question.explanation_en,
    explanationAr: question.explanation_ar,
    explanationExtras: structured
      ? {
          keyConceptEn: structured.key_concept_en ?? null,
          keyConceptAr: structured.key_concept_ar ?? null,
          examTipEn: structured.exam_tip_en ?? null,
          examTipAr: structured.exam_tip_ar ?? null,
          commonTrapEn: structured.common_trap_en ?? null,
          commonTrapAr: structured.common_trap_ar ?? null,
        }
      : null,
    response: aq.response,
    isCorrect: aq.is_correct,
    isFlagged: aq.is_flagged,
    timeSpentSeconds: aq.time_spent_seconds,
  };
}

/**
 * Simple before/after comparison for a same-exam retake (item 7A) -
 * deliberately just the DIRECT parent attempt (attempt.retakeOfAttemptId),
 * not the whole retake chain or any longitudinal trend, per the spec's
 * "do not overcomplicate this sprint with advanced longitudinal analytics".
 * Returns null when this attempt isn't a retake at all.
 */
export async function getMockExamRetakeComparison(supabase: SupabaseClient, attemptId: string, userId: string): Promise<MockExamRetakeComparison | null> {
  const current = await getMockExamResultsSummary(supabase, attemptId, userId);
  if (!current || !current.attempt.retakeOfAttemptId) return null;

  const previous = await getMockExamResultsSummary(supabase, current.attempt.retakeOfAttemptId, userId);
  if (!previous) return null;

  const previousByDomain = new Map(previous.byDomain.map((d) => [d.label, d]));
  const byDomain = current.byDomain.map((d) => ({
    label: d.label,
    previousCorrect: previousByDomain.get(d.label)?.correct ?? 0,
    currentCorrect: d.correct,
    total: d.total,
  }));

  return {
    previousScore: previous.attempt.score,
    currentScore: current.attempt.score,
    previousCorrectCount: previous.attempt.correctCount,
    currentCorrectCount: current.attempt.correctCount,
    previousTotalTimeSpentSeconds: previous.totalTimeSpentSeconds,
    currentTotalTimeSpentSeconds: current.totalTimeSpentSeconds,
    byDomain,
  };
}
