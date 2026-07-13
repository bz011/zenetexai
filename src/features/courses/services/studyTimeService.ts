"use server";

/**
 * Records real active study time (see useActiveStudyTracker.ts) via the
 * increment_study_time RPC — the one RPC in this project callable directly
 * by a student's own RLS-respecting session, since it only ever affects
 * auth.uid()'s own row (see migration 010's comment on this exception).
 */

import { requireUser } from "@/lib/auth/requireRole";

const MAX_SECONDS_PER_CALL = 120;

export async function recordStudyTime(activeSeconds: number): Promise<{ success: boolean; error?: string }> {
  const { supabase } = await requireUser();

  const seconds = Math.floor(activeSeconds);
  if (!Number.isFinite(seconds) || seconds <= 0 || seconds > MAX_SECONDS_PER_CALL) {
    return { success: false, error: "Invalid duration" };
  }

  const { error } = await supabase.rpc("increment_study_time", { p_seconds: seconds });
  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}
