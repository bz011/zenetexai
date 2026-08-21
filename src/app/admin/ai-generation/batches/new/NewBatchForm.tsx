"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createGenerationBatch } from "@/features/ai-generation/services/aiGenerationAdminService";

const inputCls =
  "w-full rounded-xl border border-white/[0.09] bg-white/[0.04] px-4 py-2.5 text-[14px] text-white placeholder-slate-600 outline-none transition-all focus:border-indigo-500/60 focus:bg-white/[0.06] focus:ring-2 focus:ring-indigo-500/15";

interface Props {
  initialDomain?: string;
  initialApproach?: string;
  initialDifficulty?: string;
  initialInteractionType?: string;
}

export default function NewBatchForm({ initialDomain, initialApproach, initialDifficulty, initialInteractionType }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);
    setError(null);
    const result = await createGenerationBatch(formData);
    setSubmitting(false);

    if (!result.success) {
      setError(result.error ?? "Failed to create batch");
      return;
    }
    router.push(`/admin/ai-generation/batches/${result.batchId}`);
  }

  return (
    <form action={handleSubmit} className="card mt-6 space-y-4 p-6">
      <input type="hidden" name="certification_code" value="PMP" />

      {(initialDomain || initialApproach || initialDifficulty || initialInteractionType) && (
        <p className="rounded-xl border border-indigo-500/20 bg-indigo-500/[0.08] px-4 py-3 text-[12px] text-indigo-300">
          Pre-filled from a Coverage Intelligence recommendation - adjust anything below before creating the batch.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-slate-400">Interaction type</label>
          <select name="interaction_type" defaultValue={initialInteractionType ?? "standard"} className={inputCls}>
            <option value="standard">standard</option>
            <option value="graphic_based">graphic_based</option>
            <option value="matching">matching</option>
            <option value="drag_and_drop">drag_and_drop</option>
            <option value="hotspot">hotspot (concept only, no coordinates)</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-slate-400">Answer type</label>
          <select name="answer_type" defaultValue="single" className={inputCls}>
            <option value="single">single</option>
            <option value="multiple_response">multiple_response</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-slate-400">Domain</label>
          <select name="domain" defaultValue={initialDomain ?? ""} className={inputCls}>
            <option value="">Any</option>
            <option value="People">People</option>
            <option value="Process">Process</option>
            <option value="Business Environment">Business Environment</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-slate-400">Approach</label>
          <select name="approach" defaultValue={initialApproach ?? ""} className={inputCls}>
            <option value="">Any</option>
            <option value="Predictive">Predictive</option>
            <option value="Agile">Agile</option>
            <option value="Hybrid">Hybrid</option>
            <option value="Mixed">Mixed</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-slate-400">Difficulty</label>
          <select name="difficulty" defaultValue={initialDifficulty ?? ""} className={inputCls}>
            <option value="">Any</option>
            <option value="Easy">Easy</option>
            <option value="Moderate">Moderate</option>
            <option value="Difficult">Difficult</option>
            <option value="Expert">Expert</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-slate-400">Count (max 100)</label>
          <input name="count" type="number" min={1} max={100} defaultValue={5} className={inputCls} />
        </div>
      </div>

      {error && (
        <p className="rounded-xl border border-red-500/20 bg-red-500/[0.08] px-4 py-3 text-[13px] text-red-400">{error}</p>
      )}

      <button type="submit" disabled={submitting} className="btn-primary px-5 py-2.5 text-[13px]">
        {submitting ? "Creating..." : "Create batch (draft)"}
      </button>
    </form>
  );
}
