"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/LanguageContext";
import type { PracticeResultsSummary, PracticeReviewQuestion, ReviewFilter } from "@/features/practice/types/practice";

interface Props {
  sessionId: string;
  summary: PracticeResultsSummary;
  reviewQuestions: PracticeReviewQuestion[];
  currentFilter: ReviewFilter;
}

const FILTERS: { value: ReviewFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "incorrect", label: "Incorrect" },
  { value: "unanswered", label: "Unanswered" },
  { value: "correct", label: "Correct" },
  { value: "flagged", label: "Flagged" },
];

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function BreakdownList({ title, entries }: { title: string; entries: { label: string; total: number; correct: number }[] }) {
  if (entries.length === 0) return null;
  return (
    <div className="card p-5">
      <p className="label mb-3">{title}</p>
      <div className="space-y-2">
        {entries.map((e) => (
          <div key={e.label} className="flex items-center justify-between text-[13px]">
            <span className="text-slate-400">{e.label}</span>
            <span className="text-white">
              {e.correct}/{e.total}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PracticeResultsContent({ sessionId, summary, reviewQuestions, currentFilter }: Props) {
  const router = useRouter();
  const { lang } = useLang();

  function setFilter(filter: ReviewFilter) {
    router.push(`/pmp/practice/${sessionId}/results?filter=${filter}`);
  }

  const { session } = summary;

  return (
    <div className="academy-shell relative min-h-screen px-6 py-24">
      <div className="container-page relative max-w-4xl">
        <Link href="/pmp/practice/history" className="text-[13px] text-slate-500 hover:text-slate-300 transition-colors">
          ← Practice history
        </Link>

        <div className="mt-4 text-center">
          <p className={`text-4xl font-bold ${(session.score ?? 0) >= 70 ? "text-emerald-400" : "text-red-400"}`}>{session.score ?? 0}%</p>
          <p className="mt-2 text-[13px] text-slate-500">
            {session.correctCount} correct · {session.incorrectCount} incorrect · {session.unansweredCount} unanswered
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <div className="card p-5 text-center">
            <p className="text-[12px] text-slate-500">Time spent</p>
            <p className="mt-1 text-lg font-bold text-white">{formatDuration(summary.totalTimeSpentSeconds)}</p>
          </div>
          <div className="card p-5 text-center">
            <p className="text-[12px] text-slate-500">Avg. per question</p>
            <p className="mt-1 text-lg font-bold text-white">{formatDuration(summary.averageTimePerQuestionSeconds)}</p>
          </div>
          <div className="card p-5 text-center">
            <p className="text-[12px] text-slate-500">Flagged</p>
            <p className="mt-1 text-lg font-bold text-white">{summary.flaggedCount}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <BreakdownList title="By Domain" entries={summary.byDomain} />
          <BreakdownList title="By Approach" entries={summary.byApproach} />
          <BreakdownList title="By Difficulty" entries={summary.byDifficulty} />
          <BreakdownList title="By Question Type" entries={summary.byQuestionType} />
        </div>

        <div className="mt-10 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`rounded-lg px-4 py-2 text-[13px] font-medium transition-colors ${
                currentFilter === f.value ? "bg-indigo-500 text-white" : "bg-white/[0.06] text-slate-400 hover:bg-white/[0.1]"
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
                <div key={q.questionId ?? i} className="card p-6">
                  <div className="flex items-start gap-2">
                    <span className={q.isCorrect === true ? "text-emerald-400" : q.isCorrect === false ? "text-red-400" : "text-slate-500"}>
                      {q.isCorrect === true ? "✓" : q.isCorrect === false ? "✗" : "—"}
                    </span>
                    <div className="flex-1">
                      <p className="text-[14px] font-medium text-white">
                        {q.sequenceNumber + 1}. {lang === "ar" && q.questionTextAr ? q.questionTextAr : q.questionTextEn}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-600">
                        {[q.domain, q.approach, q.difficulty].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    {q.isFlagged && <span className="shrink-0 text-amber-400">★</span>}
                  </div>

                  {(q.interactionType === "standard" || q.interactionType === "graphic_based") && (
                    <div className="mt-3 ms-6 space-y-1.5">
                      {q.options.map((o) => {
                        const wasSelected = q.response?.selectedOptionIds?.includes(o.id);
                        return (
                          <p
                            key={o.id}
                            className={`text-[13px] ${o.isCorrect ? "text-emerald-400" : wasSelected ? "text-red-400" : "text-slate-500"}`}
                          >
                            {o.isCorrect ? "✓ " : wasSelected ? "✗ " : "  "}
                            {lang === "ar" && o.textAr ? o.textAr : o.textEn}
                          </p>
                        );
                      })}
                    </div>
                  )}

                  {q.interactionType === "matching" && (
                    <div className="mt-3 ms-6 space-y-1 text-[13px] text-slate-400">
                      {q.matchingLeft.map((left) => {
                        const correctRightId = q.matchingCorrectRightIdByLeft[left.id];
                        const correctRight = q.matchingRight.find((r) => r.id === correctRightId);
                        return (
                          <p key={left.id}>
                            {lang === "ar" && left.textAr ? left.textAr : left.textEn} →{" "}
                            <span className="text-emerald-400">{correctRight ? (lang === "ar" && correctRight.textAr ? correctRight.textAr : correctRight.textEn) : "?"}</span>
                          </p>
                        );
                      })}
                    </div>
                  )}

                  {q.interactionType === "drag_and_drop" && (
                    <ol className="mt-3 ms-6 list-decimal space-y-1 text-[13px] text-slate-400">
                      {[...q.dragDropItems]
                        .sort((a, b) => (a.correctPosition ?? 0) - (b.correctPosition ?? 0))
                        .map((item) => (
                          <li key={item.id}>{lang === "ar" && item.textAr ? item.textAr : item.textEn}</li>
                        ))}
                    </ol>
                  )}

                  {explanation && <p className="mt-3 ms-6 text-[13px] leading-relaxed text-slate-400">{explanation}</p>}
                </div>
              );
            })
          )}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/pmp/practice" className="btn-primary px-5 py-2.5 text-[13px]">
            New Practice Session
          </Link>
          <Link href="/pmp/practice/history" className="btn-ghost px-5 py-2.5 text-[13px]">
            View History
          </Link>
        </div>
      </div>
    </div>
  );
}
