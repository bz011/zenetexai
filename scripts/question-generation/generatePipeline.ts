import { supabaseAdmin } from "../question-bank/supabaseAdminClient";
import { validateWorkbookData } from "../question-bank/validate";
import { getLLMProvider } from "./llm";
import { findOrCreatePattern, incrementPatternUsage } from "./patternService";
import { buildQuestionGenerationPrompt } from "./prompts/questionGeneration_v1";
import { buildCritiquePrompt } from "./prompts/questionCritique_v1";
import { buildTranslationReviewPrompt } from "./prompts/translationReview_v1";
import { buildMetadataConsistencyPrompt } from "./prompts/metadataConsistencyReview_v1";
import { adaptDraftToWorkbookRows } from "./draftAdapter";
import { runSimilarityChecks, embedAndStore } from "./similarity";
import { computeQualityScores, hasHardFailure, type CritiqueResult, type TranslationReviewResult, type MetadataReviewResult } from "./qualityGate";
import { allocateQuestionId } from "./questionIdAllocator";
import { insertAcceptedDraft } from "./insertDraft";
import type { GenerationTargetSlice, RawGeneratedQuestion, GenerationOutcome } from "./types";

export interface GenerateOneQuestionParams {
  certificationId: string;
  certificationCode: string;
  slice: GenerationTargetSlice;
  batchId: string;
  createdBy: string;
  styleExampleTexts: string[];
  sameBatchDraftTexts: { batchQuestionId: string; text: string }[];
}

async function recordBatchQuestion(params: {
  batchId: string;
  questionId: string | null;
  patternId: string;
  accepted: boolean;
  rejectionReason?: string;
  qualityScores?: unknown;
}): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from("generation_batch_questions")
    .insert({
      batch_id: params.batchId,
      question_id: params.questionId,
      pattern_id: params.patternId,
      accepted: params.accepted,
      rejection_reason: params.rejectionReason ?? null,
      quality_scores: params.qualityScores ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Failed to record generation_batch_questions row: ${error?.message}`);
  }
  return (data as { id: string }).id;
}

/**
 * Generates, validates, scores, and (if it passes) inserts ONE question.
 * Never throws for a business-logic rejection (hard validation failure,
 * low quality score, similarity breach) - those are normal, expected
 * outcomes recorded in the result. Only genuinely unexpected errors
 * (provider outage, malformed JSON the parser can't recover from) throw,
 * and the caller (generateBatch.ts) is responsible for catching those per
 * question so one failure never stops the batch.
 */
export async function generateOneQuestion(params: GenerateOneQuestionParams): Promise<GenerationOutcome> {
  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;

  const provider = getLLMProvider();

  const { pattern, promptTokens: extractionPromptTokens, completionTokens: extractionCompletionTokens } =
    await findOrCreatePattern(params.certificationId, params.slice, params.createdBy);
  totalPromptTokens += extractionPromptTokens;
  totalCompletionTokens += extractionCompletionTokens;

  const generationPrompt = buildQuestionGenerationPrompt(pattern, params.slice, params.styleExampleTexts);
  const generationResult = await provider.generateStructured<RawGeneratedQuestion>({
    ...generationPrompt,
    model: provider.defaultModel,
  });
  totalPromptTokens += generationResult.usage.promptTokens;
  totalCompletionTokens += generationResult.usage.completionTokens;
  const draft = generationResult.data;

  const questionId = await allocateQuestionId();
  const adapted = adaptDraftToWorkbookRows(draft, questionId, pattern, params.slice, params.certificationCode);

  const validation = validateWorkbookData(adapted.workbook);

  const [critiqueResult, translationResult, metadataResult] = await Promise.all([
    provider.generateStructured<CritiqueResult>({ ...buildCritiquePrompt(draft), model: provider.defaultModel }),
    provider.generateStructured<TranslationReviewResult>({ ...buildTranslationReviewPrompt(draft), model: provider.defaultModel }),
    provider.generateStructured<MetadataReviewResult>({ ...buildMetadataConsistencyPrompt(draft, params.slice), model: provider.defaultModel }),
  ]);
  totalPromptTokens += critiqueResult.usage.promptTokens + translationResult.usage.promptTokens + metadataResult.usage.promptTokens;
  totalCompletionTokens += critiqueResult.usage.completionTokens + translationResult.usage.completionTokens + metadataResult.usage.completionTokens;

  const { matches: similarityMatches, promptTokens: similarityPromptTokens } = await runSimilarityChecks(provider, {
    draftText: draft.question_text_en,
    sourceQuestionIds: pattern.source_question_ids,
    sameBatchDraftTexts: params.sameBatchDraftTexts,
  });
  totalPromptTokens += similarityPromptTokens;

  const qualityScores = computeQualityScores({
    validatorIssues: validation.issues,
    interactionType: params.slice.interactionType,
    critique: critiqueResult.data,
    translationReview: translationResult.data,
    metadataReview: metadataResult.data,
    similarityMatches,
  });

  await incrementPatternUsage(pattern.id);

  if (hasHardFailure(qualityScores)) {
    const batchQuestionId = await recordBatchQuestion({
      batchId: params.batchId,
      questionId: null,
      patternId: pattern.id,
      accepted: false,
      rejectionReason: qualityScores.hard_failures.join("; "),
      qualityScores,
    });
    await persistSimilarityResults(batchQuestionId, similarityMatches);

    return {
      accepted: false,
      patternId: pattern.id,
      rejectionReason: qualityScores.hard_failures.join("; "),
      qualityScores,
      similarityMatches,
      promptTokens: totalPromptTokens,
      completionTokens: totalCompletionTokens,
    };
  }

  const insertResult = await insertAcceptedDraft(adapted);

  if (!insertResult.success) {
    const batchQuestionId = await recordBatchQuestion({
      batchId: params.batchId,
      questionId: null,
      patternId: pattern.id,
      accepted: false,
      rejectionReason: `Database insertion failed: ${insertResult.error}`,
      qualityScores,
    });
    await persistSimilarityResults(batchQuestionId, similarityMatches);

    return {
      accepted: false,
      patternId: pattern.id,
      rejectionReason: `Database insertion failed: ${insertResult.error}`,
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
    patternId: pattern.id,
    accepted: true,
    qualityScores,
  });
  await persistSimilarityResults(batchQuestionId, similarityMatches);

  return {
    accepted: true,
    questionId,
    patternId: pattern.id,
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
