import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/requireRole";
import { findActiveMockExamAttemptId } from "@/features/mock-exam/services/examAttemptService";
import ExamStartPanel from "@/features/mock-exam/components/ExamStartPanel";

export const metadata: Metadata = { title: "PMP Mock Exam — ZENTEXAI" };
export const dynamic = "force-dynamic";

export default async function MockExamStartPage() {
  await requireUser({ loginRedirectTo: "/pmp/mock-exam" });
  const activeAttemptId = await findActiveMockExamAttemptId();

  return (
    <div className="academy-shell relative min-h-screen px-6 py-24">
      <div className="container-page relative max-w-2xl">
        <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-indigo-600">PMP</span>
        <h1 className="mt-3 text-2xl font-bold text-slate-900">Mock Exam</h1>
        <p className="mt-2 text-[14px] text-slate-500">A full-length, timed simulation of the PMP exam drawn from the approved question bank.</p>

        <div className="mt-8">
          <ExamStartPanel activeAttemptId={activeAttemptId} />
        </div>
      </div>
    </div>
  );
}
