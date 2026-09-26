import { supabaseAdmin } from "../question-bank/supabaseAdminClient";
import { getLLMProvider } from "./llm";
import { buildPatternExtractionPrompt } from "./prompts/patternExtraction_v1";
import type { PatternRow, GenerationTargetSlice } from "./types";

/** Looks up an existing active pattern for a slice - shared by the proactive pattern library builder (checking "is this combo already covered at all") and fetchActivePatternsForSlice below. */
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

/**
 * ALL active patterns matching a slice (not just the first one) - the
 * building block batch-aware selection needs. Capped at `limit` for query
 * cost, not because more than that would ever meaningfully change which
 * pattern gets picked.
 */
export async function fetchActivePatternsForSlice(certificationId: string, slice: GenerationTargetSlice, limit = 20): Promise<PatternRow[]> {
  let query = supabaseAdmin
    .from("question_patterns")
    .select("*")
    .eq("certification_id", certificationId)
    .eq("interaction_type", slice.interactionType)
    .eq("answer_type", slice.answerType)
    .eq("status", "active")
    .limit(limit);

  if (slice.domain) query = query.eq("domain", slice.domain);
  if (slice.approach) query = query.eq("approach", slice.approach);
  if (slice.difficulty) query = query.eq("difficulty", slice.difficulty);

  const { data } = await query;
  return (data ?? []) as PatternRow[];
}

export interface SourceQuestionCandidate {
  question_id: string;
  question_text_en: string;
  eco_version: string | null;
  topic: string | null;
}

/** Fetches up to `limit` approved source questions matching a slice - shared by extractAndInsertPattern's callers (both the proactive pattern library builder, which wants an exact small set, and selectOrCreatePatternForBatch below, which fetches a wider pool to then diversify client-side - see pickDiverseSourceQuestions). */
export async function fetchSourceQuestionsForSlice(
  certificationId: string,
  slice: GenerationTargetSlice,
  limit = 3
): Promise<SourceQuestionCandidate[]> {
  let sourceQuery = supabaseAdmin
    .from("questions")
    .select("question_id, question_text_en, eco_version, topic")
    .eq("certification_id", certificationId)
    .eq("interaction_type", slice.interactionType)
    .eq("answer_type", slice.answerType)
    .eq("status", "approved")
    .limit(limit);

  if (slice.domain) sourceQuery = sourceQuery.eq("domain", slice.domain);
  if (slice.approach) sourceQuery = sourceQuery.eq("approach", slice.approach);
  if (slice.difficulty) sourceQuery = sourceQuery.eq("difficulty", slice.difficulty);

  const { data } = await sourceQuery;
  return (data ?? []) as SourceQuestionCandidate[];
}

/** Runs pattern extraction against a fixed set of source questions and persists the result. */
export async function extractAndInsertPattern(
  certificationId: string,
  slice: GenerationTargetSlice,
  sourceQuestions: SourceQuestionCandidate[],
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

  // Inherited from the source questions actually used, not hardcoded - see
  // migration 015 / Sprint 8.1 incident notes for why this matters (a null
  // eco_version guarantees MISSING_REQUIRED_METADATA on every question
  // generated from this pattern).
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

export async function incrementPatternUsage(patternId: string): Promise<void> {
  try {
    await supabaseAdmin.rpc("increment_pattern_usage", { p_pattern_id: patternId });
  } catch {
    // Best-effort statistic - never fail generation over a counter update.
  }
}

// ============================================================================
// Batch-aware, diversity-aware selection (Sprint 8.3 - pilot pattern-collapse
// incident)
// ============================================================================
// Root cause of the pilot's pattern collapse (all 5+ reviewed questions
// reusing the SAME pattern, extracted from the SAME 3 source questions
// Q000011/Q000013/Q000022): the old findOrCreatePattern always called
// findExistingPattern, which does `.limit(1).maybeSingle()` with no
// ORDER BY and no awareness of what had already been picked THIS BATCH -
// with only one active pattern ever existing for Process/Predictive/
// Moderate/standard/single, every single call (across every batch, forever)
// deterministically returned that same row. Compounding this,
// fetchSourceQuestionsForSlice had no randomization either (`.limit(3)`,
// default DB order) - so even a fresh extraction would have picked the same
// 3 source questions every time. Neither issue was a missing random() call
// so much as a complete absence of "what have I already used in this run"
// bookkeeping - see pickLeastUsedUnusedPattern/pickDiverseSourceQuestions
// below, which are exactly that bookkeeping made explicit and testable.

/** Pure decision logic, no I/O - kept separate so it's unit-testable without mocking Supabase (same precedent as computeFinalBatchStatus/discoverCombos/classifyGap elsewhere in this pipeline). */
export interface PatternUsageCandidate {
  id: string;
  times_used: number;
}

/**
 * Prefers a pattern NOT already used elsewhere in this batch; among those,
 * the least-used overall (coverage-aware - spreads usage across the whole
 * library over time, not just within one batch). Returns null only when
 * every eligible candidate has already been used this batch, signaling the
 * caller should try extracting a fresh pattern before ever falling back to
 * a repeat.
 */
export function pickLeastUsedUnusedPattern<T extends PatternUsageCandidate>(candidates: T[], usedPatternIds: ReadonlySet<string>): T | null {
  const unused = candidates.filter((p) => !usedPatternIds.has(p.id));
  if (unused.length === 0) return null;
  return [...unused].sort((a, b) => a.times_used - b.times_used)[0];
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Picks up to `limit` source questions for a NEW pattern extraction,
 * excluding any already used elsewhere in this batch, randomized (not the
 * deterministic "first N in DB order" the pilot incident traced back to),
 * and preferring topic diversity among the picks themselves (so a 3-source
 * cluster isn't accidentally 3 near-identical questions on the same
 * sub-topic). `rng` is injectable for deterministic tests - defaults to
 * Math.random for real use.
 */
export function pickDiverseSourceQuestions(
  candidates: SourceQuestionCandidate[],
  excludeQuestionIds: ReadonlySet<string>,
  limit: number,
  rng: () => number = Math.random
): SourceQuestionCandidate[] {
  const eligible = candidates.filter((c) => !excludeQuestionIds.has(c.question_id));
  const shuffled = shuffle(eligible, rng);

  const picked: SourceQuestionCandidate[] = [];
  const usedTopics = new Set<string>();

  for (const candidate of shuffled) {
    if (picked.length >= limit) break;
    const topic = candidate.topic ?? "";
    if (topic && usedTopics.has(topic)) continue;
    picked.push(candidate);
    if (topic) usedTopics.add(topic);
  }
  if (picked.length < limit) {
    for (const candidate of shuffled) {
      if (picked.length >= limit) break;
      if (picked.some((p) => p.question_id === candidate.question_id)) continue;
      picked.push(candidate);
    }
  }
  return picked;
}

export interface SelectPatternResult {
  pattern: PatternRow;
  wasCreated: boolean;
  /** True only when every diversification option was exhausted and the selection had to repeat a pattern already used this batch - see this module's header comment. */
  wasForcedReuse: boolean;
  promptTokens: number;
  completionTokens: number;
}

/**
 * The batch-aware replacement for the old findOrCreatePattern. Tries, in
 * order: (1) an active pattern matching the slice that hasn't been used yet
 * THIS BATCH, preferring the least-used overall; (2) extracting a brand new
 * pattern from a source-question cluster that hasn't been used yet this
 * batch; (3) only if both of those are genuinely exhausted, reusing the
 * least-used existing pattern anyway (wasForcedReuse: true) rather than
 * failing the batch - diversity is a strong preference, not a hard
 * requirement when the eligible pool truly can't support it.
 */
export async function selectOrCreatePatternForBatch(
  certificationId: string,
  slice: GenerationTargetSlice,
  usedPatternIds: Set<string>,
  usedSourceQuestionIds: Set<string>,
  createdBy: string
): Promise<SelectPatternResult> {
  const candidates = await fetchActivePatternsForSlice(certificationId, slice);

  const unused = pickLeastUsedUnusedPattern(candidates, usedPatternIds);
  if (unused) {
    return { pattern: unused, wasCreated: false, wasForcedReuse: false, promptTokens: 0, completionTokens: 0 };
  }

  // No unused existing pattern - try a fresh extraction from source
  // questions not yet used this batch before ever repeating one.
  const sourcePool = await fetchSourceQuestionsForSlice(certificationId, slice, 30);
  const diverseSources = pickDiverseSourceQuestions(sourcePool, usedSourceQuestionIds, 3);
  if (diverseSources.length > 0) {
    const { pattern, promptTokens, completionTokens } = await extractAndInsertPattern(certificationId, slice, diverseSources, createdBy);
    return { pattern, wasCreated: true, wasForcedReuse: false, promptTokens, completionTokens };
  }

  // Genuinely exhausted: every matching pattern has been used this batch,
  // and no unused source question remains to build a new one from either.
  if (candidates.length > 0) {
    const leastUsedOverall = [...candidates].sort((a, b) => a.times_used - b.times_used)[0];
    return { pattern: leastUsedOverall, wasCreated: false, wasForcedReuse: true, promptTokens: 0, completionTokens: 0 };
  }

  // No existing pattern at all for this slice, and excluding used source
  // questions leaves none to extract from either - last resort, extract
  // from the same pool without the exclusion.
  const fallbackSources = await fetchSourceQuestionsForSlice(certificationId, slice, 3);
  const { pattern, promptTokens, completionTokens } = await extractAndInsertPattern(certificationId, slice, fallbackSources, createdBy);
  return { pattern, wasCreated: true, wasForcedReuse: true, promptTokens, completionTokens };
}
