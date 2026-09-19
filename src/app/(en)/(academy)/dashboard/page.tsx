import type { Metadata } from "next";
import { requireProfile } from "@/lib/auth/requireRole";
import { getResumePointer, getDashboardStats } from "@/features/courses/services/dashboardService";
import { getOwnedLearningResources } from "@/features/commerce/services/entitlementService";
import { getCourseBySlug } from "@/features/courses/services/courseService";
import { getCourseCertificate } from "@/features/courses/services/certificateService";
import DashboardContent from "./DashboardContent";

export const metadata: Metadata = { title: "Dashboard — ZENTEXAI", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { supabase, user, profile } = await requireProfile({ loginRedirectTo: "/dashboard" });

  const [owned, resume, stats] = await Promise.all([
    getOwnedLearningResources(supabase, user.id),
    getResumePointer(supabase, user.id),
    getDashboardStats(supabase, user.id),
  ]);

  // Cheap existence check only (never re-runs eligibility here) - actual
  // issuance happens on the certificate page itself. `null` means "this
  // student has no PMP course entitlement at all", which the dashboard
  // uses to decide whether to render the certificate block at all.
  const hasCourse = owned.some((r) => r.capabilities.includes("course:pmp"));
  let certificateId: string | null | undefined = undefined; // undefined = no course entitlement, don't render anything
  if (hasCourse) {
    const course = await getCourseBySlug(supabase, "pmp");
    const certificate = course ? await getCourseCertificate(supabase, user.id, course.id) : null;
    certificateId = certificate?.id ?? null; // null = entitled but not yet issued
  }

  return (
    <DashboardContent
      profile={{
        firstName: profile?.first_name ?? null,
        lastName: profile?.last_name ?? null,
        email: profile?.email ?? user.email ?? "",
        role: profile?.role ?? "student",
      }}
      owned={owned}
      resume={resume}
      stats={stats}
      certificateId={certificateId}
    />
  );
}
