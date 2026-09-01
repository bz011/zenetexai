import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/requireRole";
import { hasCapability } from "@/features/commerce/services/entitlementService";
import LockedAccess from "@/components/academy/LockedAccess";
import { getMockExamResultsSummary, getMockExamReviewList, getMockExamRetakeComparison } from "@/features/mock-exam/services/examResultsService";
import ExamResultsContent from "@/features/mock-exam/components/ExamResultsContent";

interface Props {
  params: Promise<{ attemptId: string }>;
}

export const metadata: Metadata = { title: "Mock Exam Results — ZENTEXAI" };
export const dynamic = "force-dynamic";

export default async function MockExamResultsPage({ params }: Props) {
  const { attemptId } = await params;
  const { supabase, user } = await requireUser({ loginRedirectTo: `/pmp/mock-exam/${attemptId}/results` });

  const entitled = await hasCapability(supabase, user.id, "mock_exam:pmp");
  if (!entitled) {
    return <LockedAccess variant="simulator" ctaHref="/courses/pmp-exam-simulator" />;
  }

  const summary = await getMockExamResultsSummary(supabase, attemptId, user.id);
  if (!summary) notFound();

  const [reviewList, retakeComparison] = await Promise.all([
    getMockExamReviewList(supabase, attemptId, user.id),
    getMockExamRetakeComparison(supabase, attemptId, user.id),
  ]);

  return <ExamResultsContent attemptId={attemptId} summary={summary} reviewList={reviewList} retakeComparison={retakeComparison} />;
}
