"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useLang } from "@/lib/LanguageContext";
import { retakeMockExamAttempt } from "@/features/mock-exam/services/examAttemptService";
import type { MockExamHistoryEntry } from "@/features/mock-exam/types/mockExam";
import type { MockExamHistoryGroup } from "@/features/mock-exam/services/examHistoryService";

interface Props {
  groups: MockExamHistoryGroup[];
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

export default function ExamHistoryContent({ groups }: Props) {
  const router = useRouter();
  const { t } = useLang();
  const h = t.assessment.history;
  const [retaking, startRetake] = useTransition();
  const [retakingId, setRetakingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Exam numbers are assigned by ORIGINAL creation order (stable identity),
  // independent of the recency-first display order groups already come in.
  const examNumberByRoot = new Map(
    [...groups]
      .sort((a, b) => (a.attempts[0]?.startedAt ?? "").localeCompare(b.attempts[0]?.startedAt ?? ""))
      .map((g, i) => [g.rootAttemptId, i + 1])
  );

  function handleRetake(attemptId: string) {
    setError(null);
    setRetakingId(attemptId);
    startRetake(async () => {
      const result = await retakeMockExamAttempt(attemptId);
      if (!result.success || !result.attemptId) {
        setError(result.error ?? "Failed to start retake");
        setRetakingId(null);
        return;
      }
      router.push(`/pmp/mock-exam/${result.attemptId}`);
    });
  }

  return (
    <div className="academy-shell relative min-h-screen px-6 py-24">
      <div className="container-page relative max-w-3xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-indigo-600">PMP</span>
            <h1 className="mt-3 text-2xl font-bold text-slate-900">Mock Exam {h.title}</h1>
          </div>
          <Link href="/pmp/mock-exam" className="rounded-lg bg-indigo-600 px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-indigo-700">
            {t.assessment.results.startNewExam}
          </Link>
        </div>

        {error && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">{error}</p>}

        <div className="mt-8 space-y-6">
          {groups.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white px-6 py-12 text-center">
              <p className="text-[14px] font-medium text-slate-900">{h.noAttemptsYet}</p>
              <p className="text-[13px] text-slate-500">{h.startPrompt}</p>
              <Link href="/pmp/mock-exam" className="mt-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-indigo-700">
                {t.assessment.results.startNewExam}
              </Link>
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.rootAttemptId} className="rounded-xl border border-slate-200 bg-white p-5">
                <p className="mb-3 text-[13px] font-semibold text-slate-900">Mock Exam #{examNumberByRoot.get(group.rootAttemptId)}</p>
                <div className="space-y-2">
                  {group.attempts.map((entry, i) => {
                    const isTerminal = entry.status === "completed" || entry.status === "expired";
                    const isLastInGroup = i === group.attempts.length - 1;
                    return (
                      <div key={entry.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
                        <div>
                          <p className="text-[12px] font-medium text-slate-700">{i === 0 ? h.attempt : `${h.retake} ${i}`}</p>
                          <p className="text-[12px] text-slate-500">
                            {formatDate(entry.startedAt)} · {entry.totalQuestions} questions · {formatDuration(entry.durationSeconds)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          {entry.score !== null && <span className="text-[14px] font-semibold text-slate-900">{entry.score}%</span>}
                          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_CLS[entry.status]}`}>{STATUS_LABEL[entry.status]}</span>
                          {entry.status === "active" || entry.status === "on_break" ? (
                            <Link href={`/pmp/mock-exam/${entry.id}`} className="rounded-lg bg-indigo-600 px-4 py-2 text-[12px] font-semibold text-white hover:bg-indigo-700">
                              {h.resume}
                            </Link>
                          ) : (
                            <Link href={`/pmp/mock-exam/${entry.id}/results`} className="text-[12px] font-medium text-indigo-600 hover:text-indigo-700">
                              {h.results}
                            </Link>
                          )}
                          {isTerminal && isLastInGroup && (
                            <button
                              onClick={() => handleRetake(entry.id)}
                              disabled={retaking && retakingId === entry.id}
                              className="rounded-lg border border-indigo-200 bg-white px-3 py-2 text-[12px] font-semibold text-indigo-700 transition-colors hover:bg-indigo-50 disabled:opacity-50"
                            >
                              {retaking && retakingId === entry.id ? "..." : t.assessment.results.retakeSameExam}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
