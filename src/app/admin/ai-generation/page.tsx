import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";

export const metadata: Metadata = { title: "Admin — AI Question Generation" };
export const dynamic = "force-dynamic";

export default async function AIGenerationDashboardPage() {
  const { supabase } = await requireRole(["admin", "instructor"], { loginRedirectTo: "/admin/ai-generation" });

  const { data: batches } = await supabase
    .from("generation_batches")
    .select("id, status, requested_count, generated_count, passed_count, rejected_count, approved_count, created_by, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  const { data: reviewCounts } = await supabase.from("questions").select("status").eq("source", "AI Generated");
  const needsReviewCount = ((reviewCounts ?? []) as { status: string }[]).filter((r) => r.status === "needs_review").length;
  const approvedCount = ((reviewCounts ?? []) as { status: string }[]).filter((r) => r.status === "approved").length;

  return (
    <div className="relative min-h-screen px-6 py-24">
      <div className="container-page relative max-w-4xl">
        <span className="label">Admin</span>
        <h1 className="mt-3 text-2xl font-bold text-white">AI Question Generation</h1>
        <p className="mt-2 text-[13px] text-slate-500">
          Admin-only content production pipeline. Nothing here is visible to students until individually approved.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="card p-5">
            <p className="text-[12px] text-slate-500">Awaiting review</p>
            <p className="mt-1 text-2xl font-bold text-white">{needsReviewCount}</p>
          </div>
          <div className="card p-5">
            <p className="text-[12px] text-slate-500">Approved (AI-generated)</p>
            <p className="mt-1 text-2xl font-bold text-emerald-400">{approvedCount}</p>
          </div>
          <div className="card p-5">
            <p className="text-[12px] text-slate-500">Recent batches</p>
            <p className="mt-1 text-2xl font-bold text-white">{batches?.length ?? 0}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/admin/ai-generation/batches/new" className="btn-primary px-5 py-2.5 text-[13px]">
            Create generation batch
          </Link>
          <Link href="/admin/ai-generation/review" className="btn-ghost px-5 py-2.5 text-[13px]">
            Review queue ({needsReviewCount})
          </Link>
          <Link href="/admin/ai-generation/patterns" className="btn-ghost px-5 py-2.5 text-[13px]">
            Pattern library
          </Link>
        </div>

        <h2 className="mt-10 text-[15px] font-semibold text-white">Recent batches</h2>
        <div className="mt-4 space-y-2">
          {(batches ?? []).length === 0 && <p className="text-[13px] text-slate-500">No batches yet.</p>}
          {(batches ?? []).map((batch) => (
            <Link
              key={batch.id}
              href={`/admin/ai-generation/batches/${batch.id}`}
              className="card card-hover flex items-center justify-between px-5 py-4"
            >
              <div>
                <p className="text-[13px] font-medium text-white">{batch.id}</p>
                <p className="text-[12px] text-slate-500">
                  {batch.generated_count}/{batch.requested_count} generated · {batch.passed_count} passed · {batch.approved_count} approved · by {batch.created_by}
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                  batch.status === "completed"
                    ? "bg-emerald-500/[0.12] text-emerald-400"
                    : batch.status === "failed"
                      ? "bg-red-500/[0.12] text-red-400"
                      : "bg-white/[0.07] text-slate-400"
                }`}
              >
                {batch.status}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
