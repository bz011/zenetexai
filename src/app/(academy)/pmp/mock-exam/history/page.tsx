import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/requireRole";
import { getMockExamHistory } from "@/features/mock-exam/services/examHistoryService";
import ExamHistoryContent from "@/features/mock-exam/components/ExamHistoryContent";

interface Props {
  searchParams: Promise<{ page?: string }>;
}

export const metadata: Metadata = { title: "Mock Exam History — ZENTEXAI" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export default async function MockExamHistoryPage({ searchParams }: Props) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(0, Number(pageParam ?? 0) || 0);

  const { supabase, user } = await requireUser({ loginRedirectTo: "/pmp/mock-exam/history" });
  const { entries, total } = await getMockExamHistory(supabase, user.id, page, PAGE_SIZE);

  return <ExamHistoryContent entries={entries} total={total} page={page} pageSize={PAGE_SIZE} />;
}
