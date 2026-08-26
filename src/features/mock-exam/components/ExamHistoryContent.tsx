"use client";

import Link from "next/link";
import type { MockExamHistoryEntry } from "@/features/mock-exam/types/mockExam";

interface Props {
  entries: MockExamHistoryEntry[];
  total: number;
  page: number;
  pageSize: number;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

const STATUS_LABEL: Record<MockExamHistoryEntry["status"], string> = {
  active: "In progress",
  on_break: "On break",
  completed: "Completed",
  expired: "Time expired",
  abandoned: "Abandoned",
};

const STATUS_CLS: Record<MockExamHistoryEntry["status"], string> = {
  active: "bg-indigo-50 text-indigo-700 border border-indigo-200",
  on_break: "bg-indigo-50 text-indigo-700 border border-indigo-200",
  completed: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  expired: "bg-amber-50 text-amber-700 border border-amber-200",
  abandoned: "bg-slate-50 text-slate-500 border border-slate-200",
};

export default function ExamHistoryContent({ entries, total, page, pageSize }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="relative min-h-screen px-6 py-24">
      <div className="container-page relative max-w-3xl">
        <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-indigo-600">PMP</span>
        <h1 className="mt-3 text-2xl font-bold text-slate-900">Mock Exam History</h1>

        <div className="mt-8 space-y-2">
          {entries.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white px-6 py-12 text-center">
              <p className="text-[14px] font-medium text-slate-900">No Mock Exam attempts yet</p>
              <p className="text-[13px] text-slate-500">Take a full-length Mock Exam to see your history and scores here.</p>
              <Link href="/pmp/mock-exam" className="mt-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-indigo-700">
                Start Mock Exam
              </Link>
            </div>
          ) : (
            entries.map((entry) => (
              <div key={entry.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4">
                <div>
                  <p className="text-[13px] text-slate-500">{formatDate(entry.startedAt)}</p>
                  <p className="mt-1 text-[13px] text-slate-600">
                    {entry.totalQuestions} questions · {formatDuration(entry.durationSeconds)} · {entry.blueprintVersion}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {entry.score !== null && <span className="text-[15px] font-semibold text-slate-900">{entry.score}%</span>}
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_CLS[entry.status]}`}>{STATUS_LABEL[entry.status]}</span>
                  {entry.status === "active" || entry.status === "on_break" ? (
                    <Link href={`/pmp/mock-exam/${entry.id}`} className="rounded-lg bg-indigo-600 px-4 py-2 text-[12px] font-semibold text-white hover:bg-indigo-700">
                      Resume
                    </Link>
                  ) : (
                    <Link href={`/pmp/mock-exam/${entry.id}/results`} className="text-[12px] font-medium text-indigo-600 hover:text-indigo-700">
                      Results
                    </Link>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link
              href={`/pmp/mock-exam/history?page=${Math.max(0, page - 1)}`}
              className={`rounded-lg border border-slate-200 px-4 py-2 text-[12px] font-medium text-slate-600 hover:bg-slate-50 ${page === 0 ? "pointer-events-none opacity-30" : ""}`}
            >
              ← Previous
            </Link>
            <span className="text-[12px] text-slate-500">
              Page {page + 1} of {totalPages}
            </span>
            <Link
              href={`/pmp/mock-exam/history?page=${Math.min(totalPages - 1, page + 1)}`}
              className={`rounded-lg border border-slate-200 px-4 py-2 text-[12px] font-medium text-slate-600 hover:bg-slate-50 ${page >= totalPages - 1 ? "pointer-events-none opacity-30" : ""}`}
            >
              Next →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
