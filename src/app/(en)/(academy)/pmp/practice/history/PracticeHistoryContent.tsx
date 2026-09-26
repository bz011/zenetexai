"use client";

import Link from "next/link";
import { useLang } from "@/lib/LanguageContext";
import type { PracticeHistoryEntry } from "@/features/practice/types/practice";

interface Props {
  entries: PracticeHistoryEntry[];
  total: number;
  page: number;
  pageSize: number;
}

export default function PracticeHistoryContent({ entries, total, page, pageSize }: Props) {
  const { t, lang } = useLang();
  const k = t.practiceHistory;
  const statusLabel = t.assessment.statusLabel;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleString(lang === "ar" ? "ar" : "en-US", { dateStyle: "medium", timeStyle: "short" });
  }

  function formatDuration(seconds: number | null): string {
    if (seconds === null) return k.untimed;
    const m = Math.floor(seconds / 60);
    return k.minutesShort.replace("{n}", String(m));
  }

  const statusCls: Record<PracticeHistoryEntry["status"], string> = {
    active: "bg-indigo-500/[0.12] text-indigo-400",
    completed: "bg-emerald-500/[0.12] text-emerald-400",
    expired: "bg-amber-500/[0.12] text-amber-400",
    abandoned: "bg-white/[0.07] text-slate-400",
  };

  return (
    <div className="relative min-h-screen px-6 py-24">
      <div className="container-page relative max-w-3xl">
        <span className="label">{k.eyebrow}</span>
        <h1 className="mt-3 text-2xl font-bold text-white">{k.title}</h1>

        <div className="mt-8 space-y-2">
          {entries.length === 0 ? (
            <div className="card flex flex-col items-center gap-3 px-6 py-12 text-center">
              <p className="text-[14px] font-medium text-white">{k.noSessionsYet}</p>
              <p className="text-[13px] text-slate-500">{k.startPrompt}</p>
              <Link href="/pmp/practice" className="btn-primary mt-2 px-5 py-2.5 text-[13px]">
                {k.startPracticing}
              </Link>
            </div>
          ) : (
            entries.map((entry) => {
              const filterSummary =
                [entry.filters.domain, entry.filters.approach, entry.filters.difficulty, entry.filters.interactionType]
                  .filter(Boolean)
                  .join(" · ") || k.allQuestions;
              return (
                <div key={entry.id} className="card flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                  <div>
                    <p className="text-[13px] text-slate-500">{formatDate(entry.startedAt)}</p>
                    <p className="mt-1 text-[13px] text-slate-400">
                      {k.questionsCount.replace("{n}", String(entry.questionCount))} · {formatDuration(entry.durationSeconds)} · {filterSummary}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {entry.score !== null && <span className="text-[15px] font-semibold text-white">{entry.score}%</span>}
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusCls[entry.status]}`}>
                      {statusLabel[entry.status]}
                    </span>
                    {entry.status === "active" ? (
                      <Link href={`/pmp/practice/${entry.id}`} className="btn-primary px-4 py-2 text-[12px]">
                        {k.resume}
                      </Link>
                    ) : (
                      <Link href={`/pmp/practice/${entry.id}/results`} className="btn-ghost px-4 py-2 text-[12px]">
                        {k.results}
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
              {k.previous}
            </Link>
            <span className="text-[12px] text-slate-500">
              {k.pageOf.replace("{a}", String(page + 1)).replace("{b}", String(totalPages))}
            </span>
            <Link
              href={`/pmp/practice/history?page=${Math.min(totalPages - 1, page + 1)}`}
              className={`btn-ghost px-4 py-2 text-[12px] ${page >= totalPages - 1 ? "pointer-events-none opacity-30" : ""}`}
            >
              {k.next}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
