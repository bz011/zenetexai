import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import ReviewQueueContent from "./ReviewQueueContent";

interface Props {
  searchParams: Promise<{ domain?: string; interaction_type?: string; status?: string }>;
}

export const metadata: Metadata = { title: "Admin — Review Queue" };
export const dynamic = "force-dynamic";

export default async function ReviewQueuePage({ searchParams }: Props) {
  const { domain, interaction_type, status } = await searchParams;
  const { supabase } = await requireRole(["admin", "instructor"], { loginRedirectTo: "/admin/ai-generation/review" });

  let query = supabase
    .from("questions")
    .select("question_id, question_text_en, domain, topic, interaction_type, answer_type, difficulty, status, created_at")
    .eq("source", "AI Generated")
    .order("created_at", { ascending: false });

  query = query.eq("status", status || "needs_review");
  if (domain) query = query.eq("domain", domain);
  if (interaction_type) query = query.eq("interaction_type", interaction_type);

  const { data: questions } = await query;

  // Quality scores live on generation_batch_questions, joined in a second
  // query since they're not on `questions` itself (kept AI-pipeline-specific
  // data out of the shared, source-agnostic bank table - see migration 008).
  const questionIds = (questions ?? []).map((q) => q.question_id);
  const { data: scores } = questionIds.length
    ? await supabase.from("generation_batch_questions").select("question_id, quality_scores").in("question_id", questionIds)
    : { data: [] };
  const scoreByQuestion = new Map(((scores ?? []) as { question_id: string; quality_scores: { overall?: number } }[]).map((s) => [s.question_id, s.quality_scores?.overall]));

  return (
    <div className="relative min-h-screen px-6 py-24">
      <div className="container-page relative max-w-4xl">
        <Link href="/admin/ai-generation" className="text-[13px] text-slate-500 hover:text-slate-300 transition-colors">
          ← AI Generation
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-white">Review Queue</h1>

        <ReviewQueueContent
          questions={(questions ?? []).map((q) => ({ ...q, overallScore: scoreByQuestion.get(q.question_id) ?? null }))}
          currentFilters={{ domain: domain ?? "", interaction_type: interaction_type ?? "", status: status ?? "needs_review" }}
        />
      </div>
    </div>
  );
}
