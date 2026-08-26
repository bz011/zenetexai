import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/requireRole";
import { getPublishedCourses } from "@/features/courses/services/courseService";
import CoursesContent from "./CoursesContent";

export const metadata: Metadata = { title: "Courses — ZENTEXAI Academy" };
export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  const { supabase } = await requireUser({ loginRedirectTo: "/courses" });
  const courses = await getPublishedCourses(supabase);

  return <CoursesContent courses={courses} />;
}
