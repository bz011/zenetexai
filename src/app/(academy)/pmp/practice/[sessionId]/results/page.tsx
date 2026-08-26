import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/requireRole";
import { getPracticeResultsSummary, getPracticeReviewQuestions } from "@/features/practice/services/practiceResultsService";
import PracticeResultsContent from "./PracticeResultsContent";
import type { ReviewFilter } from "@/features/practice/types/practice";

interface Props {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ filter?: string }>;
}

export const metadata: Metadata = { title: "Practice Results — ZENTEXAI" };
export const dynamic = "force-dynamic";

const VALID_FILTERS: ReviewFilter[] = ["all", "incorrect", "unanswered", "correct", "flagged"];

export default async function PracticeResultsPage({ params, searchParams }: Props) {
  const { sessionId } = await params;
  const { filter } = await searchParams;
  const { supabase, user } = await requireUser({ loginRedirectTo: `/pmp/practice/${sessionId}/results` });

  const activeFilter: ReviewFilter = VALID_FILTERS.includes(filter as ReviewFilter) ? (filter as ReviewFilter) : "all";

  const summary = await getPracticeResultsSummary(supabase, sessionId, user.id);
  if (!summary) notFound();

  const reviewQuestions = await getPracticeReviewQuestions(supabase, sessionId, user.id, activeFilter);

  return <PracticeResultsContent sessionId={sessionId} summary={summary} reviewQuestions={reviewQuestions} currentFilter={activeFilter} />;
}
