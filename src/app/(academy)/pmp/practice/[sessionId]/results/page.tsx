import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/requireRole";
import { hasCapability } from "@/features/commerce/services/entitlementService";
import LockedAccess from "@/components/academy/LockedAccess";
import { getPracticeResultsSummary, getPracticeReviewList } from "@/features/practice/services/practiceResultsService";
import PracticeResultsContent from "./PracticeResultsContent";

interface Props {
  params: Promise<{ sessionId: string }>;
}

export const metadata: Metadata = { title: "Practice Results — ZENTEXAI", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PracticeResultsPage({ params }: Props) {
  const { sessionId } = await params;
  const { supabase, user } = await requireUser({ loginRedirectTo: `/pmp/practice/${sessionId}/results` });

  const entitled = await hasCapability(supabase, user.id, "practice:pmp");
  if (!entitled) {
    return <LockedAccess variant="simulator" ctaHref="/courses/pmp-exam-simulator" />;
  }

  const summary = await getPracticeResultsSummary(supabase, sessionId, user.id);
  if (!summary) notFound();

  const reviewList = await getPracticeReviewList(supabase, sessionId, user.id);

  return <PracticeResultsContent sessionId={sessionId} summary={summary} reviewList={reviewList} />;
}
