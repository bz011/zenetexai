"use client";

import { useState, type ReactNode } from "react";
import { useLang } from "@/lib/LanguageContext";
import BreakdownList from "@/components/assessment/BreakdownList";
import ReviewGrid from "@/components/assessment/ReviewGrid";
import ReviewDetailPanel from "@/components/assessment/ReviewDetailPanel";
import type { AssessmentReviewFilter, AssessmentReviewListEntry, AssessmentReviewQuestionDetail } from "@/components/assessment/assessmentReviewTypes";

/**
 * Shared results/review dashboard for BOTH Mock Exam and Practice (Sprint
 * 9.1 item 5 - "apply the same UX principle to Practice Results... use the
 * same professional review language and interaction model", one component,
 * not two parallel implementations). Renders: a lightweight summary +
 * breakdowns (already cheap, no answer-key join), then a compact
 * question grid with filter counts, then a lazily-fetched single-question
 * detail panel with Previous/Next navigation scoped to the current filter.
 */

interface Props {
  scorePct: number | null;
  scoreNote?: string;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  totalTimeSpentLabel: string;
  averageTimePerQuestionLabel: string;
  flaggedCount: number;
  breakdowns: { title: string; entries: { label: string; total: number; correct: number }[] }[];
  reviewList: AssessmentReviewListEntry[];
  fetchDetail: (questionId: string) => Promise<AssessmentReviewQuestionDetail | null>;
  actions: ReactNode;
}

export default function AssessmentResultsView({
  scorePct,
  scoreNote,
  correctCount,
  incorrectCount,
  unansweredCount,
  totalTimeSpentLabel,
  averageTimePerQuestionLabel,
  flaggedCount,
  breakdowns,
  reviewList,
  fetchDetail,
  actions,
}: Props) {
  const { t, lang } = useLang();
  const r = t.assessment.results;
  const rv = t.assessment.review;

  const [filter, setFilter] = useState<AssessmentReviewFilter>("all");
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AssessmentReviewQuestionDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  function matchesFilter(entry: AssessmentReviewListEntry): boolean {
    if (filter === "incorrect") return entry.isCorrect === false;
    if (filter === "correct") return entry.isCorrect === true;
    if (filter === "unanswered") return !entry.hasResponse;
    if (filter === "flagged") return entry.isFlagged;
    return true;
  }

  async function selectQuestion(questionId: string) {
    setSelectedQuestionId(questionId);
    setLoadingDetail(true);
    const result = await fetchDetail(questionId);
    setDetail(result);
    setLoadingDetail(false);
  }

  function navigateWithinFilter(direction: 1 | -1) {
    const filteredIds = reviewList.filter(matchesFilter).map((e) => e.questionId);
    const currentPos = filteredIds.indexOf(selectedQuestionId);
    if (currentPos === -1) return;
    const nextPos = currentPos + direction;
    const nextId = filteredIds[nextPos];
    if (nextId) void selectQuestion(nextId);
  }

  const filteredIds = reviewList.filter(matchesFilter).map((e) => e.questionId);
  const currentPos = filteredIds.indexOf(selectedQuestionId);

  return (
    <div className="container-page relative max-w-4xl">
      <div className="mt-4 text-center">
        {scorePct !== null && <p className="text-4xl font-bold text-slate-900">{scorePct}%</p>}
        <p className="mt-2 text-[13px] text-slate-500">
          {correctCount} {r.correct} · {incorrectCount} {r.incorrect} · {unansweredCount} {r.unanswered}
          {scoreNote ? ` · ${scoreNote}` : ""}
        </p>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 text-center">
          <p className="text-[12px] text-slate-500">{r.timeSpent}</p>
          <p className="mt-1 text-lg font-bold text-slate-900">{totalTimeSpentLabel}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 text-center">
          <p className="text-[12px] text-slate-500">{r.avgPerQuestion}</p>
          <p className="mt-1 text-lg font-bold text-slate-900">{averageTimePerQuestionLabel}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 text-center">
          <p className="text-[12px] text-slate-500">{r.flaggedCount}</p>
          <p className="mt-1 text-lg font-bold text-slate-900">{flaggedCount}</p>
        </div>
      </div>

      {breakdowns.length > 0 && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {breakdowns.map((b) => (
            <BreakdownList key={b.title} title={b.title} entries={b.entries} />
          ))}
        </div>
      )}

      <div className="mt-10">
        {selectedQuestionId ? (
          <ReviewDetailPanel
            detail={detail}
            loading={loadingDetail}
            lang={lang}
            hasPrev={currentPos > 0}
            hasNext={currentPos >= 0 && currentPos < filteredIds.length - 1}
            onPrev={() => navigateWithinFilter(-1)}
            onNext={() => navigateWithinFilter(1)}
            onBack={() => setSelectedQuestionId(null)}
            t={rv}
          />
        ) : (
          <ReviewGrid list={reviewList} filter={filter} onFilterChange={setFilter} selectedQuestionId={selectedQuestionId} onSelectQuestion={(id) => void selectQuestion(id)} t={rv} />
        )}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">{actions}</div>
    </div>
  );
}
