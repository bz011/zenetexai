import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/requireRole";
import { getBatchDiversityReport } from "@/features/ai-generation/services/batchDiversityService";
import BatchDetailContent from "./BatchDetailContent";

interface Props {
  params: Promise<{ batchId: string }>;
}

export const metadata: Metadata = { title: "Admin — Batch Detail" };
export const dynamic = "force-dynamic";

// Applies to this page's runGenerationBatchNow Server Action too, which can
// run for as long as it takes to generate up to MAX_UI_RUN_COUNT questions
// (a handful of sequential/parallel LLM calls each). 300s matches the
// documented ceiling used elsewhere in this pipeline (review/[questionId]/
// page.tsx) - every Vercel plan supports at least this much.
export const maxDuration = 300;

export default async function BatchDetailPage({ params }: Props) {
  const { batchId } = await params;
  const { supabase } = await requireRole(["admin", "instructor"], { loginRedirectTo: `/admin/ai-generation/batches/${batchId}` });

  const { data: batch } = await supabase.from("generation_batches").select("*").eq("id", batchId).single();
  if (!batch) notFound();

  const { data: batchQuestions } = await supabase
    .from("generation_batch_questions")
    .select("id, question_id, accepted, rejection_reason, failure_stage, quality_scores, prompt_tokens, completion_tokens, created_at")
    .eq("batch_id", batchId)
    .order("created_at", { ascending: true });

  const diversityReport = await getBatchDiversityReport(batchId);

  return <BatchDetailContent batch={batch} batchQuestions={batchQuestions ?? []} diversityReport={diversityReport} />;
}
