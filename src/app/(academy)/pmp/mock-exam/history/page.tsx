import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/requireRole";
import { getMockExamHistory } from "@/features/mock-exam/services/examHistoryService";
import ExamHistoryContent from "@/features/mock-exam/components/ExamHistoryContent";

export const metadata: Metadata = { title: "Mock Exam History — ZENTEXAI" };
export const dynamic = "force-dynamic";

export default async function MockExamHistoryPage() {
  const { supabase, user } = await requireUser({ loginRedirectTo: "/pmp/mock-exam/history" });
  const { groups } = await getMockExamHistory(supabase, user.id);

  return <ExamHistoryContent groups={groups} />;
}
