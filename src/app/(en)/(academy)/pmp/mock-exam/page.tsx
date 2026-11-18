import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/requireRole";
import { hasCapability } from "@/features/commerce/services/entitlementService";
import LockedAccess from "@/components/academy/LockedAccess";
import { findActiveMockExamAttemptId } from "@/features/mock-exam/services/examAttemptService";
import ExamStartPanel from "@/features/mock-exam/components/ExamStartPanel";
import SimulatorPageHeader from "@/components/academy/SimulatorPageHeader";

export const metadata: Metadata = { title: "PMP Mock Exam — ZENTEXAI", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function MockExamStartPage() {
  const { supabase, user } = await requireUser({ loginRedirectTo: "/pmp/mock-exam" });

  const entitled = await hasCapability(supabase, user.id, "mock_exam:pmp");
  if (!entitled) {
    return <LockedAccess variant="simulator" ctaHref="/courses/pmp-exam-simulator" />;
  }

  const activeAttemptId = await findActiveMockExamAttemptId();

  return (
    <div className="relative min-h-screen px-6 py-24">
      <div className="container-page relative max-w-2xl">
        <SimulatorPageHeader variant="mockExam" />

        <div className="mt-8">
          <ExamStartPanel activeAttemptId={activeAttemptId} />
        </div>
      </div>
    </div>
  );
}
