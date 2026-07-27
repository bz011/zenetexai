/**
 * Results/review reads for a COMPLETED practice session only. The score
 * summary never needs an answer-key table - is_correct is already a graded
 * snapshot on practice_session_questions (same precedent as
 * learning_assessment_attempt_answers.is_correct). The per-question review
 * (which reveals the correct answer/explanation) does need the answer-key
 * tables, so it goes through the service-role client - exactly the same
 * enrichment pattern the Sprint 5 admin review page uses - and ONLY after
 * confirming the session is both owned by the caller and already
 * completed/expired. Nothing here is reachable while a session is still
 * active.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type {
  PracticeResultsSummary,
  PracticeBreakdownEntry,
  PracticeReviewQuestion,
  ReviewFilter,
} from "@/features/practice/types/practice";
import type { QuizSubmitAnswer } from "@/features/courses/types/course";

interface SessionRow {
  id: string;
  status: string;
  question_count: number;
  current_question_index: number;
  is_timed: boolean;
  duration_seconds: number | null;
  score: number | null;
  correct_count: number;
  incorrect_count: number;
  unanswered_count: number;
  started_at: string;
  completed_at: string | null;
  filter_domain: PracticeResultsSummary["session"]["filters"]["domain"];
  filter_approach: PracticeResultsSummary["session"]["filters"]["approach"];
  filter_difficulty: PracticeResultsSummary["session"]["filters"]["difficulty"];
  filter_interaction_type: PracticeResultsSummary["session"]["filters"]["interactionType"];
  filter_answer_type: PracticeResultsSummary["session"]["filters"]["answerType"];
  language_preference: PracticeResultsSummary["session"]["filters"]["language"];
}

async function getOwnedCompletedSession(supabase: SupabaseClient, sessionId: string, userId: string): Promise<SessionRow | null> {
  const { data } = await supabase
    .from("practice_sessions")
    .select(
      "id, status, question_count, current_question_index, is_timed, duration_seconds, score, correct_count, incorrect_count, unanswered_count, started_at, completed_at, filter_domain, filter_approach, filter_difficulty, filter_interaction_type, filter_answer_type, language_preference"
    )
    .eq("id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) return null;
  const row = data as SessionRow;
  if (row.status !== "completed" && row.status !== "expired") return null;
  return row;
}

function addToBreakdown(map: Map<string, PracticeBreakdownEntry>, label: string | null, isCorrect: boolean | null): void {
  const key = label ?? "Unspecified";
  const entry = map.get(key) ?? { label: key, total: 0, correct: 0 };
  entry.total += 1;
  if (isCorrect) entry.correct += 1;
  map.set(key, entry);
}

export async function getPracticeResultsSummary(
  supabase: SupabaseClient,
  sessionId: string,
  userId: string
): Promise<PracticeResultsSummary | null> {
  const session = await getOwnedCompletedSession(supabase, sessionId, userId);
  if (!session) return null;

  const { data: rows } = await supabase
    .from("practice_session_questions")
    .select("question_id, is_correct, is_flagged, time_spent_seconds")
    .eq("session_id", sessionId);

  type Row = { question_id: string | null; is_correct: boolean | null; is_flagged: boolean; time_spent_seconds: number };
  const questionRows = (rows ?? []) as Row[];

  const questionIds = questionRows.filter((r) => r.question_id).map((r) => r.question_id as string);
  const { data: meta } = questionIds.length
    ? await supabase.from("questions").select("question_id, domain, approach, difficulty, interaction_type").in("question_id", questionIds)
    : { data: [] as { question_id: string; domain: string | null; approach: string | null; difficulty: string | null; interaction_type: string }[] };

  const metaByQuestionId = new Map(
    ((meta ?? []) as { question_id: string; domain: string | null; approach: string | null; difficulty: string | null; interaction_type: string }[]).map(
      (m) => [m.question_id, m]
    )
  );

  const byDomain = new Map<string, PracticeBreakdownEntry>();
  const byApproach = new Map<string, PracticeBreakdownEntry>();
  const byDifficulty = new Map<string, PracticeBreakdownEntry>();
  const byQuestionType = new Map<string, PracticeBreakdownEntry>();

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
  }

  const totalQuestions = questionRows.length;

  return {
    session: {
      id: session.id,
      status: session.status as PracticeResultsSummary["session"]["status"],
      filters: {
        domain: session.filter_domain,
        approach: session.filter_approach,
        difficulty: session.filter_difficulty,
        interactionType: session.filter_interaction_type,
        answerType: session.filter_answer_type,
        language: session.language_preference,
      },
      questionCount: session.question_count,
      currentQuestionIndex: session.current_question_index,
      isTimed: session.is_timed,
      durationSeconds: session.duration_seconds,
      score: session.score,
      correctCount: session.correct_count,
      incorrectCount: session.incorrect_count,
      unansweredCount: session.unanswered_count,
      startedAt: session.started_at,
      completedAt: session.completed_at,
    },
    totalTimeSpentSeconds,
    averageTimePerQuestionSeconds: totalQuestions > 0 ? Math.round(totalTimeSpentSeconds / totalQuestions) : 0,
    byDomain: Array.from(byDomain.values()),
    byApproach: Array.from(byApproach.values()),
    byDifficulty: Array.from(byDifficulty.values()),
    byQuestionType: Array.from(byQuestionType.values()),
    flaggedCount,
  };
}

export async function getPracticeReviewQuestions(
  supabase: SupabaseClient,
  sessionId: string,
  userId: string,
  filter: ReviewFilter = "all"
): Promise<PracticeReviewQuestion[]> {
  const session = await getOwnedCompletedSession(supabase, sessionId, userId);
  if (!session) return [];

  const { data: rows } = await supabase
    .from("practice_session_questions")
    .select("question_id, sequence_number, response, is_correct, is_flagged, time_spent_seconds")
    .eq("session_id", sessionId)
    .order("sequence_number", { ascending: true });

  type Row = {
    question_id: string | null;
    sequence_number: number;
    response: QuizSubmitAnswer | null;
    is_correct: boolean | null;
    is_flagged: boolean;
    time_spent_seconds: number;
  };
  let sessionRows = (rows ?? []) as Row[];

  if (filter === "incorrect") sessionRows = sessionRows.filter((r) => r.is_correct === false);
  else if (filter === "correct") sessionRows = sessionRows.filter((r) => r.is_correct === true);
  else if (filter === "unanswered") sessionRows = sessionRows.filter((r) => r.response === null);
  else if (filter === "flagged") sessionRows = sessionRows.filter((r) => r.is_flagged);

  const questionIds = sessionRows.filter((r) => r.question_id).map((r) => r.question_id as string);
  if (questionIds.length === 0) return [];

  // Everything below is admin-review-page-equivalent enrichment (Sprint 5
  // precedent), gated entirely on the completed-session check above -
  // never reachable for an active session.
  const [{ data: questions }, { data: options }, { data: matchingItems }, { data: dragDropItems }, { data: images }] = await Promise.all([
    supabase
      .from("questions")
      .select("question_id, question_text_en, question_text_ar, interaction_type, answer_type, domain, approach, difficulty, source, explanation_en, explanation_ar")
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
    source: string | null;
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
  const { data: answerKeyRows } = optionIds.length
    ? await supabaseAdmin.from("question_answer_key").select("option_id, is_correct").in("option_id", optionIds)
    : { data: [] as { option_id: string; is_correct: boolean }[] };
  const correctByOptionId = new Map(((answerKeyRows ?? []) as { option_id: string; is_correct: boolean }[]).map((a) => [a.option_id, a.is_correct]));

  const matchingItemIds = matchingRows.map((m) => m.id);
  const { data: matchingPairRows } = matchingItemIds.length
    ? await supabaseAdmin.from("matching_answer_key").select("left_item_id, right_item_id").in("left_item_id", matchingItemIds)
    : { data: [] as { left_item_id: string; right_item_id: string }[] };
  const correctRightIdByLeft = new Map(((matchingPairRows ?? []) as { left_item_id: string; right_item_id: string }[]).map((p) => [p.left_item_id, p.right_item_id]));

  const dragDropItemIds = dragDropRows.map((d) => d.id);
  const { data: positionRows } = dragDropItemIds.length
    ? await supabaseAdmin.from("drag_and_drop_answer_key").select("item_id, correct_position").in("item_id", dragDropItemIds)
    : { data: [] as { item_id: string; correct_position: number }[] };
  const positionByItemId = new Map(((positionRows ?? []) as { item_id: string; correct_position: number }[]).map((p) => [p.item_id, p.correct_position]));

  return sessionRows
    .filter((r) => r.question_id && questionMetaById.has(r.question_id))
    .map((r) => {
      const q = questionMetaById.get(r.question_id as string) as QuestionMeta;
      return {
        questionId: r.question_id,
        sequenceNumber: r.sequence_number,
        questionTextEn: q.question_text_en,
        questionTextAr: q.question_text_ar,
        interactionType: q.interaction_type as PracticeReviewQuestion["interactionType"],
        answerType: q.answer_type as PracticeReviewQuestion["answerType"],
        domain: q.domain,
        approach: q.approach,
        difficulty: q.difficulty,
        source: q.source,
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
