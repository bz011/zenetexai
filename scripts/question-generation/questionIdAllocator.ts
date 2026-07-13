import { supabaseAdmin } from "../question-bank/supabaseAdminClient";

/**
 * Allocates the next AIQ###### question_id from the Postgres sequence
 * (migration 008's next_ai_question_id()). Never compute this by reading
 * MAX(question_id) in application code - that races under concurrency; a
 * DB sequence is atomic by construction.
 */
export async function allocateQuestionId(): Promise<string> {
  const { data, error } = await supabaseAdmin.rpc("next_ai_question_id");
  if (error || !data) {
    throw new Error(`Failed to allocate AI question_id: ${error?.message ?? "no ID returned"}`);
  }
  return data as string;
}
