import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/requireRole";
import { getAssessmentById, isModuleQuizUnlocked } from "@/features/courses/services/courseService";
import { getQuizQuestions } from "@/features/courses/services/quizService";
import { hasCapability } from "@/features/commerce/services/entitlementService";
import LockedAccess from "@/components/academy/LockedAccess";
import QuizNotReady from "@/components/academy/QuizNotReady";
import QuizLocked from "@/components/academy/QuizLocked";
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

  // Module-quiz unlocking (Sprint 11): a module_assessment stays locked
  // until every published lesson in its module is completed. Lesson order
  // doesn't matter, only completeness. This is the UI half of the check —
  // the submit route independently re-verifies the same condition
  // server-side, so a direct URL visit or direct API call is blocked
  // either way, not just hidden here.
  if (assessment.module_id) {
    const unlocked = await isModuleQuizUnlocked(supabase, user.id, assessment.module_id);
    if (!unlocked) {
      return <QuizLocked courseSlug={courseSlug} />;
    }
  }

  const questions = await getQuizQuestions(supabase, assessmentId);

  // Defense-in-depth (see QuizNotReady's own comment): a published
  // assessment row with zero real questions must never be openable as a
  // live quiz - RLS already keeps an UNpublished one fully invisible, this
  // covers the "published before content was seeded" case.
  if (questions.length === 0) {
    return <QuizNotReady courseSlug={courseSlug} />;
  }

  return (
    <ModuleAssessmentContent courseSlug={courseSlug} assessment={assessment} questions={questions} />
  );
}
