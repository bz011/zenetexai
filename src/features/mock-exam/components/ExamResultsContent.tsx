"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useLang } from "@/lib/LanguageContext";
import { tf } from "@/lib/translations";
import AssessmentResultsView from "@/components/assessment/AssessmentResultsView";
import { getMockExamReviewQuestionDetail, retakeMockExamAttempt } from "@/features/mock-exam/services/examAttemptService";
import type { MockExamResultsSummary, MockExamRetakeComparison } from "@/features/mock-exam/types/mockExam";
import type { AssessmentReviewListEntry } from "@/components/assessment/assessmentReviewTypes";

interface Props {
  attemptId: string;
  summary: MockExamResultsSummary;
  reviewList: AssessmentReviewListEntry[];
  retakeComparison: MockExamRetakeComparison | null;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function ExamResultsContent({ attemptId, summary, reviewList, retakeComparison }: Props) {
  const router = useRouter();
  const { t } = useLang();
  const r = t.assessment.results;
  const h = t.assessment.history;
  const [retaking, startRetake] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const { attempt } = summary;

  function handleRetake() {
    setError(null);
    startRetake(async () => {
      const result = await retakeMockExamAttempt(attemptId);
      if (!result.success || !result.attemptId) {
        setError(result.error ?? "Failed to start retake");
        return;
      }
      router.push(`/pmp/mock-exam/${result.attemptId}`);
    });
  }

  return (
    <div className="academy-shell relative min-h-screen px-6 py-24">
      <Link href="/pmp/mock-exam/history" className="mx-auto block max-w-4xl text-[13px] text-slate-500 hover:text-slate-700 transition-colors">
        ← {r.viewHistory}
      </Link>

      {error && <p className="mx-auto mt-4 max-w-4xl rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">{error}</p>}

      {retakeComparison && (
        <div className="mx-auto mt-4 max-w-4xl rounded-xl border border-indigo-200 bg-indigo-50 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-indigo-700">{h.comparePerformance}</p>
          <div className="mt-2 flex flex-wrap gap-6 text-[13px] text-indigo-900">
            <span>
              {h.previousScore}: <strong>{retakeComparison.previousScore ?? 0}%</strong> → {h.currentScore}: <strong>{retakeComparison.currentScore ?? 0}%</strong>
            </span>
            <span>
              {retakeComparison.previousCorrectCount} → {retakeComparison.currentCorrectCount} {r.correct}
            </span>
          </div>
        </div>
      )}

      <AssessmentResultsView
        scorePct={attempt.score}
        scoreNote={attempt.status === "expired" ? r.timeExpired : undefined}
        correctCount={attempt.correctCount}
        incorrectCount={attempt.incorrectCount}
        unansweredCount={attempt.unansweredCount}
        totalTimeSpentLabel={formatDuration(summary.totalTimeSpentSeconds)}
        averageTimePerQuestionLabel={`${summary.averageTimePerQuestionSeconds}s`}
        flaggedCount={summary.flaggedCount}
        breakdowns={[
          { title: r.byDomain, entries: summary.byDomain },
          { title: r.byApproach, entries: summary.byApproach },
          { title: r.byDifficulty, entries: summary.byDifficulty },
          { title: r.byQuestionType, entries: summary.byQuestionType },
          { title: r.byTopic, entries: summary.byTopic },
        ]}
        reviewList={reviewList}
        fetchDetail={(questionId) => getMockExamReviewQuestionDetail(attemptId, questionId)}
        actions={
          <>
            <button
              onClick={handleRetake}
              disabled={retaking}
              className="rounded-lg border border-indigo-200 bg-white px-5 py-2.5 text-[13px] font-semibold text-indigo-700 transition-colors hover:bg-indigo-50 disabled:opacity-50"
            >
              {retaking ? "..." : r.retakeSameExam}
            </button>
            <Link href="/pmp/mock-exam" className="btn-primary px-5 py-2.5 text-[13px]">
              {r.startNewExam}
            </Link>
            <Link href="/pmp/mock-exam/history" className="px-2 py-2.5 text-[13px] font-medium text-indigo-600 hover:text-indigo-700">
              {r.viewHistory}
            </Link>
          </>
        }
      />
      <p className="mx-auto mt-2 max-w-4xl text-center text-[11px] text-slate-400">{tf(r.noPmiPassingScore, {})}</p>
    </div>
  );
}
