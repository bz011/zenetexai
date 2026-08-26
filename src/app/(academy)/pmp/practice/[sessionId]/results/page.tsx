import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/requireRole";
import { getPracticeResultsSummary, getPracticeReviewList } from "@/features/practice/services/practiceResultsService";
import PracticeResultsContent from "./PracticeResultsContent";

interface Props {
  params: Promise<{ sessionId: string }>;
}

export const metadata: Metadata = { title: "Practice Results — ZENTEXAI" };
export const dynamic = "force-dynamic";

export default async function PracticeResultsPage({ params }: Props) {
  const { sessionId } = await params;
  const { supabase, user } = await requireUser({ loginRedirectTo: `/pmp/practice/${sessionId}/results` });

  const summary = await getPracticeResultsSummary(supabase, sessionId, user.id);
  if (!summary) notFound();

  const reviewList = await getPracticeReviewList(supabase, sessionId, user.id);

  return <PracticeResultsContent sessionId={sessionId} summary={summary} reviewList={reviewList} />;
}
