/**
 * Pure, unit-testable progress calculations — no Supabase client, no "use
 * server" (Next.js Server Action files may only export async functions, so
 * plain sync helpers live here instead of in progressService.ts).
 */

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10); // YYYY-MM-DD, UTC — a documented simplification, not full timezone-aware "day"
}

function subtractDay(date: Date): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() - 1);
  return next;
}

/**
 * Consecutive-day study streak, Duolingo-style: studying "yesterday" keeps
 * the streak alive even if today has no activity yet; a single fully-missed
 * day breaks it. `activityTimestamps` are any ISO timestamps representing a
 * study event (lesson completion, quiz attempt) — duplicates and ordering
 * don't matter, this dedupes by calendar day itself.
 */
export function computeStudyStreak(activityTimestamps: string[], now: Date = new Date()): number {
  const activityDays = new Set(activityTimestamps.map((ts) => toDateKey(new Date(ts))));

  let cursor = now;
  if (!activityDays.has(toDateKey(cursor))) {
    cursor = subtractDay(cursor);
  }

  let streak = 0;
  while (activityDays.has(toDateKey(cursor))) {
    streak += 1;
    cursor = subtractDay(cursor);
  }
  return streak;
}

export interface ModuleCompletionInput {
  lessonIds: string[];
  completedLessonIds: Set<string>;
  assessmentId: string | null;
  passedAssessmentIds: Set<string>;
}

/** A module counts complete when every one of its lessons is done AND (it has no
 * module assessment OR the student has passed it). A module with zero lessons
 * is never "complete" (there's nothing to have finished). */
export function isModuleComplete(input: ModuleCompletionInput): boolean {
  const allLessonsDone = input.lessonIds.length > 0 && input.lessonIds.every((id) => input.completedLessonIds.has(id));
  const assessmentOk = !input.assessmentId || input.passedAssessmentIds.has(input.assessmentId);
  return allLessonsDone && assessmentOk;
}
