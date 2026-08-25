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
import type { MockExamResultsSummary, MockExamBreakdownEntry, MockExamReviewQuestion, MockExamReviewFilter, MockExamAttempt } from "@/features/mock-exam/types/mockExam";
import type { QuizSubmitAnswer } from "@/features/courses/types/course";

const ATTEMPT_COLUMNS =
  "id, status, blueprint_version, total_questions, current_question_index, duration_seconds, on_break, break_started_at, current_section, breaks_taken, sections_locked, score, correct_count, incorrect_count, unanswered_count, started_at, completed_at";

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

export async function getMockExamReviewQuestions(
  supabase: SupabaseClient,
  attemptId: string,
  userId: string,
  filter: MockExamReviewFilter = "all"
): Promise<MockExamReviewQuestion[]> {
  const attempt = await getOwnedTerminalAttempt(supabase, attemptId, userId);
  if (!attempt) return [];

  const { data: rows } = await supabase
    .from("mock_exam_attempt_questions")
    .select("question_id, sequence_number, response, is_correct, is_flagged, time_spent_seconds")
    .eq("attempt_id", attemptId)
    .order("sequence_number", { ascending: true });

  type Row = {
    question_id: string | null;
    sequence_number: number;
    response: QuizSubmitAnswer | null;
    is_correct: boolean | null;
    is_flagged: boolean;
    time_spent_seconds: number;
  };
  let attemptRows = (rows ?? []) as Row[];

  if (filter === "incorrect") attemptRows = attemptRows.filter((r) => r.is_correct === false);
  else if (filter === "correct") attemptRows = attemptRows.filter((r) => r.is_correct === true);
  else if (filter === "unanswered") attemptRows = attemptRows.filter((r) => r.response === null);
  else if (filter === "flagged") attemptRows = attemptRows.filter((r) => r.is_flagged);

  const questionIds = attemptRows.filter((r) => r.question_id).map((r) => r.question_id as string);
  if (questionIds.length === 0) return [];

  // Answer-key-bearing enrichment - gated entirely on the terminal-attempt
  // check above, identical posture to practiceResultsService.ts.
  const [{ data: questions }, { data: options }, { data: matchingItems }, { data: dragDropItems }, { data: images }] = await Promise.all([
    supabase
      .from("questions")
      .select("question_id, question_text_en, question_text_ar, interaction_type, answer_type, domain, approach, difficulty, explanation_en, explanation_ar")
      .in("question_id", questionIds),
    supabase.from("question_options").select("id, question_id, option_text_en, option_text_ar, display_order").in("question_id", questionIds).order("display_order"),
    supabase.from("matching_items").select("id, question_id, side, text_en, text_ar, display_order").in("question_id", questionIds).order("display_order"),
    supabase.from("drag_and_drop_items").select("id, question_id, item_text_en, item_text_ar, category, display_order").in("question_id", questionIds).order("display_order"),
    supabase.from("question_images").select("question_id, image_path, image_alt_en, image_alt_ar").in("question_id", questionIds),
  ]);

  type QuestionMeta = {
    question_id: string;
    question_text_en: string;
    question_text_ar: string | null;
    interaction_type: string;
    answer_type: string;
    domain: string | null;
    approach: string | null;
    difficulty: string | null;
    explanation_en: string | null;
    explanation_ar: string | null;
  };
  type OptionRow = { id: string; question_id: string; option_text_en: string; option_text_ar: string | null };
  type MatchingRow = { id: string; question_id: string; side: "left" | "right"; text_en: string; text_ar: string | null };
  type DragDropRow = { id: string; question_id: string; item_text_en: string; item_text_ar: string | null; category: string | null };
  type ImageRow = { question_id: string; image_path: string; image_alt_en: string | null; image_alt_ar: string | null };

  const questionMetaById = new Map(((questions ?? []) as QuestionMeta[]).map((q) => [q.question_id, q]));
  const optionRows = (options ?? []) as OptionRow[];
  const matchingRows = (matchingItems ?? []) as MatchingRow[];
  const dragDropRows = (dragDropItems ?? []) as DragDropRow[];
  const imageRows = (images ?? []) as ImageRow[];

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

  return attemptRows
    .filter((r) => r.question_id && questionMetaById.has(r.question_id))
    .map((r) => {
      const q = questionMetaById.get(r.question_id as string) as QuestionMeta;
      return {
        questionId: r.question_id,
        sequenceNumber: r.sequence_number,
        questionTextEn: q.question_text_en,
        questionTextAr: q.question_text_ar,
        interactionType: q.interaction_type,
        answerType: q.answer_type,
        domain: q.domain as MockExamReviewQuestion["domain"],
        approach: q.approach as MockExamReviewQuestion["approach"],
        difficulty: q.difficulty as MockExamReviewQuestion["difficulty"],
        options: optionRows
          .filter((o) => o.question_id === r.question_id)
          .map((o) => ({ id: o.id, textEn: o.option_text_en, textAr: o.option_text_ar, isCorrect: correctByOptionId.get(o.id) ?? false })),
        matchingLeft: matchingRows.filter((m) => m.question_id === r.question_id && m.side === "left").map((m) => ({ id: m.id, textEn: m.text_en, textAr: m.text_ar })),
        matchingRight: matchingRows.filter((m) => m.question_id === r.question_id && m.side === "right").map((m) => ({ id: m.id, textEn: m.text_en, textAr: m.text_ar })),
        matchingCorrectRightIdByLeft: Object.fromEntries(
          matchingRows.filter((m) => m.question_id === r.question_id && m.side === "left").map((m) => [m.id, correctRightIdByLeft.get(m.id) ?? ""])
        ),
        dragDropItems: dragDropRows
          .filter((d) => d.question_id === r.question_id)
          .map((d) => ({ id: d.id, textEn: d.item_text_en, textAr: d.item_text_ar, category: d.category, correctPosition: positionByItemId.get(d.id) ?? null })),
        images: imageRows.filter((i) => i.question_id === r.question_id).map((i) => ({ imagePath: i.image_path, altEn: i.image_alt_en, altAr: i.image_alt_ar })),
        explanationEn: q.explanation_en,
        explanationAr: q.explanation_ar,
        response: r.response,
        isCorrect: r.is_correct,
        isFlagged: r.is_flagged,
        timeSpentSeconds: r.time_spent_seconds,
      };
    });
}
