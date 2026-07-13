"use server";

/**
 * "Regenerate" and "Request repair" - the two review actions that make a
 * synchronous LLM call from within a Server Action rather than going
 * through the CLI batch runner. This is deliberately only safe for a
 * SINGLE question (a few LLM calls, seconds not minutes) - never use this
 * pattern for a multi-question batch, which belongs in generateBatch.ts.
 */

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/requireRole";
import { reviseQuestion } from "@scripts/question-generation/reviseQuestion";
import type { GenerationOutcome } from "@scripts/question-generation/types";

// maxDuration for these actions lives on the page that invokes them
// (review/[questionId]/page.tsx) - a "use server" file may only export
// async functions, so it can't be set here directly.

const MANAGE_ROLES = ["admin", "instructor"] as const;

export async function regenerateQuestion(questionId: string): Promise<GenerationOutcome | { accepted: false; error: string }> {
  await requireRole([...MANAGE_ROLES]);

  try {
    const outcome = await reviseQuestion(questionId, null);
    revalidatePath(`/admin/ai-generation/review/${questionId}`);
    return outcome;
  } catch (err) {
    return { accepted: false, error: (err as Error).message };
  }
}

export async function requestQuestionRepair(
  questionId: string,
  reviewerFeedback: string
): Promise<GenerationOutcome | { accepted: false; error: string }> {
  await requireRole([...MANAGE_ROLES]);

  if (!reviewerFeedback.trim()) {
    return { accepted: false, error: "Feedback is required for a targeted repair." };
  }

  try {
    const outcome = await reviseQuestion(questionId, reviewerFeedback);
    revalidatePath(`/admin/ai-generation/review/${questionId}`);
    return outcome;
  } catch (err) {
    return { accepted: false, error: (err as Error).message };
  }
}
