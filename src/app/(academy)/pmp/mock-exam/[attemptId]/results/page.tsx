import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/requireRole";
import { getMockExamResultsSummary, getMockExamReviewQuestions } from "@/features/mock-exam/services/examResultsService";
import ExamResultsContent from "@/features/mock-exam/components/ExamResultsContent";
import type { MockExamReviewFilter } from "@/features/mock-exam/types/mockExam";

interface Props {
  params: Promise<{ attemptId: string }>;
  searchParams: Promise<{ filter?: string }>;
}

export const metadata: Metadata = { title: "Mock Exam Results — ZENTEXAI" };
export const dynamic = "force-dynamic";

const VALID_FILTERS: MockExamReviewFilter[] = ["all", "incorrect", "unanswered", "correct", "flagged"];

export default async function MockExamResultsPage({ params, searchParams }: Props) {
  const { attemptId } = await params;
  const { filter } = await searchParams;
  const { supabase, user } = await requireUser({ loginRedirectTo: `/pmp/mock-exam/${attemptId}/results` });

  const activeFilter: MockExamReviewFilter = VALID_FILTERS.includes(filter as MockExamReviewFilter) ? (filter as MockExamReviewFilter) : "all";

  const summary = await getMockExamResultsSummary(supabase, attemptId, user.id);
  if (!summary) notFound();

  const reviewQuestions = await getMockExamReviewQuestions(supabase, attemptId, user.id, activeFilter);

  return <ExamResultsContent attemptId={attemptId} summary={summary} reviewQuestions={reviewQuestions} currentFilter={activeFilter} />;
}
