import { supabaseAdmin } from "../question-bank/supabaseAdminClient";
import { getLLMProvider } from "./llm";
import { buildPatternExtractionPrompt } from "./prompts/patternExtraction_v1";
import type { PatternRow, GenerationTargetSlice } from "./types";

interface FindOrCreatePatternResult {
  pattern: PatternRow;
  wasCreated: boolean;
  promptTokens: number;
  completionTokens: number;
}

/**
 * Reuses an existing active pattern matching this target slice if one
 * exists (amortizing extraction cost across every question generated from
 * it). Otherwise selects 1-3 approved source questions matching the slice
 * and runs pattern extraction to create a new one.
 */
export async function findOrCreatePattern(
  certificationId: string,
  slice: GenerationTargetSlice,
  createdBy: string
): Promise<FindOrCreatePatternResult> {
  let query = supabaseAdmin
    .from("question_patterns")
    .select("*")
    .eq("certification_id", certificationId)
    .eq("interaction_type", slice.interactionType)
    .eq("answer_type", slice.answerType)
    .eq("status", "active");

  if (slice.domain) query = query.eq("domain", slice.domain);
  if (slice.approach) query = query.eq("approach", slice.approach);
  if (slice.difficulty) query = query.eq("difficulty", slice.difficulty);

  const { data: existing } = await query.limit(1).maybeSingle();

  if (existing) {
    return { pattern: existing as PatternRow, wasCreated: false, promptTokens: 0, completionTokens: 0 };
  }

  // No reusable pattern - select source questions matching this slice from
  // the approved bank and extract a new pattern.
  let sourceQuery = supabaseAdmin
    .from("questions")
    .select("question_id, question_text_en")
    .eq("certification_id", certificationId)
    .eq("interaction_type", slice.interactionType)
    .eq("answer_type", slice.answerType)
    .eq("status", "approved")
    .limit(3);

  if (slice.domain) sourceQuery = sourceQuery.eq("domain", slice.domain);
  if (slice.approach) sourceQuery = sourceQuery.eq("approach", slice.approach);
  if (slice.difficulty) sourceQuery = sourceQuery.eq("difficulty", slice.difficulty);

  const { data: sourceData, error: sourceError } = await sourceQuery;
  const sourceQuestions = (sourceData ?? []) as { question_id: string; question_text_en: string }[];

  if (sourceError || sourceQuestions.length === 0) {
    throw new Error(
      `No approved source questions found for slice ${JSON.stringify(slice)} - cannot extract a pattern without at least one example.`
    );
  }

  const provider = getLLMProvider();
  const prompt = buildPatternExtractionPrompt(sourceQuestions.map((q) => q.question_text_en));
  const result = await provider.generateStructured<{
    scenario_structure: string;
    tested_decision: string;
    correct_answer_principle: string;
    distractor_strategies: string[];
    common_misconception: string | null;
    required_pmi_mindset: string | null;
    generation_guidance: string | null;
  }>({ ...prompt, model: provider.defaultModel });

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from("question_patterns")
    .insert({
      certification_id: certificationId,
      domain: slice.domain ?? null,
      task: slice.task ?? null,
      topic: slice.topic ?? null,
      subtopic: slice.subtopic ?? null,
      approach: slice.approach ?? null,
      difficulty: slice.difficulty ?? null,
      interaction_type: slice.interactionType,
      answer_type: slice.answerType,
      scenario_structure: result.data.scenario_structure,
      tested_decision: result.data.tested_decision,
      correct_answer_principle: result.data.correct_answer_principle,
      distractor_strategies: result.data.distractor_strategies,
      common_misconception: result.data.common_misconception,
      required_pmi_mindset: result.data.required_pmi_mindset,
      generation_guidance: result.data.generation_guidance,
      source_question_ids: sourceQuestions.map((q) => q.question_id),
      created_by: createdBy,
    })
    .select("*")
    .single();

  if (insertError || !inserted) {
    throw new Error(`Failed to persist extracted pattern: ${insertError?.message ?? "unknown error"}`);
  }

  return {
    pattern: inserted as PatternRow,
    wasCreated: true,
    promptTokens: result.usage.promptTokens,
    completionTokens: result.usage.completionTokens,
  };
}

export async function incrementPatternUsage(patternId: string): Promise<void> {
  try {
    await supabaseAdmin.rpc("increment_pattern_usage", { p_pattern_id: patternId });
  } catch {
    // Best-effort statistic - never fail generation over a counter update.
  }
}
