import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/requireRole";
import { getQuizAttemptDetail } from "@/features/courses/services/quizHistoryService";
import AttemptDetailContent from "./AttemptDetailContent";

interface Props {
  params: Promise<{ courseSlug: string; assessmentId: string; attemptId: string }>;
}

export const metadata: Metadata = { title: "Quiz Attempt — ZENTEXAI Academy" };
export const dynamic = "force-dynamic";

export default async function QuizAttemptDetailPage({ params }: Props) {
  const { courseSlug, assessmentId, attemptId } = await params;
  const { supabase, user } = await requireUser({
    loginRedirectTo: `/courses/${courseSlug}/assessments/${assessmentId}/history/${attemptId}`,
  });

  const attempt = await getQuizAttemptDetail(supabase, user.id, attemptId);
  if (!attempt) notFound();

  return <AttemptDetailContent courseSlug={courseSlug} assessmentId={assessmentId} attempt={attempt} />;
}
