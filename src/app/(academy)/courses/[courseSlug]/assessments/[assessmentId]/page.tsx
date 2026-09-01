import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/requireRole";
import { getAssessmentById } from "@/features/courses/services/courseService";
import { getQuizQuestions } from "@/features/courses/services/quizService";
import { hasCapability } from "@/features/commerce/services/entitlementService";
import LockedAccess from "@/components/academy/LockedAccess";
import ModuleAssessmentContent from "./ModuleAssessmentContent";

interface Props {
  params: Promise<{ courseSlug: string; assessmentId: string }>;
}

export const metadata: Metadata = { title: "Module Assessment — ZENTEXAI Academy" };
export const dynamic = "force-dynamic";

export default async function ModuleAssessmentPage({ params }: Props) {
  const { courseSlug, assessmentId } = await params;
  const { supabase, user } = await requireUser({
    loginRedirectTo: `/courses/${courseSlug}/assessments/${assessmentId}`,
  });

  const assessment = await getAssessmentById(supabase, assessmentId);
  if (!assessment || assessment.type !== "module_assessment") notFound();

  const entitled = await hasCapability(supabase, user.id, `course:${courseSlug}`);
  if (!entitled) {
    return <LockedAccess variant="course" ctaHref="/courses/pmp-mastery-program" />;
  }

  const questions = await getQuizQuestions(supabase, assessmentId);

  return (
    <ModuleAssessmentContent courseSlug={courseSlug} assessment={assessment} questions={questions} />
  );
}
