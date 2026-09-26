/**
 * Reads that back the practice-configuration page needs before a session
 * is created: which certification to use, and how many approved questions
 * currently match a given filter combination. Both go through RPCs granted
 * directly to `authenticated` (see migration 012) - they only ever surface
 * counts/ids of rows already readable via questions' own RLS policy.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { PracticeFilters } from "@/features/practice/types/practice";

export async function getCertificationId(supabase: SupabaseClient, code = "PMP"): Promise<string | null> {
  const { data } = await supabase.from("certifications").select("id").eq("code", code).maybeSingle();
  return (data as { id: string } | null)?.id ?? null;
}

export async function getEligibleQuestionCount(
  supabase: SupabaseClient,
  certificationId: string,
  filters: PracticeFilters
): Promise<number> {
  const { data, error } = await supabase.rpc("count_eligible_practice_questions", {
    p_certification_id: certificationId,
    p_domain: filters.domain,
    p_approach: filters.approach,
    p_difficulty: filters.difficulty,
    p_interaction_type: filters.interactionType,
    p_answer_type: filters.answerType,
    p_language: filters.language,
  });

  if (error || data === null) return 0;
  return data as number;
}
