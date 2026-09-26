import { supabaseAdmin } from "../question-bank/supabaseAdminClient";
import { validateWorkbookData } from "../question-bank/validate";
import { getLLMProvider } from "./llm";
import { selectOrCreatePatternForBatch, incrementPatternUsage } from "./patternService";
import { buildQuestionGenerationPrompt } from "./prompts/questionGeneration_v1";
import { buildCritiquePrompt } from "./prompts/questionCritique_v1";
import { buildTranslationReviewPrompt } from "./prompts/translationReview_v1";
import { buildMetadataConsistencyPrompt } from "./prompts/metadataConsistencyReview_v1";
import { adaptDraftToWorkbookRows } from "./draftAdapter";
import { runSimilarityChecks, embedAndStore } from "./similarity";
import {
  computeQualityScores,
  hasHardFailure,
  pipelineFailureQualityScores,
  type CritiqueResult,
  type TranslationReviewResult,
  type MetadataReviewResult,
} from "./qualityGate";
import { allocateQuestionId } from "./questionIdAllocator";
import { insertAcceptedDraft } from "./insertDraft";
import type { StructuredGenerationResult } from "./llm";
import type { GenerationTargetSlice, RawGeneratedQuestion, GenerationOutcome, PipelineFailureStage } from "./types";

export interface GenerateOneQuestionParams {
  certificationId: string;
  certificationCode: string;
  slice: GenerationTargetSlice;
  batchId: string;
  createdBy: string;
  styleExampleTexts: string[];
  sameBatchDraftTexts: { batchQuestionId: string; text: string }[];
  /**
   * Shared, mutable across every question in the batch (same precedent as
   * sameBatchDraftTexts above) - selectOrCreatePatternForBatch reads these
   * to avoid repeating a pattern/source-cluster already used elsewhere in
   * this batch. See patternService.ts's header comment for the pattern-
   * collapse incident this closes.
   */
  usedPatternIds: Set<string>;
  usedSourceQuestionIds: Set<string>;
}

async function recordBatchQuestion(params: {
  batchId: string;
  questionId: string | null;
  patternId: string | null;
  accepted: boolean;
  rejectionReason?: string;
  failureStage?: PipelineFailureStage;
  qualityScores?: unknown;
  promptTokens: number;
  completionTokens: number;
}): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from("generation_batch_questions")
    .insert({
      batch_id: params.batchId,
      question_id: params.questionId,
      pattern_id: params.patternId,
      accepted: params.accepted,
      rejection_reason: params.rejectionReason ?? null,
      failure_stage: params.failureStage ?? null,
      quality_scores: params.qualityScores ?? null,
      prompt_tokens: params.promptTokens,
      completion_tokens: params.completionTokens,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Failed to record generation_batch_questions row: ${error?.message}`);
  }
  return (data as { id: string }).id;
}

/**
 * Records a pipeline-stage failure and returns the matching GenerationOutcome.
 * Used for every stage that can fail BEFORE a draft/quality score exists
 * (pattern extraction, generation, critique/translation/metadata review,
 * similarity checks) - these used to simply throw out of generateOneQuestion
 * uncaught, which runBatch's per-task catch only console.error'd (never
 * persisted), leaving zero trace of WHY 5/5 attempts failed. See migration
 * 015's header comment for the incident this fixes.
 */
async function recordPipelineFailure(
  batchId: string,
  patternId: string | null,
  stage: PipelineFailureStage,
  err: unknown,
  promptTokens: number,
  completionTokens: number
): Promise<GenerationOutcome> {
  const message = err instanceof Error ? err.message : String(err);
  const rejectionReason = `[${stage}] ${message}`;

  await recordBatchQuestion({
    batchId,
    questionId: null,
    patternId,
    accepted: false,
    rejectionReason,
    failureStage: stage,
    qualityScores: null,
    promptTokens,
    completionTokens,
  });

  return {
    accepted: false,
    patternId,
    rejectionReason,
    failureStage: stage,
    qualityScores: pipelineFailureQualityScores(rejectionReason),
    similarityMatches: [],
    promptTokens,
    completionTokens,
  };
}

/**
 * Generates, validates, scores, and (if it passes) inserts ONE question.
 * Never throws for ANY expected failure mode - hard validation failure, low
 * quality score, similarity breach, OR a pipeline stage itself failing
 * (pattern extraction finding no source questions, the LLM call erroring,
 * etc.). Every one of those is a normal, expected outcome recorded via
 * recordBatchQuestion/recordPipelineFailure and returned in the result, so
 * generation_batch_questions always has exactly one row per attempt and the
 * UI can show precisely why. Only a genuinely unexpected error (e.g.
 * recordBatchQuestion's own insert failing) can still throw, and the caller
 * (generateBatch.ts) is responsible for catching that per question so one
 * failure never stops the batch.
 */
export async function generateOneQuestion(params: GenerateOneQuestionParams): Promise<GenerationOutcome> {
  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;

  let provider: ReturnType<typeof getLLMProvider>;
  try {
    provider = getLLMProvider();
  } catch (err) {
    // Misconfiguration (missing API key, unknown LLM_PROVIDER) - genuinely
    // unexpected relative to normal per-question pipeline stages, not a
    // pattern/generation/quality outcome, but still must be recorded rather
    // than thrown uncaught (this was the pre-fix failure mode).
    return recordPipelineFailure(params.batchId, null, "unexpected_error", err, 0, 0);
  }

  let patternId: string | null = null;
  let pattern: Awaited<ReturnType<typeof selectOrCreatePatternForBatch>>["pattern"];
  try {
    const patternResult = await selectOrCreatePatternForBatch(
      params.certificationId,
      params.slice,
      params.usedPatternIds,
      params.usedSourceQuestionIds,
      params.createdBy
    );
    pattern = patternResult.pattern;
    patternId = pattern.id;
    totalPromptTokens += patternResult.promptTokens;
    totalCompletionTokens += patternResult.completionTokens;
    // Recorded immediately (synchronously, before any further await) so a
    // concurrent task selecting at nearly the same time sees this choice -
    // best-effort under the batch runner's concurrency limit, same
    // characteristic as sameBatchDraftTexts' existing race tolerance.
    params.usedPatternIds.add(pattern.id);
    for (const sourceId of pattern.source_question_ids) params.usedSourceQuestionIds.add(sourceId);
  } catch (err) {
    return recordPipelineFailure(params.batchId, null, "pattern_extraction", err, totalPromptTokens, totalCompletionTokens);
  }

  let draft: RawGeneratedQuestion;
  try {
    const generationPrompt = buildQuestionGenerationPrompt(pattern, params.slice, params.styleExampleTexts);
    const generationResult = await provider.generateStructured<RawGeneratedQuestion>({
      ...generationPrompt,
      model: provider.defaultModel,
    });
    totalPromptTokens += generationResult.usage.promptTokens;
    totalCompletionTokens += generationResult.usage.completionTokens;
    draft = generationResult.data;
  } catch (err) {
    return recordPipelineFailure(params.batchId, patternId, "question_generation", err, totalPromptTokens, totalCompletionTokens);
  }

  const questionId = await allocateQuestionId();
  const adapted = adaptDraftToWorkbookRows(draft, questionId, pattern, params.slice, params.certificationCode);

  const validation = validateWorkbookData(adapted.workbook);

  let critiqueResult: StructuredGenerationResult<CritiqueResult>;
  let translationResult: StructuredGenerationResult<TranslationReviewResult>;
  let metadataResult: StructuredGenerationResult<MetadataReviewResult>;
  try {
    [critiqueResult, translationResult, metadataResult] = await Promise.all([
      provider.generateStructured<CritiqueResult>({ ...buildCritiquePrompt(draft), model: provider.defaultModel }),
      provider.generateStructured<TranslationReviewResult>({ ...buildTranslationReviewPrompt(draft), model: provider.defaultModel }),
      provider.generateStructured<MetadataReviewResult>({ ...buildMetadataConsistencyPrompt(draft, params.slice), model: provider.defaultModel }),
    ]);
    totalPromptTokens += critiqueResult.usage.promptTokens + translationResult.usage.promptTokens + metadataResult.usage.promptTokens;
    totalCompletionTokens += critiqueResult.usage.completionTokens + translationResult.usage.completionTokens + metadataResult.usage.completionTokens;
  } catch (err) {
    return recordPipelineFailure(params.batchId, patternId, "critique_review", err, totalPromptTokens, totalCompletionTokens);
  }

  let similarityMatches: Awaited<ReturnType<typeof runSimilarityChecks>>["matches"];
  let semanticComparisonHadCandidates: boolean;
  try {
    const similarityResult = await runSimilarityChecks(provider, {
      draftText: draft.question_text_en,
      sourceQuestionIds: pattern.source_question_ids,
      sameBatchDraftTexts: params.sameBatchDraftTexts,
      draftOptionTexts: draft.options.map((o) => o.option_text_en),
      draftTags: draft.tags,
    });
    similarityMatches = similarityResult.matches;
    semanticComparisonHadCandidates = similarityResult.semanticComparisonHadCandidates;
    totalPromptTokens += similarityResult.promptTokens;
  } catch (err) {
    return recordPipelineFailure(params.batchId, patternId, "similarity_check", err, totalPromptTokens, totalCompletionTokens);
  }

  const qualityScores = computeQualityScores({
    validatorIssues: validation.issues,
    interactionType: params.slice.interactionType,
    critique: critiqueResult.data,
    translationReview: translationResult.data,
    metadataReview: metadataResult.data,
    similarityMatches,
    options: draft.options,
    explanationExtras: draft.explanation_extras,
    semanticComparisonHadCandidates,
  });

  await incrementPatternUsage(pattern.id);

  if (hasHardFailure(qualityScores)) {
    const batchQuestionId = await recordBatchQuestion({
      batchId: params.batchId,
      questionId: null,
      patternId,
      accepted: false,
      rejectionReason: qualityScores.hard_failures.join("; "),
      failureStage: "quality_gate",
      qualityScores,
      promptTokens: totalPromptTokens,
      completionTokens: totalCompletionTokens,
    });
    await persistSimilarityResults(batchQuestionId, similarityMatches);

    return {
      accepted: false,
      patternId,
      rejectionReason: qualityScores.hard_failures.join("; "),
      failureStage: "quality_gate",
      qualityScores,
      similarityMatches,
      promptTokens: totalPromptTokens,
      completionTokens: totalCompletionTokens,
    };
  }

  const insertResult = await insertAcceptedDraft(adapted, {
    generatedBy: `${provider.name}:${provider.defaultModel}`,
    qualityScore: qualityScores.overall,
  });

  if (!insertResult.success) {
    const batchQuestionId = await recordBatchQuestion({
      batchId: params.batchId,
      questionId: null,
      patternId,
      accepted: false,
      rejectionReason: `Database insertion failed: ${insertResult.error}`,
      failureStage: "database_insertion",
      qualityScores,
      promptTokens: totalPromptTokens,
      completionTokens: totalCompletionTokens,
    });
    await persistSimilarityResults(batchQuestionId, similarityMatches);

    return {
      accepted: false,
      patternId,
      rejectionReason: `Database insertion failed: ${insertResult.error}`,
      failureStage: "database_insertion",
      qualityScores,
      similarityMatches,
      promptTokens: totalPromptTokens,
      completionTokens: totalCompletionTokens,
    };
  }

  // Embed the newly-inserted question so future batches can compare
  // against it too. Best-effort - a failed embedding must not undo an
  // otherwise-successful insertion.
  try {
    const embedTokens = await embedAndStore(provider, questionId, draft.question_text_en);
    totalPromptTokens += embedTokens.promptTokens;
  } catch {
    // Logged by the caller via the batch report's flags, not fatal here.
  }

  const batchQuestionId = await recordBatchQuestion({
    batchId: params.batchId,
    questionId,
    patternId,
    accepted: true,
    qualityScores,
    promptTokens: totalPromptTokens,
    completionTokens: totalCompletionTokens,
  });
  await persistSimilarityResults(batchQuestionId, similarityMatches);

  return {
    accepted: true,
    questionId,
    patternId,
    qualityScores,
    similarityMatches,
    promptTokens: totalPromptTokens,
    completionTokens: totalCompletionTokens,
  };
}

async function persistSimilarityResults(
  batchQuestionId: string,
  matches: { comparisonType: string; matchedQuestionId?: string; matchedBatchQuestionId?: string; similarityScore: number; thresholdResult: string }[]
): Promise<void> {
  if (matches.length === 0) return;
  await supabaseAdmin.from("generation_similarity_results").insert(
    matches.map((m) => ({
      batch_question_id: batchQuestionId,
      comparison_type: m.comparisonType,
      matched_question_id: m.matchedQuestionId ?? null,
      matched_batch_question_id: m.matchedBatchQuestionId ?? null,
      similarity_score: m.similarityScore,
      threshold_result: m.thresholdResult,
    }))
  );
}
