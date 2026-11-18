import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/requireRole";
import { getAssessmentById, getCourseSlugForModule } from "@/features/courses/services/courseService";

interface Props {
  children: ReactNode;
  params: Promise<{ courseSlug: string; assessmentId: string }>;
}

/**
 * Access gate for a module-quiz URL, run as the segment's LAYOUT so it
 * completes before the page's loading.tsx boundary streams: a signed-out
 * visitor gets a real 307 to login (destination kept), and a quiz that does
 * not exist, is unpublished, is not a module assessment, or belongs to another
 * course than the one in the URL gets a real 404 (audit F5 / F12). The page
 * keeps its own requireUser(), entitlement and unlock checks.
 */
export default async function AssessmentAccessLayout({ children, params }: Props) {
  const { courseSlug, assessmentId } = await params;
  const { supabase } = await requireUser({ loginRedirectTo: `/courses/${courseSlug}/assessments/${assessmentId}` });

  const assessment = await getAssessmentById(supabase, assessmentId);
  if (!assessment || assessment.type !== "module_assessment" || !assessment.is_published || !assessment.module_id) notFound();
  if ((await getCourseSlugForModule(supabase, assessment.module_id)) !== courseSlug) notFound();

  return children;
}
