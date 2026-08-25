"use server";

/**
 * Mock Exam attempt lifecycle: create (runs the full blueprint engine),
 * read (with server-authoritative break-aware timer + auto-grade on
 * expiry), per-question autosave, break start/end, and submit. Mirrors
 * practiceSessionService.ts's shape exactly - same "app-level check + RLS
 * backstop" pattern, same debounced-autosave-friendly per-field actions.
 */

import { requireUser } from "@/lib/auth/requireRole";
import { getBankQuestions } from "@/features/courses/services/quizService";
import { submitMockExamAttempt } from "@/features/mock-exam/services/examGradingService";
import {
  computeExamRemainingSeconds,
  isExamExpired,
  computeBreakRemainingSeconds,
  getEligibleBreak,
  sectionJustCompleted,
} from "@/features/mock-exam/services/examTimerUtils";
import { fetchApprovedQuestionInventory, fetchSeenQuestionIds } from "@/features/mock-exam/services/examInventoryService";
import {
  buildTargetCells,
  resolveCellsAgainstInventory,
  resolveInteractionTypeCounts,
  resolveAnswerTypeCounts,
  selectQuestionsForDraws,
  sectionForSequenceIndex,
  cellKey,
} from "@/features/mock-exam/services/blueprintEngine";
import { getActiveBlueprint, getBlueprintByVersion, type PmpInteractionType, type PmpAnswerType } from "@/features/mock-exam/config/examBlueprint";
import type { CreateMockExamAttemptResult, MockExamAttempt, MockExamAttemptQuestionState, MockExamRunnerData } from "@/features/mock-exam/types/mockExam";
import type { QuizSubmitAnswer } from "@/features/courses/types/course";
import type { SupabaseClient } from "@supabase/supabase-js";

async function getCertificationId(supabase: SupabaseClient, code: string): Promise<string | null> {
  const { data } = await supabase.from("certifications").select("id").eq("code", code).maybeSingle();
  return (data as { id: string } | null)?.id ?? null;
}

/** For the start page - lets a student resume an in-progress attempt instead of accidentally starting a second one. */
export async function findActiveMockExamAttemptId(): Promise<string | null> {
  const { supabase, user } = await requireUser();
  const { data } = await supabase
    .from("mock_exam_attempts")
    .select("id")
    .eq("user_id", user.id)
    .in("status", ["active", "on_break"])
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as { id: string } | null)?.id ?? null;
}

/**
 * Runs the full blueprint engine end to end and persists the result via
 * create_mock_exam_attempt. This is the only place a Mock Exam's 180
 * questions are ever chosen - once persisted, mock_exam_attempt_questions
 * is fixed (item 7 - refreshing never re-selects).
 */
export async function createMockExamAttempt(): Promise<CreateMockExamAttemptResult> {
  const { supabase, user } = await requireUser();

  const certificationId = await getCertificationId(supabase, "PMP");
  if (!certificationId) {
    return { success: false, error: "Certification not found" };
  }

  const blueprint = getActiveBlueprint();

  const [{ rows: inventoryRows, excludedIncompleteCount }, seenQuestionIds] = await Promise.all([
    fetchApprovedQuestionInventory(supabase, certificationId),
    fetchSeenQuestionIds(supabase, user.id),
  ]);

  if (inventoryRows.length < blueprint.totalQuestions) {
    return {
      success: false,
      error: `Not enough approved questions to build a ${blueprint.totalQuestions}-question exam (only ${inventoryRows.length} available).`,
    };
  }

  // --- Domain x Approach x Difficulty allocation + fallback resolution ---
  const targetCells = buildTargetCells(blueprint.totalQuestions, blueprint);
  const cellCounts: Record<string, number> = {};
  for (const row of inventoryRows) {
    const key = cellKey(row.domain, row.approach, row.difficulty);
    cellCounts[key] = (cellCounts[key] ?? 0) + 1;
  }
  const { draws, fallbackLog, totalShortfall } = resolveCellsAgainstInventory(targetCells, cellCounts);

  // --- interaction_type / answer_type exam-wide targets (lowest priority, best-effort) ---
  const interactionTypeInventory: Record<PmpInteractionType, number> = { standard: 0, graphic_based: 0, drag_and_drop: 0, hotspot: 0, matching: 0 };
  const answerTypeInventory: Record<PmpAnswerType, number> = { single: 0, multiple_response: 0 };
  for (const row of inventoryRows) {
    interactionTypeInventory[row.interactionType] += 1;
    answerTypeInventory[row.answerType] += 1;
  }
  const { resolved: interactionTypeBudget, fallbackLog: interactionFallbackLog } = resolveInteractionTypeCounts(
    blueprint.totalQuestions,
    blueprint,
    interactionTypeInventory
  );
  const { fallbackLog: answerTypeFallbackLog } = resolveAnswerTypeCounts(blueprint.totalQuestions, blueprint, answerTypeInventory);

  // --- Concrete question selection ---
  let selected = selectQuestionsForDraws(inventoryRows, draws, interactionTypeBudget, seenQuestionIds);

  // Priority #1 (total count) is non-negotiable - if the cell-level fallback
  // hierarchy still came up short (extremely unlikely at this bank's size,
  // but handled generically rather than assumed impossible), top up from
  // ANY remaining approved question of any domain/approach/difficulty
  // before ever returning fewer than requested.
  let topUpCount = 0;
  if (totalShortfall > 0 || selected.length < blueprint.totalQuestions) {
    const stillNeeded = blueprint.totalQuestions - selected.length;
    const alreadyUsed = new Set(selected.map((s) => s.questionId));
    const leftover = inventoryRows.filter((r) => !alreadyUsed.has(r.questionId));
    const topUp = leftover.slice(0, stillNeeded);
    topUpCount = topUp.length;
    selected = selected.concat(
      topUp.map((r) => ({ questionId: r.questionId, interactionType: r.interactionType, answerType: r.answerType, domain: r.domain, approach: r.approach, difficulty: r.difficulty }))
    );
  }

  if (selected.length < blueprint.totalQuestions) {
    return {
      success: false,
      error: `Could only assemble ${selected.length}/${blueprint.totalQuestions} questions even after every fallback - the approved bank is too small right now.`,
    };
  }

  // Presentation order is randomized (PMI's real exam does not group
  // questions by domain/approach) - composition (which 180 got picked) is
  // the blueprint's job, order is not.
  const shuffled = [...selected].sort(() => Math.random() - 0.5);
  const questionIds = shuffled.map((q) => q.questionId);
  const sectionNumbers = shuffled.map((_, i) => sectionForSequenceIndex(i, blueprint));

  const blueprintSnapshot = {
    blueprintVersion: blueprint.version,
    totalQuestions: blueprint.totalQuestions,
    targetCells,
    resolvedCellCounts: draws,
    fallbackLog,
    interactionTypeBudget,
    interactionFallbackLog,
    answerTypeFallbackLog,
    excludedIncompleteInventoryCount: excludedIncompleteCount,
    topUpCount,
  };

  const { data, error } = await supabase.rpc("create_mock_exam_attempt", {
    p_certification_id: certificationId,
    p_blueprint_version: blueprint.version,
    p_blueprint_snapshot: blueprintSnapshot,
    p_question_ids: questionIds,
    p_section_numbers: sectionNumbers,
    p_duration_seconds: blueprint.durationSeconds,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  const result = data as { success: boolean; attempt_id?: string; error?: string };
  if (!result?.success) {
    return { success: false, error: result?.error ?? "Failed to create Mock Exam attempt" };
  }

  return { success: true, attemptId: result.attempt_id };
}

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

const ATTEMPT_COLUMNS =
  "id, status, blueprint_version, total_questions, current_question_index, duration_seconds, on_break, break_started_at, current_section, breaks_taken, sections_locked, score, correct_count, incorrect_count, unanswered_count, started_at, completed_at";

async function getAttemptQuestionsAndStates(
  supabase: SupabaseClient,
  attemptId: string
): Promise<{ questions: MockExamRunnerData["questions"]; states: MockExamAttemptQuestionState[] }> {
  const { data } = await supabase
    .from("mock_exam_attempt_questions")
    .select("question_id, sequence_number, section_number, response, is_correct, is_flagged, answered_at, time_spent_seconds")
    .eq("attempt_id", attemptId)
    .order("sequence_number", { ascending: true });

  type Row = {
    question_id: string | null;
    sequence_number: number;
    section_number: number;
    response: QuizSubmitAnswer | null;
    is_correct: boolean | null;
    is_flagged: boolean;
    answered_at: string | null;
    time_spent_seconds: number;
  };
  const rows = (data ?? []) as Row[];

  const bankLinks = rows
    .filter((r): r is Row & { question_id: string } => r.question_id !== null)
    .map((r) => ({ question_id: r.question_id, order_index: r.sequence_number }));

  const bankQuestions = bankLinks.length ? await getBankQuestions(supabase, bankLinks) : [];
  const questionById = new Map(bankQuestions.map((q) => [q.id, q]));

  const questions = rows.map((r) => (r.question_id ? questionById.get(r.question_id) ?? null : null));

  const states: MockExamAttemptQuestionState[] = rows.map((r) => ({
    questionId: r.question_id,
    sequenceNumber: r.sequence_number,
    sectionNumber: r.section_number,
    response: r.response,
    isCorrect: r.is_correct,
    isFlagged: r.is_flagged,
    answeredAt: r.answered_at,
    timeSpentSeconds: r.time_spent_seconds,
  }));

  return { questions, states };
}

/**
 * Reads an attempt for the runner, computing remaining time fresh
 * server-side (break-aware - see examTimerUtils.ts) and auto-grading on
 * genuine expiry, mirroring getPracticeSession exactly.
 */
export async function getMockExamAttempt(attemptId: string): Promise<MockExamRunnerData | null> {
  const { supabase, user } = await requireUser();

  const { data } = await supabase.from("mock_exam_attempts").select(ATTEMPT_COLUMNS).eq("id", attemptId).eq("user_id", user.id).maybeSingle();
  if (!data) return null;
  let attempt = mapAttemptRow(data as AttemptRow);

  const blueprint = getBlueprintByVersion(attempt.blueprintVersion) ?? getActiveBlueprint();

  let serverRemainingSeconds: number | null = null;
  let serverBreakRemainingSeconds: number | null = null;

  if (attempt.status === "active" || attempt.status === "on_break") {
    serverRemainingSeconds = computeExamRemainingSeconds(
      attempt.startedAt,
      attempt.durationSeconds,
      attempt.breaksTaken,
      attempt.onBreak,
      attempt.breakStartedAt,
      blueprint
    );

    if (attempt.onBreak && attempt.breakStartedAt) {
      const currentBreakNumber = attempt.breaksTaken[attempt.breaksTaken.length - 1];
      serverBreakRemainingSeconds = computeBreakRemainingSeconds(attempt.breakStartedAt, currentBreakNumber, blueprint);
    }

    if (serverRemainingSeconds <= 0) {
      await submitMockExamAttempt(supabase, attemptId, user.id, "expired");
      const { data: refreshed } = await supabase.from("mock_exam_attempts").select(ATTEMPT_COLUMNS).eq("id", attemptId).single();
      if (refreshed) attempt = mapAttemptRow(refreshed as AttemptRow);
      serverRemainingSeconds = 0;
      serverBreakRemainingSeconds = null;
    }
  }

  const { questions, states } = await getAttemptQuestionsAndStates(supabase, attemptId);

  return { attempt, questions, questionStates: states, serverRemainingSeconds, serverBreakRemainingSeconds };
}

/**
 * Saves the student's in-progress response only - never grades. Blocked
 * while on_break, and blocked for any question belonging to a section
 * already in sections_locked (item 11's section-review restriction) - the
 * navigator hides the option client-side, but this is the server-side
 * backstop, since a client can always be bypassed.
 */
export async function saveExamAnswer(attemptId: string, questionId: string, response: QuizSubmitAnswer): Promise<{ success: boolean }> {
  const { supabase, user } = await requireUser();

  const { data: owned } = await supabase.from("mock_exam_attempts").select("id, status, sections_locked").eq("id", attemptId).eq("user_id", user.id).maybeSingle();
  if (!owned) return { success: false };
  const attemptRow = owned as { status: string; sections_locked: number[] };
  if (attemptRow.status !== "active") return { success: false };

  if (attemptRow.sections_locked.length > 0) {
    const { data: q } = await supabase
      .from("mock_exam_attempt_questions")
      .select("section_number")
      .eq("attempt_id", attemptId)
      .eq("question_id", questionId)
      .maybeSingle();
    if (q && attemptRow.sections_locked.includes((q as { section_number: number }).section_number)) {
      return { success: false };
    }
  }

  const { error } = await supabase
    .from("mock_exam_attempt_questions")
    .update({ response, answered_at: new Date().toISOString() })
    .eq("attempt_id", attemptId)
    .eq("question_id", questionId);

  return { success: !error };
}

export async function recordExamTimeSpent(attemptId: string, questionId: string, deltaSeconds: number): Promise<{ success: boolean }> {
  if (deltaSeconds <= 0) return { success: true };
  const { supabase, user } = await requireUser();

  const { data: owned } = await supabase.from("mock_exam_attempts").select("id, status").eq("id", attemptId).eq("user_id", user.id).maybeSingle();
  if (!owned || (owned as { status: string }).status !== "active") return { success: false };

  const { data: existing } = await supabase
    .from("mock_exam_attempt_questions")
    .select("time_spent_seconds")
    .eq("attempt_id", attemptId)
    .eq("question_id", questionId)
    .maybeSingle();
  if (!existing) return { success: false };

  const priorSeconds = (existing as { time_spent_seconds: number }).time_spent_seconds;
  const { error } = await supabase
    .from("mock_exam_attempt_questions")
    .update({ time_spent_seconds: priorSeconds + Math.round(deltaSeconds) })
    .eq("attempt_id", attemptId)
    .eq("question_id", questionId);

  return { success: !error };
}

export async function saveExamCurrentIndex(attemptId: string, index: number): Promise<{ success: boolean }> {
  const { supabase, user } = await requireUser();

  const { error } = await supabase
    .from("mock_exam_attempts")
    .update({ current_question_index: Math.max(0, index) })
    .eq("id", attemptId)
    .eq("user_id", user.id)
    .eq("status", "active");

  return { success: !error };
}

export async function toggleExamFlag(attemptId: string, questionId: string, isFlagged: boolean): Promise<{ success: boolean }> {
  const { supabase, user } = await requireUser();

  const { data: owned } = await supabase.from("mock_exam_attempts").select("id").eq("id", attemptId).eq("user_id", user.id).maybeSingle();
  if (!owned) return { success: false };

  const { error } = await supabase
    .from("mock_exam_attempt_questions")
    .update({ is_flagged: isFlagged })
    .eq("attempt_id", attemptId)
    .eq("question_id", questionId);

  return { success: !error };
}

/**
 * Starts the next eligible break (item 11): locks the just-completed
 * section from further review immediately, matching "once a candidate
 * completes a section and starts a break, enforce the intended
 * section-review restrictions" - the lock happens at break START, not end.
 */
export async function startExamBreak(attemptId: string): Promise<{ success: boolean; error?: string }> {
  const { supabase, user } = await requireUser();

  const { data } = await supabase
    .from("mock_exam_attempts")
    .select("id, status, blueprint_version, current_question_index, breaks_taken, sections_locked")
    .eq("id", attemptId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!data) return { success: false, error: "Attempt not found" };

  const row = data as { status: string; blueprint_version: string; current_question_index: number; breaks_taken: number[]; sections_locked: number[] };
  if (row.status !== "active") return { success: false, error: "Attempt is not active" };

  const blueprint = getBlueprintByVersion(row.blueprint_version) ?? getActiveBlueprint();
  const eligibility = getEligibleBreak(row.current_question_index, row.breaks_taken, blueprint);
  if (!eligibility.eligible || eligibility.breakNumber === null) {
    return { success: false, error: eligibility.reason ?? "No break currently available" };
  }

  const justCompleted = sectionJustCompleted(row.current_question_index, blueprint);
  const newSectionsLocked = justCompleted !== null && !row.sections_locked.includes(justCompleted) ? [...row.sections_locked, justCompleted] : row.sections_locked;

  const { error } = await supabase
    .from("mock_exam_attempts")
    .update({
      status: "on_break",
      on_break: true,
      break_started_at: new Date().toISOString(),
      breaks_taken: [...row.breaks_taken, eligibility.breakNumber],
      sections_locked: newSectionsLocked,
      current_section: (justCompleted ?? blueprint.sections[0].sectionNumber) + 1,
    })
    .eq("id", attemptId);

  return { success: !error, error: error?.message };
}

/** Ends the current break early - the exam clock's pause was already capped at the break's max duration by computeExamRemainingSeconds regardless of when this is called, so there is no way to "cheat" by delaying this call. */
export async function endExamBreak(attemptId: string): Promise<{ success: boolean; error?: string }> {
  const { supabase, user } = await requireUser();

  const { data } = await supabase.from("mock_exam_attempts").select("id, status, on_break").eq("id", attemptId).eq("user_id", user.id).maybeSingle();
  if (!data) return { success: false, error: "Attempt not found" };
  const row = data as { status: string; on_break: boolean };
  if (row.status !== "on_break" || !row.on_break) return { success: false, error: "Attempt is not currently on break" };

  const { error } = await supabase
    .from("mock_exam_attempts")
    .update({ status: "active", on_break: false, break_started_at: null })
    .eq("id", attemptId);

  return { success: !error, error: error?.message };
}

/**
 * Manual submit still re-verifies server-side expiry (break-aware) before
 * trusting "manual" as the reason - identical posture to
 * practiceSessionService.ts's submitSession: the server's clock always
 * decides, never the browser's.
 */
export async function submitMockExam(attemptId: string): Promise<{ success: boolean; error?: string }> {
  const { supabase, user } = await requireUser();

  const { data } = await supabase
    .from("mock_exam_attempts")
    .select("blueprint_version, duration_seconds, started_at, breaks_taken, on_break, break_started_at")
    .eq("id", attemptId)
    .eq("user_id", user.id)
    .maybeSingle();

  let reason: "manual" | "expired" = "manual";
  if (data) {
    const row = data as { blueprint_version: string; duration_seconds: number; started_at: string; breaks_taken: number[]; on_break: boolean; break_started_at: string | null };
    const blueprint = getBlueprintByVersion(row.blueprint_version) ?? getActiveBlueprint();
    if (isExamExpired(row.started_at, row.duration_seconds, row.breaks_taken, row.on_break, row.break_started_at, blueprint)) {
      reason = "expired";
    }
  }

  const result = await submitMockExamAttempt(supabase, attemptId, user.id, reason);
  return { success: result.success, error: result.error };
}
