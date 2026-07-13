/**
 * Unified quiz-question reads for the Learning Quiz Experience (Sprint 6).
 *
 * A learning_assessment sources its questions from EITHER
 * learning_assessment_question_links (bank-linked, migration 007's 6
 * interaction types) OR the legacy learning_assessment_questions/options
 * (migration 006, standard single-select only) — never both at once for the
 * same assessment. Both paths are normalized into the same QuizQuestion
 * shape so QuizRunner and every question component only ever deal with one
 * model. Nothing here ever reads an answer-key table — same "never touch
 * correctness before submission" rule the Sprint 3 assessment reader used.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { QuizQuestion } from "@/features/courses/types/course";

export async function getQuizQuestions(supabase: SupabaseClient, assessmentId: string): Promise<QuizQuestion[]> {
  const { data: links } = await supabase
    .from("learning_assessment_question_links")
    .select("question_id, order_index")
    .eq("assessment_id", assessmentId)
    .order("order_index", { ascending: true });

  const linkRows = (links ?? []) as { question_id: string; order_index: number }[];
  if (linkRows.length > 0) {
    return getBankQuestions(supabase, linkRows);
  }

  return getLegacyQuestions(supabase, assessmentId);
}

async function getBankQuestions(
  supabase: SupabaseClient,
  linkRows: { question_id: string; order_index: number }[]
): Promise<QuizQuestion[]> {
  const questionIds = linkRows.map((l) => l.question_id);
  const orderByQuestionId = new Map(linkRows.map((l) => [l.question_id, l.order_index]));

  const [{ data: questions }, { data: options }, { data: images }, { data: matchingItems }, { data: dragDropItems }] =
    await Promise.all([
      supabase
        .from("questions")
        .select("question_id, interaction_type, answer_type, question_text_en, question_text_ar")
        .in("question_id", questionIds),
      supabase
        .from("question_options")
        .select("id, question_id, option_text_en, option_text_ar, display_order")
        .in("question_id", questionIds)
        .order("display_order", { ascending: true }),
      supabase
        .from("question_images")
        .select("question_id, image_path, image_alt_en, image_alt_ar, display_order")
        .in("question_id", questionIds)
        .order("display_order", { ascending: true }),
      supabase
        .from("matching_items")
        .select("id, question_id, side, text_en, text_ar, display_order")
        .in("question_id", questionIds)
        .order("display_order", { ascending: true }),
      supabase
        .from("drag_and_drop_items")
        .select("id, question_id, item_text_en, item_text_ar, category, display_order")
        .in("question_id", questionIds)
        .order("display_order", { ascending: true }),
    ]);

  type QuestionRow = {
    question_id: string;
    interaction_type: QuizQuestion["interactionType"];
    answer_type: QuizQuestion["answerType"];
    question_text_en: string;
    question_text_ar: string | null;
  };
  type OptionRow = { id: string; question_id: string; option_text_en: string; option_text_ar: string | null };
  type ImageRow = { question_id: string; image_path: string; image_alt_en: string | null; image_alt_ar: string | null };
  type MatchingRow = { id: string; question_id: string; side: "left" | "right"; text_en: string; text_ar: string | null };
  type DragDropRow = { id: string; question_id: string; item_text_en: string; item_text_ar: string | null; category: string | null };

  const questionRows = (questions ?? []) as QuestionRow[];
  const optionRows = (options ?? []) as OptionRow[];
  const imageRows = (images ?? []) as ImageRow[];
  const matchingRows = (matchingItems ?? []) as MatchingRow[];
  const dragDropRows = (dragDropItems ?? []) as DragDropRow[];

  return questionRows
    .map((q) => ({
      id: q.question_id,
      source: "bank" as const,
      interactionType: q.interaction_type,
      answerType: q.answer_type,
      orderIndex: orderByQuestionId.get(q.question_id) ?? 0,
      questionTextEn: q.question_text_en,
      questionTextAr: q.question_text_ar,
      options: optionRows
        .filter((o) => o.question_id === q.question_id)
        .map((o) => ({ id: o.id, textEn: o.option_text_en, textAr: o.option_text_ar })),
      images: imageRows
        .filter((i) => i.question_id === q.question_id)
        .map((i) => ({ imagePath: i.image_path, altEn: i.image_alt_en, altAr: i.image_alt_ar })),
      matchingLeft: matchingRows
        .filter((m) => m.question_id === q.question_id && m.side === "left")
        .map((m) => ({ id: m.id, textEn: m.text_en, textAr: m.text_ar })),
      matchingRight: matchingRows
        .filter((m) => m.question_id === q.question_id && m.side === "right")
        .map((m) => ({ id: m.id, textEn: m.text_en, textAr: m.text_ar })),
      dragDropItems: dragDropRows
        .filter((d) => d.question_id === q.question_id)
        .map((d) => ({ id: d.id, textEn: d.item_text_en, textAr: d.item_text_ar, category: d.category })),
    }))
    .sort((a, b) => a.orderIndex - b.orderIndex);
}

async function getLegacyQuestions(supabase: SupabaseClient, assessmentId: string): Promise<QuizQuestion[]> {
  const { data: questions } = await supabase
    .from("learning_assessment_questions")
    .select("id, question_text_en, question_text_ar, order_index")
    .eq("assessment_id", assessmentId)
    .order("order_index", { ascending: true });

  const questionList = (questions ?? []) as { id: string; question_text_en: string; question_text_ar: string | null; order_index: number }[];
  const questionIds = questionList.map((q) => q.id);

  const { data: options } = questionIds.length
    ? await supabase
        .from("learning_assessment_options")
        .select("id, question_id, option_text_en, option_text_ar, order_index")
        .in("question_id", questionIds)
        .order("order_index", { ascending: true })
    : { data: [] as { id: string; question_id: string; option_text_en: string; option_text_ar: string | null }[] };

  const optionList = (options ?? []) as { id: string; question_id: string; option_text_en: string; option_text_ar: string | null }[];

  return questionList.map((q) => ({
    id: q.id,
    source: "legacy" as const,
    interactionType: "standard" as const,
    answerType: "single" as const,
    orderIndex: q.order_index,
    questionTextEn: q.question_text_en,
    questionTextAr: q.question_text_ar,
    options: optionList
      .filter((o) => o.question_id === q.id)
      .map((o) => ({ id: o.id, textEn: o.option_text_en, textAr: o.option_text_ar })),
    images: [],
    matchingLeft: [],
    matchingRight: [],
    dragDropItems: [],
  }));
}
