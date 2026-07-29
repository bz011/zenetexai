/**
 * Powers both "Regenerate" (fresh attempt, no specific feedback) and
 * "Request repair" (targeted fix from reviewer feedback) - both update the
 * SAME question_id in place via import_question_bundle (an upsert), rather
 * than allocating a new AIQ id. Shares the scoring/validation building
 * blocks with generatePipeline.ts; the two aren't merged into one function
 * because they start from different inputs (a fresh slice vs an existing
 * question) - flagged as a reasonable follow-up refactor, not hidden here.
 */

import { supabaseAdmin } from "../question-bank/supabaseAdminClient";
import { validateWorkbookData } from "../question-bank/validate";
import { getLLMProvider } from "./llm";
import { buildRepairPrompt } from "./prompts/questionRepair_v1";
import { buildCritiquePrompt } from "./prompts/questionCritique_v1";
import { buildTranslationReviewPrompt } from "./prompts/translationReview_v1";
import { buildMetadataConsistencyPrompt } from "./prompts/metadataConsistencyReview_v1";
import { adaptDraftToWorkbookRows } from "./draftAdapter";
import { runSimilarityChecks, embedAndStore } from "./similarity";
import { computeQualityScores, hasHardFailure, type CritiqueResult, type TranslationReviewResult, type MetadataReviewResult } from "./qualityGate";
import { insertAcceptedDraft } from "./insertDraft";
import type { RawGeneratedQuestion, PatternRow, GenerationOutcome, GenerationTargetSlice } from "./types";

async function fetchCurrentDraftAsRaw(questionId: string): Promise<{ raw: RawGeneratedQuestion; slice: GenerationTargetSlice; patternId: string | null; certificationCode: string }> {
  const { data: question } = await supabaseAdmin.from("questions").select("*, certifications(code)").eq("question_id", questionId).single();
  if (!question) throw new Error(`Question not found: ${questionId}`);

  const q = question as Record<string, unknown> & { certifications: { code: string } };

  const [{ data: options }, { data: matchingPairs }, { data: dragDrop }] = await Promise.all([
    supabaseAdmin.from("question_options").select("*").eq("question_id", questionId).order("display_order"),
    supabaseAdmin.from("matching_items").select("*").eq("question_id", questionId),
    supabaseAdmin.from("drag_and_drop_items").select("*").eq("question_id", questionId).order("display_order"),
  ]);

  const { data: batchQuestion } = await supabaseAdmin
    .from("generation_batch_questions")
    .select("pattern_id")
    .eq("question_id", questionId)
    .maybeSingle();

  // NOTE: is_correct/correct_position are intentionally NOT read back here -
  // this function only has access to what admin-facing tables expose
  // through the normal client; the answer key is fetched separately via
  // supabaseAdmin (service-role) since it's otherwise locked down.
  const { data: answerKeys } = await supabaseAdmin
    .from("question_answer_key")
    .select("option_id, is_correct")
    .in("option_id", ((options ?? []) as { id: string }[]).map((o) => o.id));
  const correctById = new Map(((answerKeys ?? []) as { option_id: string; is_correct: boolean }[]).map((a) => [a.option_id, a.is_correct]));

  const raw: RawGeneratedQuestion = {
    question_text_en: String(q.question_text_en ?? ""),
    question_text_ar: String(q.question_text_ar ?? ""),
    explanation_en: String(q.explanation_en ?? ""),
    explanation_ar: String(q.explanation_ar ?? ""),
    domain: String(q.domain ?? ""),
    task: String(q.task ?? ""),
    topic: String(q.topic ?? ""),
    subtopic: String(q.subtopic ?? ""),
    approach: String(q.approach ?? ""),
    difficulty: String(q.difficulty ?? ""),
    cognitive_level: String(q.cognitive_level ?? ""),
    tags: Array.isArray(q.tags) ? (q.tags as string[]) : [],
    options: ((options ?? []) as { id: string; option_key: string; option_text_en: string; option_text_ar: string; feedback_en: string; feedback_ar: string }[]).map((o) => ({
      option_key: o.option_key,
      option_text_en: o.option_text_en,
      option_text_ar: o.option_text_ar,
      is_correct: correctById.get(o.id) ?? false,
      feedback_en: o.feedback_en,
      feedback_ar: o.feedback_ar,
    })),
    matching_pairs: [],
    drag_and_drop_items: ((dragDrop ?? []) as { item_text_en: string; item_text_ar: string; category: string }[]).map((d) => ({
      item_text_en: d.item_text_en,
      item_text_ar: d.item_text_ar,
      category: d.category,
      correct_position: 0, // repair prompt only needs labels/category for context, not the secret ordering
    })),
    hotspot_brief: null,
    image_brief: null,
    // Pre-Factory rows (or manually-imported questions) won't have these
    // columns populated - the repair/regenerate prompt still needs a value
    // for every required field, so fall back to sensible defaults rather
    // than failing. A repaired/regenerated draft always gets these
    // re-evaluated by the LLM regardless of what's carried in here.
    knowledge_area: (q.knowledge_area as string | null) ?? null,
    process_group: (q.process_group as string | null) ?? null,
    primary_tag: (q.primary_tag as string | null) ?? (Array.isArray(q.tags) && q.tags[0] ? String(q.tags[0]) : "general"),
    estimated_time_seconds: (q.estimated_time_seconds as number | null) ?? 90,
    bloom_level: (q.bloom_level as string | null) ?? "Apply",
    confidence: (q.ai_confidence as number | null) ?? 70,
    explanation_extras: (q.explanation_structured as RawGeneratedQuestion["explanation_extras"] | null) ?? {
      key_concept_en: "", key_concept_ar: "",
      exam_tip_en: "", exam_tip_ar: "",
      common_trap_en: "", common_trap_ar: "",
      related_concepts_en: [], related_concepts_ar: [],
    },
  };

  const slice: GenerationTargetSlice = {
    interactionType: String(q.interaction_type) as GenerationTargetSlice["interactionType"],
    answerType: String(q.answer_type) as GenerationTargetSlice["answerType"],
    domain: String(q.domain ?? ""),
    approach: String(q.approach ?? ""),
    difficulty: String(q.difficulty ?? ""),
    count: 1,
  };

  return {
    raw,
    slice,
    patternId: (batchQuestion as { pattern_id: string | null } | null)?.pattern_id ?? null,
    certificationCode: q.certifications?.code ?? "PMP",
  };
}

export async function reviseQuestion(questionId: string, reviewerFeedback: string | null): Promise<GenerationOutcome> {
  const { raw, slice, patternId, certificationCode } = await fetchCurrentDraftAsRaw(questionId);

  if (!patternId) {
    throw new Error(`Question ${questionId} has no associated pattern - cannot regenerate/repair.`);
  }

  const { data: patternData } = await supabaseAdmin.from("question_patterns").select("*").eq("id", patternId).single();
  const pattern = patternData as PatternRow;

  const provider = getLLMProvider();
  const repairResult = await provider.generateStructured<RawGeneratedQuestion>({
    ...buildRepairPrompt(raw, pattern, reviewerFeedback),
    model: provider.defaultModel,
  });
  const draft = repairResult.data;

  const adapted = adaptDraftToWorkbookRows(draft, questionId, pattern, slice, certificationCode);
  const validation = validateWorkbookData(adapted.workbook);

  const [critiqueResult, translationResult, metadataResult] = await Promise.all([
    provider.generateStructured<CritiqueResult>({ ...buildCritiquePrompt(draft), model: provider.defaultModel }),
    provider.generateStructured<TranslationReviewResult>({ ...buildTranslationReviewPrompt(draft), model: provider.defaultModel }),
    provider.generateStructured<MetadataReviewResult>({ ...buildMetadataConsistencyPrompt(draft, slice), model: provider.defaultModel }),
  ]);

  const { matches: similarityMatches } = await runSimilarityChecks(provider, {
    draftText: draft.question_text_en,
    sourceQuestionIds: pattern.source_question_ids,
    sameBatchDraftTexts: [],
    draftOptionTexts: draft.options.map((o) => o.option_text_en),
    draftTags: draft.tags,
  });

  const qualityScores = computeQualityScores({
    validatorIssues: validation.issues,
    interactionType: slice.interactionType,
    critique: critiqueResult.data,
    translationReview: translationResult.data,
    metadataReview: metadataResult.data,
    similarityMatches,
    options: draft.options,
    explanationExtras: draft.explanation_extras,
  });

  const totalPromptTokens =
    repairResult.usage.promptTokens + critiqueResult.usage.promptTokens + translationResult.usage.promptTokens + metadataResult.usage.promptTokens;
  const totalCompletionTokens =
    repairResult.usage.completionTokens + critiqueResult.usage.completionTokens + translationResult.usage.completionTokens + metadataResult.usage.completionTokens;

  if (hasHardFailure(qualityScores)) {
    return {
      accepted: false,
      patternId,
      rejectionReason: qualityScores.hard_failures.join("; "),
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
    return {
      accepted: false,
      patternId,
      rejectionReason: `Database update failed: ${insertResult.error}`,
      qualityScores,
      similarityMatches,
      promptTokens: totalPromptTokens,
      completionTokens: totalCompletionTokens,
    };
  }

  try {
    await embedAndStore(provider, questionId, draft.question_text_en);
  } catch {
    // Best-effort - does not undo the successful revision.
  }

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
