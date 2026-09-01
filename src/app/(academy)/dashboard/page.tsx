import type { Metadata } from "next";
import { requireProfile } from "@/lib/auth/requireRole";
import { getResumePointer, getDashboardStats } from "@/features/courses/services/dashboardService";
import { getOwnedLearningResources } from "@/features/commerce/services/entitlementService";
import DashboardContent from "./DashboardContent";

export const metadata: Metadata = { title: "Dashboard — ZENTEXAI" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { supabase, user, profile } = await requireProfile({ loginRedirectTo: "/dashboard" });

  const [owned, resume, stats] = await Promise.all([
    getOwnedLearningResources(supabase, user.id),
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
      owned={owned}
      resume={resume}
      stats={stats}
    />
  );
}
