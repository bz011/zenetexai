import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/requireRole";
import BatchDetailContent from "./BatchDetailContent";

interface Props {
  params: Promise<{ batchId: string }>;
}

export const metadata: Metadata = { title: "Admin — Batch Detail" };
export const dynamic = "force-dynamic";

export default async function BatchDetailPage({ params }: Props) {
  const { batchId } = await params;
  const { supabase } = await requireRole(["admin", "instructor"], { loginRedirectTo: `/admin/ai-generation/batches/${batchId}` });

  const { data: batch } = await supabase.from("generation_batches").select("*").eq("id", batchId).single();
  if (!batch) notFound();

  const { data: batchQuestions } = await supabase
    .from("generation_batch_questions")
    .select("id, question_id, accepted, rejection_reason, quality_scores, created_at")
    .eq("batch_id", batchId)
    .order("created_at", { ascending: true });

  return <BatchDetailContent batch={batch} batchQuestions={batchQuestions ?? []} />;
}
