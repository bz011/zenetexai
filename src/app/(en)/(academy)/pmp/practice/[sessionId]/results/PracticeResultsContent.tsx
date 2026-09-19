"use client";

import Link from "next/link";
import { useLang } from "@/lib/LanguageContext";
import AssessmentResultsView from "@/components/assessment/AssessmentResultsView";
import { getPracticeReviewQuestionDetail } from "@/features/practice/services/practiceSessionService";
import type { PracticeResultsSummary } from "@/features/practice/types/practice";
import type { AssessmentReviewListEntry } from "@/components/assessment/assessmentReviewTypes";

interface Props {
  sessionId: string;
  summary: PracticeResultsSummary;
  reviewList: AssessmentReviewListEntry[];
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

export default function PracticeResultsContent({ sessionId, summary, reviewList }: Props) {
  const { t } = useLang();
  const r = t.assessment.results;
  const { session } = summary;

  return (
    <div className="academy-shell relative min-h-screen px-6 py-24">
      <Link href="/pmp/practice/history" className="mx-auto block max-w-4xl text-[13px] text-slate-500 hover:text-slate-700 transition-colors">
        ← {r.viewHistory}
      </Link>

      <AssessmentResultsView
        scorePct={session.score}
        correctCount={session.correctCount}
        incorrectCount={session.incorrectCount}
        unansweredCount={session.unansweredCount}
        totalTimeSpentLabel={formatDuration(summary.totalTimeSpentSeconds)}
        averageTimePerQuestionLabel={formatDuration(summary.averageTimePerQuestionSeconds)}
        flaggedCount={summary.flaggedCount}
        breakdowns={[
          { title: r.byDomain, entries: summary.byDomain },
          { title: r.byApproach, entries: summary.byApproach },
          { title: r.byDifficulty, entries: summary.byDifficulty },
          { title: r.byQuestionType, entries: summary.byQuestionType },
        ]}
        reviewList={reviewList}
        fetchDetail={(questionId) => getPracticeReviewQuestionDetail(sessionId, questionId)}
        actions={
          <>
            <Link href="/pmp/practice" className="btn-primary px-5 py-2.5 text-[13px]">
              {r.newPractice}
            </Link>
            <Link href="/pmp/practice/history" className="px-2 py-2.5 text-[13px] font-medium text-indigo-600 hover:text-indigo-700">
              {r.viewHistory}
            </Link>
          </>
        }
      />
    </div>
  );
}
