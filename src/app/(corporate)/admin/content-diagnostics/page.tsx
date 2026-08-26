import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/requireRole";
import { getBrokenImageQuestions, getRecentMockExamBlueprintDiagnostics } from "@/features/mock-exam/services/examDiagnosticsService";

export const metadata: Metadata = { title: "Content Diagnostics — ZENTEXAI Admin" };
export const dynamic = "force-dynamic";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

export default async function ContentDiagnosticsPage() {
  const { supabase } = await requireAdmin({ loginRedirectTo: "/admin/content-diagnostics" });

  const [brokenImages, blueprintDiagnostics] = await Promise.all([
    getBrokenImageQuestions(supabase),
    getRecentMockExamBlueprintDiagnostics(supabase),
  ]);

  const withFallback = blueprintDiagnostics.filter((d) => d.hadFallback);
  const overOverlapTarget = blueprintDiagnostics.filter(
    (d) => d.previousAttemptOverlapCount !== null && d.previousAttemptOverlapTarget !== null && d.previousAttemptOverlapCount > d.previousAttemptOverlapTarget
  );

  return (
    <div className="relative min-h-screen px-6 py-24">
      <div className="container-page relative max-w-5xl">
        <span className="label">Admin</span>
        <h1 className="mt-3 text-2xl font-bold text-white">Content &amp; Mock Exam Diagnostics</h1>
        <p className="mt-2 text-[14px] text-slate-400">
          Internal-only visibility into content gaps and blueprint fallback behavior (Sprint 9.1 item 8) - never shown to students.
        </p>

        <section className="mt-10">
          <p className="label">Questions Excluded for Missing/Broken Images ({brokenImages.length})</p>
          <p className="mt-1 text-[13px] text-slate-500">
            graphic_based questions currently flagged by scripts/content/verifyQuestionImages.ts - excluded from Practice and Mock Exam selection until re-verified as fixed.
          </p>
          <div className="mt-4 space-y-2">
            {brokenImages.length === 0 ? (
              <p className="card p-5 text-[13px] text-slate-500">None currently flagged.</p>
            ) : (
              brokenImages.map((q) => (
                <div key={q.questionId} className="card flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="text-[13px] font-medium text-white">{q.questionId}</p>
                    <p className="mt-0.5 max-w-xl truncate text-[12px] text-slate-500">{q.questionTextEn}</p>
                  </div>
                  <div className="text-right text-[12px] text-slate-500">
                    <p>{q.status}</p>
                    {q.imageVerifiedAt && <p>Checked {formatDate(q.imageVerifiedAt)}</p>}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="mt-10">
          <p className="label">Mock Exam Attempts With a Blueprint Fallback ({withFallback.length} of last {blueprintDiagnostics.length})</p>
          <p className="mt-1 text-[13px] text-slate-500">
            An attempt appears here when the inventory-aware fallback engine had to borrow across approach/difficulty/domain, or top up from any remaining inventory, to reach 180 questions.
          </p>
          <div className="mt-4 space-y-2">
            {withFallback.length === 0 ? (
              <p className="card p-5 text-[13px] text-slate-500">No fallback observed in the last {blueprintDiagnostics.length} attempts.</p>
            ) : (
              withFallback.map((d) => (
                <div key={d.attemptId} className="card p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-[13px] font-medium text-white">
                      {d.attemptId} · {formatDate(d.startedAt)} · {d.status}
                    </p>
                    <p className="text-[12px] text-slate-500">{d.blueprintVersion}</p>
                  </div>
                  {d.topUpCount > 0 && <p className="mt-1 text-[12px] text-amber-400">{d.topUpCount} question(s) required a last-resort top-up.</p>}
                  {d.fallbackLogSample.length > 0 && (
                    <ul className="mt-2 list-disc space-y-0.5 ps-5 text-[12px] text-slate-500">
                      {d.fallbackLogSample.map((line, i) => (
                        <li key={i}>{line}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        <section className="mt-10">
          <p className="label">Attempts Exceeding the 40-Question Previous-Attempt Overlap Target ({overOverlapTarget.length})</p>
          <p className="mt-1 text-[13px] text-slate-500">
            The overlap cap is a best-effort target (see blueprintEngine.ts) - inventory that's too thin can force it higher. Every attempt records its actual overlap regardless.
          </p>
          <div className="mt-4 space-y-2">
            {overOverlapTarget.length === 0 ? (
              <p className="card p-5 text-[13px] text-slate-500">None in the last {blueprintDiagnostics.length} attempts.</p>
            ) : (
              overOverlapTarget.map((d) => (
                <div key={d.attemptId} className="card flex flex-wrap items-center justify-between gap-3 p-4">
                  <p className="text-[13px] font-medium text-white">
                    {d.attemptId} · {formatDate(d.startedAt)}
                  </p>
                  <p className="text-[12px] text-red-400">
                    {d.previousAttemptOverlapCount} / {d.previousAttemptOverlapTarget} target
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
