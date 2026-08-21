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

/** Looks up an existing active pattern for a slice - shared by findOrCreatePattern and the proactive pattern library builder so both agree on what "already covered" means. */
export async function findExistingPattern(certificationId: string, slice: GenerationTargetSlice): Promise<PatternRow | null> {
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
  return (existing as PatternRow | null) ?? null;
}

/** Fetches up to `limit` approved source questions matching a slice - shared by findOrCreatePattern and the proactive pattern library builder. */
export async function fetchSourceQuestionsForSlice(
  certificationId: string,
  slice: GenerationTargetSlice,
  limit = 3
): Promise<{ question_id: string; question_text_en: string; eco_version: string | null }[]> {
  let sourceQuery = supabaseAdmin
    .from("questions")
    .select("question_id, question_text_en, eco_version")
    .eq("certification_id", certificationId)
    .eq("interaction_type", slice.interactionType)
    .eq("answer_type", slice.answerType)
    .eq("status", "approved")
    .limit(limit);

  if (slice.domain) sourceQuery = sourceQuery.eq("domain", slice.domain);
  if (slice.approach) sourceQuery = sourceQuery.eq("approach", slice.approach);
  if (slice.difficulty) sourceQuery = sourceQuery.eq("difficulty", slice.difficulty);

  const { data } = await sourceQuery;
  return (data ?? []) as { question_id: string; question_text_en: string; eco_version: string | null }[];
}

/** Runs pattern extraction against a fixed set of source questions and persists the result - shared by findOrCreatePattern and the proactive pattern library builder. */
export async function extractAndInsertPattern(
  certificationId: string,
  slice: GenerationTargetSlice,
  sourceQuestions: { question_id: string; question_text_en: string; eco_version: string | null }[],
  createdBy: string
): Promise<{ pattern: PatternRow; promptTokens: number; completionTokens: number }> {
  if (sourceQuestions.length === 0) {
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

  // Inherited from the source questions actually used, not hardcoded - if
  // this certification ever has questions spanning more than one ECO
  // version, the pattern correctly reflects the version its own sources
  // came from rather than guessing a single global value. Previously this
  // was never set at all (bug: every pattern got eco_version = NULL, which
  // draftAdapter.ts then defaulted to "" - an empty string ALWAYS fails the
  // question-bank validator's MISSING_REQUIRED_METADATA check, so every
  // generated question was guaranteed to hard-fail quality scoring
  // regardless of content quality. Confirmed empirically via a controlled
  // test batch after fixing the other pipeline bugs.
  const ecoVersion = sourceQuestions.find((q) => q.eco_version)?.eco_version ?? null;

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from("question_patterns")
    .insert({
      certification_id: certificationId,
      eco_version: ecoVersion,
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
    promptTokens: result.usage.promptTokens,
    completionTokens: result.usage.completionTokens,
  };
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
  const existing = await findExistingPattern(certificationId, slice);
  if (existing) {
    return { pattern: existing, wasCreated: false, promptTokens: 0, completionTokens: 0 };
  }

  const sourceQuestions = await fetchSourceQuestionsForSlice(certificationId, slice, 3);
  const { pattern, promptTokens, completionTokens } = await extractAndInsertPattern(certificationId, slice, sourceQuestions, createdBy);

  return { pattern, wasCreated: true, promptTokens, completionTokens };
}

export async function incrementPatternUsage(patternId: string): Promise<void> {
  try {
    await supabaseAdmin.rpc("increment_pattern_usage", { p_pattern_id: patternId });
  } catch {
    // Best-effort statistic - never fail generation over a counter update.
  }
}
