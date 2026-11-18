import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth/requireRole";
import { getCourseSlugForModule, getLessonById } from "@/features/courses/services/courseService";

interface Props {
  children: ReactNode;
  params: Promise<{ courseSlug: string; lessonId: string }>;
}

/**
 * Access gate for a lesson URL, run as the segment's LAYOUT so it completes
 * before the page's loading.tsx boundary starts streaming. That is what makes
 * the HTTP status real (audit F5 / F12): a signed-out visitor gets a 307 to
 * /login?redirectTo=<this lesson> (validated by resolveSafeRedirect after
 * login), and a lesson that does not exist, is hidden (unpublished), or does
 * not belong to the course in the URL gets a real 404 - not a 200 page that
 * merely says "not found".
 *
 *  - Hidden lessons: students cannot read unpublished lessons at all (RLS,
 *    migration 006); admins and instructors can, for previewing, as before.
 *  - Course membership: the page checks access against `course:<courseSlug>`
 *    from the URL, so the lesson must belong to that course.
 * The page keeps its own requireUser() and entitlement check; this only adds
 * the gate in front of it.
 */
export default async function LessonAccessLayout({ children, params }: Props) {
  const { courseSlug, lessonId } = await params;
  const { supabase, profile } = await requireProfile({ loginRedirectTo: `/courses/${courseSlug}/lessons/${lessonId}` });

  const lesson = await getLessonById(supabase, lessonId);
  if (!lesson) notFound();
  const canPreviewHidden = profile?.role === "admin" || profile?.role === "instructor";
  if (!lesson.is_published && !canPreviewHidden) notFound();
  if ((await getCourseSlugForModule(supabase, lesson.module_id)) !== courseSlug) notFound();

  return children;
}
