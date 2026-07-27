import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/requireRole";
import { getPracticeHistory } from "@/features/practice/services/practiceHistoryService";
import PracticeHistoryContent from "./PracticeHistoryContent";

interface Props {
  searchParams: Promise<{ page?: string }>;
}

export const metadata: Metadata = { title: "Practice History — ZENTEXAI" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export default async function PracticeHistoryPage({ searchParams }: Props) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(0, Number(pageParam ?? 0) || 0);

  const { supabase, user } = await requireUser({ loginRedirectTo: "/pmp/practice/history" });
  const { entries, total } = await getPracticeHistory(supabase, user.id, page, PAGE_SIZE);

  return <PracticeHistoryContent entries={entries} total={total} page={page} pageSize={PAGE_SIZE} />;
}
