import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/requireRole";
import { getCourseBySlug, getCourseWithProgress } from "@/features/courses/services/courseService";
import CourseDetailContent from "./CourseDetailContent";

interface Props {
  params: Promise<{ courseSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { courseSlug } = await params;
  return { title: `${courseSlug} — ZENTEXAI Academy` };
}

export const dynamic = "force-dynamic";

export default async function CourseDetailPage({ params }: Props) {
  const { courseSlug } = await params;
  const { supabase, user } = await requireUser({ loginRedirectTo: `/courses/${courseSlug}` });

  const course = await getCourseBySlug(supabase, courseSlug);
  if (!course) notFound();

  const courseWithProgress = await getCourseWithProgress(supabase, course, user.id);

  return <CourseDetailContent course={courseWithProgress} />;
}
