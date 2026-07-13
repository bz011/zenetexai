import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/requireRole";
import ReviewDetailContent from "./ReviewDetailContent";

interface Props {
  params: Promise<{ questionId: string }>;
}

export const metadata: Metadata = { title: "Admin — Review Question" };
export const dynamic = "force-dynamic";

// Applies to this page's Server Actions too (regenerateQuestion /
// requestQuestionRepair in aiGenerationReviseService.ts), which chain a
// handful of sequential OpenAI calls inside one invocation. 60s is a
// conservative ceiling - well within every Vercel plan's function duration
// (Hobby/Pro/Enterprise all default to a 300s max as of this writing), not
// maxed out to the plan ceiling on a guess. Raise only if real usage shows
// it's actually needed.
export const maxDuration = 60;

export default async function ReviewDetailPage({ params }: Props) {
  const { questionId } = await params;
  const { supabase } = await requireRole(["admin", "instructor"], {
    loginRedirectTo: `/admin/ai-generation/review/${questionId}`,
  });

  const { data: question } = await supabase.from("questions").select("*").eq("question_id", questionId).single();
  if (!question) notFound();

  const [{ data: options }, { data: matchingItems }, { data: dragDropItems }, { data: images }, { data: hotspotRows }, { data: batchQuestion }] =
    await Promise.all([
      supabase.from("question_options").select("*").eq("question_id", questionId).order("display_order"),
      supabase.from("matching_items").select("*").eq("question_id", questionId).order("display_order"),
      supabase.from("drag_and_drop_items").select("*").eq("question_id", questionId).order("display_order"),
      supabase.from("question_images").select("*").eq("question_id", questionId),
      supabase.from("hotspots").select("*").eq("question_id", questionId),
      supabase.from("generation_batch_questions").select("id, batch_id, pattern_id, quality_scores").eq("question_id", questionId).maybeSingle(),
    ]);

  interface OptionRow {
    id: string;
    option_key: string;
    option_text_en: string;
    option_text_ar: string;
  }
  interface MatchingItemRow {
    id: string;
    item_id: string;
    side: string;
    text_en: string;
    text_ar: string;
  }
  interface DragDropItemRow {
    id: string;
    item_id: string;
    item_text_en: string;
    item_text_ar: string;
  }

  const optionRows = (options ?? []) as OptionRow[];
  const matchingItemRows = (matchingItems ?? []) as MatchingItemRow[];
  const dragDropItemRows = (dragDropItems ?? []) as DragDropItemRow[];

  const optionIds = optionRows.map((o) => o.id);
  const { data: answerKeys } = optionIds.length
    ? await supabase.from("question_answer_key").select("option_id, is_correct").in("option_id", optionIds)
    : { data: [] };
  const correctByOptionId = new Map(((answerKeys ?? []) as { option_id: string; is_correct: boolean }[]).map((a) => [a.option_id, a.is_correct]));
  const optionsWithCorrectness = optionRows.map((o) => ({ ...o, is_correct: correctByOptionId.get(o.id) ?? false }));

  const matchingItemIds = matchingItemRows.map((m) => m.id);
  const { data: matchingPairs } = matchingItemIds.length
    ? await supabase.from("matching_answer_key").select("left_item_id, right_item_id").in("left_item_id", matchingItemIds)
    : { data: [] };

  const dragDropItemIds = dragDropItemRows.map((d) => d.id);
  const { data: dragDropPositions } = dragDropItemIds.length
    ? await supabase.from("drag_and_drop_answer_key").select("item_id, correct_position").in("item_id", dragDropItemIds)
    : { data: [] };

  let pattern = null;
  let similarityResults: { comparison_type: string; matched_question_id: string | null; similarity_score: number; threshold_result: string }[] = [];

  if (batchQuestion?.pattern_id) {
    const { data: patternData } = await supabase.from("question_patterns").select("*").eq("id", batchQuestion.pattern_id).single();
    pattern = patternData;
  }
  if (batchQuestion?.id) {
    const { data: simData } = await supabase
      .from("generation_similarity_results")
      .select("comparison_type, matched_question_id, matched_batch_question_id, similarity_score, threshold_result")
      .eq("batch_question_id", batchQuestion.id);
    similarityResults = simData ?? [];
  }

  const correctRightIdByLeft = new Map(((matchingPairs ?? []) as { left_item_id: string; right_item_id: string }[]).map((p) => [p.left_item_id, p.right_item_id]));
  const positionByItemId = new Map(((dragDropPositions ?? []) as { item_id: string; correct_position: number }[]).map((p) => [p.item_id, p.correct_position]));

  return (
    <ReviewDetailContent
      question={question}
      options={optionsWithCorrectness}
      matchingItems={matchingItems ?? []}
      matchingCorrectRightIdByLeft={Object.fromEntries(correctRightIdByLeft)}
      dragDropItems={dragDropItemRows.map((d) => ({ ...d, correct_position: positionByItemId.get(d.id) ?? null }))}
      images={images ?? []}
      hotspots={hotspotRows ?? []}
      qualityScores={batchQuestion?.quality_scores ?? null}
      pattern={pattern}
      similarityResults={similarityResults}
    />
  );
}
