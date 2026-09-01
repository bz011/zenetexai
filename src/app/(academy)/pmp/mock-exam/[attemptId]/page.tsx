import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/requireRole";
import { hasCapability } from "@/features/commerce/services/entitlementService";
import LockedAccess from "@/components/academy/LockedAccess";
import { getMockExamAttempt } from "@/features/mock-exam/services/examAttemptService";
import ExamRunner from "@/features/mock-exam/components/ExamRunner";

interface Props {
  params: Promise<{ attemptId: string }>;
}

export const metadata: Metadata = { title: "PMP Mock Exam — ZENTEXAI" };
export const dynamic = "force-dynamic";

export default async function MockExamAttemptPage({ params }: Props) {
  const { attemptId } = await params;
  const { supabase, user } = await requireUser({ loginRedirectTo: `/pmp/mock-exam/${attemptId}` });

  const entitled = await hasCapability(supabase, user.id, "mock_exam:pmp");
  if (!entitled) {
    return <LockedAccess variant="simulator" ctaHref="/courses/pmp-exam-simulator" />;
  }

  const data = await getMockExamAttempt(attemptId);
  if (!data) notFound();

  // getMockExamAttempt already auto-submits an attempt whose deadline has
  // passed (break-aware), so a non-active/on_break status here means the
  // attempt is genuinely done - send the student to results instead of
  // rendering a runner that can no longer accept answers.
  if (data.attempt.status !== "active" && data.attempt.status !== "on_break") {
    redirect(`/pmp/mock-exam/${attemptId}/results`);
  }

  return <ExamRunner attemptId={attemptId} initialData={data} />;
}
