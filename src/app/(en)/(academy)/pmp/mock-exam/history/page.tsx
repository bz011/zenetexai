import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/requireRole";
import { hasCapability } from "@/features/commerce/services/entitlementService";
import LockedAccess from "@/components/academy/LockedAccess";
import { getMockExamHistory } from "@/features/mock-exam/services/examHistoryService";
import ExamHistoryContent from "@/features/mock-exam/components/ExamHistoryContent";

export const metadata: Metadata = { title: "Mock Exam History — ZENTEXAI", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function MockExamHistoryPage() {
  const { supabase, user } = await requireUser({ loginRedirectTo: "/pmp/mock-exam/history" });

  const entitled = await hasCapability(supabase, user.id, "mock_exam:pmp");
  if (!entitled) {
    return <LockedAccess variant="simulator" ctaHref="/courses/pmp-exam-simulator" />;
  }

  const { groups } = await getMockExamHistory(supabase, user.id);

  return <ExamHistoryContent groups={groups} />;
}
