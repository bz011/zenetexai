/**
 * Pure, unit-testable timer/duration calculations - no Supabase client, no
 * "use server" (a Server Action file may only export async functions).
 * Both getPracticeSession and submitSession call computeRemainingSeconds so
 * there is exactly one definition of "has this timed session run out",
 * used identically whether the trigger is a page load, a manual submit
 * click, or the client-side countdown reaching zero.
 */

import type { PracticeConfig } from "@/features/practice/types/practice";

export function computeRemainingSeconds(startedAtIso: string, durationSeconds: number, now: Date = new Date()): number {
  const elapsedSeconds = Math.floor((now.getTime() - new Date(startedAtIso).getTime()) / 1000);
  return Math.max(0, durationSeconds - elapsedSeconds);
}

export function isSessionExpired(startedAtIso: string, durationSeconds: number, now: Date = new Date()): boolean {
  return computeRemainingSeconds(startedAtIso, durationSeconds, now) <= 0;
}

/** Total session duration from the config's timer choice - flat per-question rate, or a custom total. */
export function resolveDurationSeconds(config: Pick<PracticeConfig, "isTimed" | "questionCount" | "secondsPerQuestion" | "customDurationMinutes">): number | null {
  if (!config.isTimed) return null;
  if (config.customDurationMinutes && config.customDurationMinutes > 0) {
    return Math.round(config.customDurationMinutes * 60);
  }
  const perQuestion = config.secondsPerQuestion ?? 60;
  return perQuestion * config.questionCount;
}
