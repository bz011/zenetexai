"use client";

import Link from "next/link";
import type { PracticeHistoryEntry } from "@/features/practice/types/practice";

interface Props {
  entries: PracticeHistoryEntry[];
  total: number;
  page: number;
  pageSize: number;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

function formatDuration(seconds: number | null): string {
  if (seconds === null) return "Untimed";
  const m = Math.floor(seconds / 60);
  return `${m} min`;
}

const STATUS_LABEL: Record<PracticeHistoryEntry["status"], string> = {
  active: "In progress",
  completed: "Completed",
  expired: "Time expired",
  abandoned: "Abandoned",
};

const STATUS_CLS: Record<PracticeHistoryEntry["status"], string> = {
  active: "bg-indigo-500/[0.12] text-indigo-400",
  completed: "bg-emerald-500/[0.12] text-emerald-400",
  expired: "bg-amber-500/[0.12] text-amber-400",
  abandoned: "bg-white/[0.07] text-slate-400",
};

export default function PracticeHistoryContent({ entries, total, page, pageSize }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="relative min-h-screen px-6 py-24">
      <div className="container-page relative max-w-3xl">
        <span className="label">PMP</span>
        <h1 className="mt-3 text-2xl font-bold text-white">Practice History</h1>

        <div className="mt-8 space-y-2">
          {entries.length === 0 ? (
            <div className="card flex flex-col items-center gap-3 px-6 py-12 text-center">
              <p className="text-[14px] font-medium text-white">No practice sessions yet</p>
              <p className="text-[13px] text-slate-500">Start a practice session to see your history and scores here.</p>
              <Link href="/pmp/practice" className="btn-primary mt-2 px-5 py-2.5 text-[13px]">
                Start Practicing
              </Link>
            </div>
          ) : (
            entries.map((entry) => {
              const filterSummary =
                [entry.filters.domain, entry.filters.approach, entry.filters.difficulty, entry.filters.interactionType]
                  .filter(Boolean)
                  .join(" · ") || "All questions";
              return (
                <div key={entry.id} className="card flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                  <div>
                    <p className="text-[13px] text-slate-500">{formatDate(entry.startedAt)}</p>
                    <p className="mt-1 text-[13px] text-slate-400">
                      {entry.questionCount} questions · {formatDuration(entry.durationSeconds)} · {filterSummary}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {entry.score !== null && <span className="text-[15px] font-semibold text-white">{entry.score}%</span>}
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_CLS[entry.status]}`}>
                      {STATUS_LABEL[entry.status]}
                    </span>
                    {entry.status === "active" ? (
                      <Link href={`/pmp/practice/${entry.id}`} className="btn-primary px-4 py-2 text-[12px]">
                        Resume
                      </Link>
                    ) : (
                      <Link href={`/pmp/practice/${entry.id}/results`} className="btn-ghost px-4 py-2 text-[12px]">
                        Results
                      </Link>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link
              href={`/pmp/practice/history?page=${Math.max(0, page - 1)}`}
              className={`btn-ghost px-4 py-2 text-[12px] ${page === 0 ? "pointer-events-none opacity-30" : ""}`}
            >
              ← Previous
            </Link>
            <span className="text-[12px] text-slate-500">
              Page {page + 1} of {totalPages}
            </span>
            <Link
              href={`/pmp/practice/history?page=${Math.min(totalPages - 1, page + 1)}`}
              className={`btn-ghost px-4 py-2 text-[12px] ${page >= totalPages - 1 ? "pointer-events-none opacity-30" : ""}`}
            >
              Next →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
