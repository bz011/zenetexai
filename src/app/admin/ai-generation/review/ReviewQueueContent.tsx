"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { bulkApproveQuestions } from "@/features/ai-generation/services/aiGenerationAdminService";

interface ReviewQuestion {
  question_id: string;
  question_text_en: string;
  domain: string | null;
  topic: string | null;
  interaction_type: string;
  answer_type: string;
  difficulty: string | null;
  status: string;
  overallScore: number | null;
}

interface Props {
  questions: ReviewQuestion[];
  currentFilters: { domain: string; interaction_type: string; status: string };
}

export default function ReviewQueueContent({ questions, currentFilters }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkResult, setBulkResult] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/admin/ai-generation/review?${params.toString()}`);
  }

  function toggleSelected(questionId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  }

  async function handleBulkApprove() {
    setBulkLoading(true);
    setBulkResult(null);
    const result = await bulkApproveQuestions(Array.from(selected));
    setBulkLoading(false);
    setBulkResult(`Approved ${result.approved.length}, failed ${result.failed.length}`);
    setSelected(new Set());
    router.refresh();
  }

  const selectCls = "rounded-lg border border-white/[0.09] bg-white/[0.04] px-3 py-2 text-[13px] text-white outline-none";

  return (
    <div>
      <div className="mt-4 flex flex-wrap gap-3">
        <select className={selectCls} value={currentFilters.status} onChange={(e) => updateFilter("status", e.target.value)}>
          <option value="needs_review">needs_review</option>
          <option value="approved">approved</option>
          <option value="rejected">rejected</option>
        </select>
        <select className={selectCls} value={currentFilters.domain} onChange={(e) => updateFilter("domain", e.target.value)}>
          <option value="">Any domain</option>
          <option value="People">People</option>
          <option value="Process">Process</option>
          <option value="Business Environment">Business Environment</option>
        </select>
        <select className={selectCls} value={currentFilters.interaction_type} onChange={(e) => updateFilter("interaction_type", e.target.value)}>
          <option value="">Any type</option>
          <option value="standard">standard</option>
          <option value="graphic_based">graphic_based</option>
          <option value="matching">matching</option>
          <option value="drag_and_drop">drag_and_drop</option>
          <option value="hotspot">hotspot</option>
        </select>
      </div>

      {selected.size > 0 && (
        <div className="mt-4 flex items-center gap-3">
          <button onClick={handleBulkApprove} disabled={bulkLoading} className="btn-primary px-4 py-2 text-[13px]">
            {bulkLoading ? "Approving..." : `Bulk approve ${selected.size} selected`}
          </button>
          {bulkResult && <p className="text-[12px] text-slate-400">{bulkResult}</p>}
        </div>
      )}

      <div className="mt-4 space-y-2">
        {questions.length === 0 && <p className="text-[13px] text-slate-500">Nothing matches these filters.</p>}
        {questions.map((q) => (
          <div key={q.question_id} className="card flex items-center gap-4 px-5 py-4">
            <input type="checkbox" checked={selected.has(q.question_id)} onChange={() => toggleSelected(q.question_id)} className="accent-indigo-500" />
            <Link href={`/admin/ai-generation/review/${q.question_id}`} className="flex-1">
              <p className="text-[13px] font-medium text-white">{q.question_id}</p>
              <p className="mt-1 line-clamp-1 text-[13px] text-slate-400">{q.question_text_en}</p>
              <p className="mt-1 text-[12px] text-slate-600">
                {q.domain} / {q.topic} · {q.interaction_type}/{q.answer_type} · {q.difficulty}
              </p>
            </Link>
            {q.overallScore !== null && <span className="text-[13px] font-semibold text-white">{q.overallScore}/100</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
