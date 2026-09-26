import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/requireRole";
import { hasCapability } from "@/features/commerce/services/entitlementService";
import LockedAccess from "@/components/academy/LockedAccess";
import { getPracticeSession } from "@/features/practice/services/practiceSessionService";
import PracticeRunner from "@/features/practice/components/PracticeRunner";

interface Props {
  params: Promise<{ sessionId: string }>;
}

export const metadata: Metadata = { title: "Practice Session — ZENTEXAI", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PracticeSessionPage({ params }: Props) {
  const { sessionId } = await params;
  const { supabase, user } = await requireUser({ loginRedirectTo: `/pmp/practice/${sessionId}` });

  const entitled = await hasCapability(supabase, user.id, "practice:pmp");
  if (!entitled) {
    return <LockedAccess variant="simulator" ctaHref="/courses/pmp-exam-simulator" />;
  }

  const data = await getPracticeSession(sessionId);
  if (!data) notFound();

  // getPracticeSession already auto-grades a timed session whose deadline
  // has passed, so by the time we get here a non-"active" status means the
  // session is genuinely done (completed, expired, or abandoned) - send the
  // student straight to results rather than rendering a runner for a
  // session that can no longer accept answers.
  if (data.session.status !== "active") {
    redirect(`/pmp/practice/${sessionId}/results`);
  }

  return <PracticeRunner sessionId={sessionId} initialData={data} />;
}
