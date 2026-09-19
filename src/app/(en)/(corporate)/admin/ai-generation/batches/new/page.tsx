import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import NewBatchForm from "./NewBatchForm";
import { MAX_UI_RUN_COUNT } from "@/features/ai-generation/services/aiGenerationBatchRunConstants";

interface Props {
  searchParams: Promise<{ domain?: string; approach?: string; difficulty?: string; interaction_type?: string }>;
}

export const metadata: Metadata = { title: "Admin — New Generation Batch" };
export const dynamic = "force-dynamic";

export default async function NewBatchPage({ searchParams }: Props) {
  await requireRole(["admin", "instructor"], { loginRedirectTo: "/admin/ai-generation/batches/new" });
  const params = await searchParams;

  return (
    <div className="relative min-h-screen px-6 py-24">
      <div className="container-page relative max-w-2xl">
        <Link href="/admin/ai-generation" className="text-[13px] text-slate-500 hover:text-slate-300 transition-colors">
          ← AI Generation
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-white">Create Generation Batch</h1>
        <p className="mt-2 text-[13px] text-slate-500">
          Maximum 100 questions per batch. After creating it, you can click <strong>Generate now</strong> right on
          its page to run it (batches of up to {MAX_UI_RUN_COUNT} run directly from the browser; larger batches
          need the CLI, since a very long-running batch risks a serverless timeout mid-run).
        </p>

        <NewBatchForm
          initialDomain={params.domain}
          initialApproach={params.approach}
          initialDifficulty={params.difficulty}
          initialInteractionType={params.interaction_type}
        />
      </div>
    </div>
  );
}
