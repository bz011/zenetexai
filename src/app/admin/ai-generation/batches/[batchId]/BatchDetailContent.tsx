"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cancelGenerationBatch } from "@/features/ai-generation/services/aiGenerationAdminService";
import { runGenerationBatchNow } from "@/features/ai-generation/services/aiGenerationBatchRunService";
import { MAX_UI_RUN_COUNT } from "@/features/ai-generation/services/aiGenerationBatchRunConstants";
import { summarizeAttempts, FAILURE_STAGE_LABELS, type FailureStage } from "@/features/ai-generation/services/batchAttemptsSummary";

interface BatchQuestionRow {
  id: string;
  question_id: string | null;
  accepted: boolean;
  rejection_reason: string | null;
  failure_stage: FailureStage | null;
  quality_scores: { overall?: number } | null;
  prompt_tokens: number | null;
  completion_tokens: number | null;
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
  const router = useRouter();
  const [cancelling, setCancelling] = useState(false);
  const [running, setRunning] = useState(false);
  const [runMessage, setRunMessage] = useState<string | null>(null);
  const summary = summarizeAttempts(batchQuestions);

  async function handleCancel() {
    setCancelling(true);
    await cancelGenerationBatch(batch.id);
    setCancelling(false);
    router.refresh();
  }

  async function handleRunNow() {
    setRunning(true);
    setRunMessage("Generating - this calls the LLM for each question in the batch and can take a while, please wait...");
    const result = await runGenerationBatchNow(batch.id);
    setRunning(false);
    setRunMessage(result.success ? null : `Failed: ${result.error}`);
    router.refresh();
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

        <p className="mt-6 text-[11px] uppercase tracking-wide text-slate-600">
          Requested {batch.requested_count} · "Generated" alone never means "succeeded" - see the breakdown below.
        </p>
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="card p-4">
            <p className="text-[11px] text-slate-500">Attempts</p>
            <p className="text-lg font-bold text-white">{summary.attempts}</p>
          </div>
          <div className="card p-4">
            <p className="text-[11px] text-slate-500">LLM responses</p>
            <p className="text-lg font-bold text-white">{summary.llmResponses}</p>
          </div>
          <div className="card p-4">
            <p className="text-[11px] text-slate-500">Valid drafts</p>
            <p className="text-lg font-bold text-white">{summary.validDrafts}</p>
          </div>
          <div className="card p-4">
            <p className="text-[11px] text-slate-500">Quality rejected</p>
            <p className="text-lg font-bold text-amber-400">{summary.qualityRejected}</p>
          </div>
          <div className="card p-4">
            <p className="text-[11px] text-slate-500">Pipeline errors</p>
            <p className="text-lg font-bold text-red-400">{summary.pipelineErrors}</p>
          </div>
          <div className="card p-4">
            <p className="text-[11px] text-slate-500">Saved to review queue</p>
            <p className="text-lg font-bold text-emerald-400">{summary.savedToReviewQueue}</p>
          </div>
          <div className="card p-4">
            <p className="text-[11px] text-slate-500">Approved (post-review)</p>
            <p className="text-lg font-bold text-white">{batch.approved_count}</p>
          </div>
        </div>

        <div className="card mt-4 p-4 text-[13px] text-slate-400">
          <p>Provider: {batch.llm_provider} / {batch.llm_model}</p>
          <p>Tokens: {batch.prompt_tokens} prompt + {batch.completion_tokens} completion</p>
          <p>Estimated cost: ${Number(batch.estimated_cost_usd).toFixed(4)}</p>
          <p>Created by: {batch.created_by}</p>
          {batch.error_message && <p className="mt-2 text-red-400">Error summary: {batch.error_message}</p>}
        </div>

        {runMessage && (
          <p className="mt-4 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-[13px] text-slate-300">{runMessage}</p>
        )}

        <div className="mt-4 flex flex-wrap gap-3">
          {batch.status === "draft" && (
            <button
              onClick={handleRunNow}
              disabled={running || cancelling || batch.requested_count > MAX_UI_RUN_COUNT}
              className="btn-primary px-5 py-2.5 text-[13px]"
            >
              {running ? "Generating..." : "Generate now"}
            </button>
          )}
          {(batch.status === "draft" || batch.status === "running") && (
            <button onClick={handleCancel} disabled={cancelling || running} className="btn-ghost px-5 py-2.5 text-[13px]">
              {cancelling ? "Cancelling..." : "Cancel batch"}
            </button>
          )}
        </div>

        {batch.status === "draft" && batch.requested_count > MAX_UI_RUN_COUNT && (
          <p className="mt-2 text-[12px] text-slate-600">
            This batch requests {batch.requested_count} questions, above the {MAX_UI_RUN_COUNT}-question limit for running from this page
            (larger batches risk a serverless timeout mid-run). Run it via:{" "}
            <code className="text-slate-400">npm run generate:questions -- --batch-id {batch.id}</code>
          </p>
        )}

        <h2 className="mt-8 text-[15px] font-semibold text-white">Attempts ({batchQuestions.length})</h2>
        <div className="mt-4 space-y-2">
          {batchQuestions.map((bq) => (
            <div key={bq.id} className="card flex items-center justify-between px-5 py-3">
              <div>
                {bq.accepted && bq.question_id ? (
                  <Link href={`/admin/ai-generation/review/${bq.question_id}`} className="text-[13px] font-medium text-indigo-400 hover:text-indigo-300">
                    {bq.question_id}
                  </Link>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-medium text-slate-400">Rejected pre-insert</p>
                    {bq.failure_stage && (
                      <span className="rounded-full bg-white/[0.07] px-2 py-0.5 text-[11px] font-semibold text-slate-400">
                        {FAILURE_STAGE_LABELS[bq.failure_stage]}
                      </span>
                    )}
                  </div>
                )}
                {bq.rejection_reason && <p className="mt-1 text-[12px] text-red-400">{bq.rejection_reason}</p>}
                <p className="mt-1 text-[11px] text-slate-600">
                  Tokens: {bq.prompt_tokens ?? 0} prompt / {bq.completion_tokens ?? 0} completion
                </p>
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
