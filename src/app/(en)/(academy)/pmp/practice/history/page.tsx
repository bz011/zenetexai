import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/requireRole";
import { hasCapability } from "@/features/commerce/services/entitlementService";
import LockedAccess from "@/components/academy/LockedAccess";
import { getPracticeHistory } from "@/features/practice/services/practiceHistoryService";
import PracticeHistoryContent from "./PracticeHistoryContent";

interface Props {
  searchParams: Promise<{ page?: string }>;
}

export const metadata: Metadata = { title: "Practice History — ZENTEXAI", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export default async function PracticeHistoryPage({ searchParams }: Props) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(0, Number(pageParam ?? 0) || 0);

  const { supabase, user } = await requireUser({ loginRedirectTo: "/pmp/practice/history" });

  const entitled = await hasCapability(supabase, user.id, "practice:pmp");
  if (!entitled) {
    return <LockedAccess variant="simulator" ctaHref="/courses/pmp-exam-simulator" />;
  }

  const { entries, total } = await getPracticeHistory(supabase, user.id, page, PAGE_SIZE);

  return <PracticeHistoryContent entries={entries} total={total} page={page} pageSize={PAGE_SIZE} />;
}
