import type { Metadata } from "next";
import { requireProfile } from "@/lib/auth/requireRole";
import { getPublishedCourses } from "@/features/courses/services/courseService";
import { getResumePointer, getDashboardStats } from "@/features/courses/services/dashboardService";
import DashboardContent from "./DashboardContent";

export const metadata: Metadata = { title: "Dashboard — ZENTEXAI" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { supabase, user, profile } = await requireProfile({ loginRedirectTo: "/dashboard" });

  const [courses, resume, stats] = await Promise.all([
    getPublishedCourses(supabase),
    getResumePointer(supabase, user.id),
    getDashboardStats(supabase, user.id),
  ]);

  return (
    <DashboardContent
      profile={{
        firstName: profile?.first_name ?? null,
        lastName: profile?.last_name ?? null,
        email: profile?.email ?? user.email ?? "",
        role: profile?.role ?? "student",
      }}
      courses={courses}
      resume={resume}
      stats={stats}
    />
  );
}
