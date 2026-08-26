"use client";

import type { AssessmentReviewFilter, AssessmentReviewListEntry } from "@/components/assessment/assessmentReviewTypes";
import type { Translations } from "@/lib/translations";

/**
 * Compact question grid + filter tabs with live counts (Sprint 9.1 item 5)
 * - deliberately NOT an expanded list of all 180 questions' full text/
 * explanations. Selecting a cell is the only way into the detail panel,
 * which fetches its content lazily (see ReviewDetailPanel.tsx).
 */

interface Props {
  list: AssessmentReviewListEntry[];
  filter: AssessmentReviewFilter;
  onFilterChange: (filter: AssessmentReviewFilter) => void;
  selectedQuestionId: string | null;
  onSelectQuestion: (questionId: string, sequenceNumber: number) => void;
  t: Translations["assessment"]["review"];
}

const FILTERS: AssessmentReviewFilter[] = ["all", "incorrect", "correct", "unanswered", "flagged"];

function matchesFilter(entry: AssessmentReviewListEntry, filter: AssessmentReviewFilter): boolean {
  switch (filter) {
    case "incorrect":
      return entry.isCorrect === false;
    case "correct":
      return entry.isCorrect === true;
    case "unanswered":
      return !entry.hasResponse;
    case "flagged":
      return entry.isFlagged;
    default:
      return true;
  }
}

export default function ReviewGrid({ list, filter, onFilterChange, selectedQuestionId, onSelectQuestion, t }: Props) {
  const filtered = list.filter((e) => matchesFilter(e, filter));

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const count = list.filter((e) => matchesFilter(e, f)).length;
          return (
            <button
              key={f}
              onClick={() => onFilterChange(f)}
              className={`rounded-lg border px-4 py-2 text-[13px] font-medium transition-colors ${
                filter === f ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
              }`}
            >
              {t[f]} ({count})
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-4 text-[13px] text-slate-500">{t.noQuestionsMatch}</p>
      ) : (
        <div className="mt-4 grid grid-cols-8 gap-1.5 sm:grid-cols-10 md:grid-cols-12">
          {filtered.map((e) => {
            const isSelected = e.questionId === selectedQuestionId;
            return (
              <button
                key={e.sequenceNumber}
                disabled={!e.questionId}
                onClick={() => e.questionId && onSelectQuestion(e.questionId, e.sequenceNumber)}
                aria-current={isSelected ? "true" : undefined}
                className={`relative flex h-9 w-9 items-center justify-center rounded-lg border text-[12px] font-semibold transition-colors ${
                  isSelected
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : e.isCorrect === true
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300"
                      : e.isCorrect === false
                        ? "border-red-200 bg-red-50 text-red-700 hover:border-red-300"
                        : "border-slate-200 bg-white text-slate-400 hover:border-slate-300"
                }`}
              >
                {e.sequenceNumber + 1}
                {e.isFlagged && <span className="absolute -right-1 -top-1 flex h-3 w-3 items-center justify-center rounded-full bg-amber-400 text-[7px] text-white">⚑</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
