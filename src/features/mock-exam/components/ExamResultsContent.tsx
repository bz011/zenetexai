"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/LanguageContext";
import type { MockExamResultsSummary, MockExamReviewQuestion, MockExamReviewFilter } from "@/features/mock-exam/types/mockExam";

interface Props {
  attemptId: string;
  summary: MockExamResultsSummary;
  reviewQuestions: MockExamReviewQuestion[];
  currentFilter: MockExamReviewFilter;
}

const FILTERS: { value: MockExamReviewFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "incorrect", label: "Incorrect" },
  { value: "unanswered", label: "Unanswered" },
  { value: "correct", label: "Correct" },
  { value: "flagged", label: "Flagged" },
];

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function BreakdownList({ title, entries }: { title: string; entries: { label: string; total: number; correct: number }[] }) {
  if (entries.length === 0) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{title}</p>
      <div className="space-y-2">
        {entries.map((e) => {
          const pct = e.total > 0 ? Math.round((e.correct / e.total) * 100) : 0;
          return (
            <div key={e.label} className="flex items-center justify-between gap-3 text-[13px]">
              <span className="text-slate-500">{e.label}</span>
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                  <span className={`block h-full rounded-full ${pct >= 70 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${pct}%` }} />
                </span>
                <span className="w-14 text-right text-slate-900">
                  {e.correct}/{e.total}
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ExamResultsContent({ attemptId, summary, reviewQuestions, currentFilter }: Props) {
  const router = useRouter();
  const { lang } = useLang();

  function setFilter(filter: MockExamReviewFilter) {
    router.push(`/pmp/mock-exam/${attemptId}/results?filter=${filter}`);
  }

  const { attempt } = summary;

  return (
    <div className="relative min-h-screen px-6 py-24">
      <div className="container-page relative max-w-4xl">
        <Link href="/pmp/mock-exam/history" className="text-[13px] text-slate-500 hover:text-slate-700 transition-colors">
          ← Mock Exam history
        </Link>

        <div className="mt-4 text-center">
          <p className="text-4xl font-bold text-slate-900">{attempt.score ?? 0}%</p>
          <p className="mt-2 text-[13px] text-slate-500">
            {attempt.correctCount} correct · {attempt.incorrectCount} incorrect · {attempt.unansweredCount} unanswered
            {attempt.status === "expired" && " · time expired"}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            PMI does not publish a numeric passing score for the real PMP exam - this percentage is provided for self-assessment only.
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5 text-center">
            <p className="text-[12px] text-slate-500">Time spent</p>
            <p className="mt-1 text-lg font-bold text-slate-900">{formatDuration(summary.totalTimeSpentSeconds)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 text-center">
            <p className="text-[12px] text-slate-500">Avg. per question</p>
            <p className="mt-1 text-lg font-bold text-slate-900">
              {summary.averageTimePerQuestionSeconds}s
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 text-center">
            <p className="text-[12px] text-slate-500">Flagged</p>
            <p className="mt-1 text-lg font-bold text-slate-900">{summary.flaggedCount}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <BreakdownList title="By Domain" entries={summary.byDomain} />
          <BreakdownList title="By Approach" entries={summary.byApproach} />
          <BreakdownList title="By Difficulty" entries={summary.byDifficulty} />
          <BreakdownList title="By Question Type" entries={summary.byQuestionType} />
          <BreakdownList title="By Topic" entries={summary.byTopic} />
        </div>

        <div className="mt-10 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`rounded-lg border px-4 py-2 text-[13px] font-medium transition-colors ${
                currentFilter === f.value ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-4">
          {reviewQuestions.length === 0 ? (
            <p className="text-[13px] text-slate-500">No questions match this filter.</p>
          ) : (
            reviewQuestions.map((q, i) => {
              const explanation = lang === "ar" && q.explanationAr ? q.explanationAr : q.explanationEn;
              return (
                <div key={q.questionId ?? i} className="rounded-xl border border-slate-200 bg-white p-6">
                  <div className="flex items-start gap-2">
                    <span className={q.isCorrect === true ? "text-emerald-600" : q.isCorrect === false ? "text-red-600" : "text-slate-400"}>
                      {q.isCorrect === true ? "✓" : q.isCorrect === false ? "✗" : "—"}
                    </span>
                    <div className="flex-1">
                      <p className="text-[14px] font-medium text-slate-900">
                        {q.sequenceNumber + 1}. {lang === "ar" && q.questionTextAr ? q.questionTextAr : q.questionTextEn}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400">{[q.domain, q.approach, q.difficulty].filter(Boolean).join(" · ")}</p>
                    </div>
                    {q.isFlagged && <span className="shrink-0 text-amber-500">⚑</span>}
                  </div>

                  {(q.interactionType === "standard" || q.interactionType === "graphic_based") && (
                    <div className="mt-3 ms-6 space-y-1.5">
                      {q.options.map((o) => {
                        const wasSelected = q.response?.selectedOptionIds?.includes(o.id);
                        return (
                          <p key={o.id} className={`text-[13px] ${o.isCorrect ? "text-emerald-600" : wasSelected ? "text-red-600" : "text-slate-500"}`}>
                            {o.isCorrect ? "✓ " : wasSelected ? "✗ " : "  "}
                            {lang === "ar" && o.textAr ? o.textAr : o.textEn}
                          </p>
                        );
                      })}
                    </div>
                  )}

                  {q.interactionType === "matching" && (
                    <div className="mt-3 ms-6 space-y-1 text-[13px] text-slate-500">
                      {q.matchingLeft.map((left) => {
                        const correctRightId = q.matchingCorrectRightIdByLeft[left.id];
                        const correctRight = q.matchingRight.find((r) => r.id === correctRightId);
                        return (
                          <p key={left.id}>
                            {lang === "ar" && left.textAr ? left.textAr : left.textEn} →{" "}
                            <span className="text-emerald-600">{correctRight ? (lang === "ar" && correctRight.textAr ? correctRight.textAr : correctRight.textEn) : "?"}</span>
                          </p>
                        );
                      })}
                    </div>
                  )}

                  {q.interactionType === "drag_and_drop" && (
                    <ol className="mt-3 ms-6 list-decimal space-y-1 text-[13px] text-slate-500">
                      {[...q.dragDropItems]
                        .sort((a, b) => (a.correctPosition ?? 0) - (b.correctPosition ?? 0))
                        .map((item) => (
                          <li key={item.id}>{lang === "ar" && item.textAr ? item.textAr : item.textEn}</li>
                        ))}
                    </ol>
                  )}

                  {explanation && <p className="mt-3 ms-6 text-[13px] leading-relaxed text-slate-500">{explanation}</p>}
                </div>
              );
            })
          )}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/pmp/mock-exam" className="rounded-lg bg-indigo-600 px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-indigo-700">
            New Mock Exam
          </Link>
          <Link href="/pmp/mock-exam/history" className="text-[13px] font-medium text-indigo-600 hover:text-indigo-700">
            View History
          </Link>
        </div>
      </div>
    </div>
  );
}
