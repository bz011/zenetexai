import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/requireRole";
import { getAssessmentById } from "@/features/courses/services/courseService";
import { getQuizAttempts } from "@/features/courses/services/quizHistoryService";
import { notFound } from "next/navigation";
import HistoryListContent from "./HistoryListContent";

interface Props {
  params: Promise<{ courseSlug: string; assessmentId: string }>;
}

export const metadata: Metadata = { title: "Quiz History — ZENTEXAI Academy" };
export const dynamic = "force-dynamic";

export default async function QuizHistoryPage({ params }: Props) {
  const { courseSlug, assessmentId } = await params;
  const { supabase, user } = await requireUser({
    loginRedirectTo: `/courses/${courseSlug}/assessments/${assessmentId}/history`,
  });

  const assessment = await getAssessmentById(supabase, assessmentId);
  if (!assessment) notFound();

  const attempts = await getQuizAttempts(supabase, user.id, assessmentId);

  return <HistoryListContent courseSlug={courseSlug} assessment={assessment} attempts={attempts} />;
}
