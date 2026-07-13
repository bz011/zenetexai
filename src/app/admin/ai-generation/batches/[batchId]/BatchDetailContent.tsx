"use client";

import { useState } from "react";
import Link from "next/link";
import { cancelGenerationBatch } from "@/features/ai-generation/services/aiGenerationAdminService";

interface BatchQuestionRow {
  id: string;
  question_id: string | null;
  accepted: boolean;
  rejection_reason: string | null;
  quality_scores: { overall?: number } | null;
  created_at: string;
}

interface BatchRow {
  id: string;
  status: string;
  requested_count: number;
  generated_count: number;
  passed_count: number;
  rejected_count: number;
  approved_count: number;
  prompt_tokens: number;
  completion_tokens: number;
  estimated_cost_usd: number;
  llm_provider: string;
  llm_model: string;
  created_by: string;
  error_message: string | null;
}

export default function BatchDetailContent({ batch, batchQuestions }: { batch: BatchRow; batchQuestions: BatchQuestionRow[] }) {
  const [cancelling, setCancelling] = useState(false);

  async function handleCancel() {
    setCancelling(true);
    await cancelGenerationBatch(batch.id);
    setCancelling(false);
  }

  return (
    <div className="relative min-h-screen px-6 py-24">
      <div className="container-page relative max-w-3xl">
        <Link href="/admin/ai-generation" className="text-[13px] text-slate-500 hover:text-slate-300 transition-colors">
          ← AI Generation
        </Link>
        <div className="mt-3 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Batch {batch.id}</h1>
          <span className="rounded-full bg-white/[0.07] px-3 py-1 text-[12px] font-semibold text-slate-300">{batch.status}</span>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="card p-4">
            <p className="text-[11px] text-slate-500">Generated</p>
            <p className="text-lg font-bold text-white">{batch.generated_count}/{batch.requested_count}</p>
          </div>
          <div className="card p-4">
            <p className="text-[11px] text-slate-500">Passed</p>
            <p className="text-lg font-bold text-emerald-400">{batch.passed_count}</p>
          </div>
          <div className="card p-4">
            <p className="text-[11px] text-slate-500">Rejected</p>
            <p className="text-lg font-bold text-red-400">{batch.rejected_count}</p>
          </div>
          <div className="card p-4">
            <p className="text-[11px] text-slate-500">Approved</p>
            <p className="text-lg font-bold text-white">{batch.approved_count}</p>
          </div>
        </div>

        <div className="card mt-4 p-4 text-[13px] text-slate-400">
          <p>Provider: {batch.llm_provider} / {batch.llm_model}</p>
          <p>Tokens: {batch.prompt_tokens} prompt + {batch.completion_tokens} completion</p>
          <p>Estimated cost: ${Number(batch.estimated_cost_usd).toFixed(4)}</p>
          <p>Created by: {batch.created_by}</p>
          {batch.error_message && <p className="mt-2 text-red-400">Error: {batch.error_message}</p>}
        </div>

        {(batch.status === "draft" || batch.status === "running") && (
          <button onClick={handleCancel} disabled={cancelling} className="btn-ghost mt-4 px-5 py-2.5 text-[13px]">
            {cancelling ? "Cancelling..." : "Cancel batch"}
          </button>
        )}

        <h2 className="mt-8 text-[15px] font-semibold text-white">Results ({batchQuestions.length})</h2>
        <div className="mt-4 space-y-2">
          {batchQuestions.map((bq) => (
            <div key={bq.id} className="card flex items-center justify-between px-5 py-3">
              <div>
                {bq.accepted && bq.question_id ? (
                  <Link href={`/admin/ai-generation/review/${bq.question_id}`} className="text-[13px] font-medium text-indigo-400 hover:text-indigo-300">
                    {bq.question_id}
                  </Link>
                ) : (
                  <p className="text-[13px] font-medium text-slate-400">Rejected pre-insert</p>
                )}
                {bq.rejection_reason && <p className="mt-1 text-[12px] text-red-400">{bq.rejection_reason}</p>}
              </div>
              {bq.quality_scores?.overall !== undefined && (
                <span className="text-[13px] font-semibold text-white">{bq.quality_scores.overall}/100</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
