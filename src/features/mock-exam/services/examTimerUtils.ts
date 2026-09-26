/**
 * Pure, unit-testable server-authoritative timer/break calculations for the
 * Mock Exam - no Supabase client, no "use server" (same reasoning as
 * practiceTimerUtils.ts: a Server Action file may only export async
 * functions). examAttemptService.ts calls these on every read/write, so
 * there is exactly one definition of "how much exam time is left" used
 * identically whether the trigger is a page load, an autosave call, or the
 * client-side countdown reaching zero.
 *
 * BREAK POLICY (ZentexAI choice, not independently PMI-verified - see
 * examBlueprint.ts's header comment for the break count/position/duration
 * sourcing, which IS PMI-published): the exam clock PAUSES for the actual
 * duration of a break, capped at that break's allotted duration - ending a
 * break early gives the unused time back to the exam clock; overstaying a
 * break automatically resumes the exam clock once the cap is hit (the
 * candidate is not "saved" by lingering on a break). This mirrors how a
 * proctored CBT environment's room-level clock behaves: nothing is paused
 * indefinitely just because the candidate hasn't clicked a button.
 */

import type { ExamBlueprint } from "@/features/mock-exam/config/examBlueprint";

function breakDurationByNumber(breakNumber: number, blueprint: ExamBlueprint): number {
  return blueprint.breaks[breakNumber - 1]?.durationSeconds ?? 0;
}

/**
 * Remaining EXAM time (not break time) - see this file's header comment for
 * exactly how break pauses are excluded from the elapsed-time calculation.
 */
export function computeExamRemainingSeconds(
  startedAtIso: string,
  durationSeconds: number,
  breaksTaken: number[],
  onBreak: boolean,
  breakStartedAtIso: string | null,
  blueprint: ExamBlueprint,
  now: Date = new Date()
): number {
  const elapsedWallClock = Math.max(0, Math.floor((now.getTime() - new Date(startedAtIso).getTime()) / 1000));

  const currentBreakNumber = onBreak && breaksTaken.length > 0 ? breaksTaken[breaksTaken.length - 1] : null;
  const completedBreaksSeconds = breaksTaken
    .filter((n) => n !== currentBreakNumber)
    .reduce((sum, n) => sum + breakDurationByNumber(n, blueprint), 0);

  let activeBreakElapsed = 0;
  if (onBreak && breakStartedAtIso && currentBreakNumber !== null) {
    const rawElapsed = Math.max(0, Math.floor((now.getTime() - new Date(breakStartedAtIso).getTime()) / 1000));
    activeBreakElapsed = Math.min(rawElapsed, breakDurationByNumber(currentBreakNumber, blueprint));
  }

  const examElapsed = Math.max(0, elapsedWallClock - completedBreaksSeconds - activeBreakElapsed);
  return Math.max(0, durationSeconds - examElapsed);
}

export function isExamExpired(
  startedAtIso: string,
  durationSeconds: number,
  breaksTaken: number[],
  onBreak: boolean,
  breakStartedAtIso: string | null,
  blueprint: ExamBlueprint,
  now: Date = new Date()
): boolean {
  return computeExamRemainingSeconds(startedAtIso, durationSeconds, breaksTaken, onBreak, breakStartedAtIso, blueprint, now) <= 0;
}

/** Seconds left in the CURRENTLY ACTIVE break - 0 once the break's cap has been exceeded (the exam clock has already resumed by then, per this file's header policy). */
export function computeBreakRemainingSeconds(breakStartedAtIso: string, breakNumber: number, blueprint: ExamBlueprint, now: Date = new Date()): number {
  const elapsed = Math.max(0, Math.floor((now.getTime() - new Date(breakStartedAtIso).getTime()) / 1000));
  return Math.max(0, breakDurationByNumber(breakNumber, blueprint) - elapsed);
}

export interface BreakEligibility {
  eligible: boolean;
  breakNumber: number | null;
  reason?: string;
}

/**
 * Which break (if any) the candidate is currently eligible to start, given
 * their position in the exam. Breaks must be taken in blueprint order (this
 * falls out naturally from the position check - you can't reach break 2's
 * position without having already passed break 1's) and never twice.
 */
export function getEligibleBreak(currentQuestionIndex: number, breaksTaken: number[], blueprint: ExamBlueprint): BreakEligibility {
  for (let i = 0; i < blueprint.breaks.length; i++) {
    const breakNumber = i + 1;
    if (breaksTaken.includes(breakNumber)) continue;
    const questionsCompleted = currentQuestionIndex; // 0-indexed current position == number of questions already passed
    if (questionsCompleted >= blueprint.breaks[i].afterQuestion) {
      return { eligible: true, breakNumber };
    }
    return { eligible: false, breakNumber: null, reason: `Break ${breakNumber} unlocks after question ${blueprint.breaks[i].afterQuestion}` };
  }
  return { eligible: false, breakNumber: null, reason: "All breaks already taken" };
}

/** The section that was just completed when a break starts at this question index - the one that gets locked from further review, per item 11's "section-review restrictions". */
export function sectionJustCompleted(currentQuestionIndex: number, blueprint: ExamBlueprint): number | null {
  let cumulative = 0;
  for (const section of blueprint.sections) {
    cumulative += section.questionCount;
    if (currentQuestionIndex === cumulative) return section.sectionNumber;
  }
  return null;
}
