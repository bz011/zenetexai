import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { getCoverageReport, type DimensionBreakdown } from "@/features/ai-generation/services/coverageIntelligenceService";

export const metadata: Metadata = { title: "Admin — Coverage Intelligence" };
export const dynamic = "force-dynamic";

function gapBadgeClass(gap: DimensionBreakdown["gap"]): string {
  if (gap === "under") return "bg-amber-500/[0.12] text-amber-400";
  if (gap === "over") return "bg-red-500/[0.12] text-red-400";
  return "bg-white/[0.07] text-slate-400";
}

function DimensionTable({ title, rows }: { title: string; rows: DimensionBreakdown[] }) {
  return (
    <div className="card mt-4 p-5">
      <p className="label">{title}</p>
      <div className="mt-3 space-y-1.5">
        {rows.map((r) => (
          <div key={r.value} className="flex items-center justify-between">
            <p className="text-[13px] text-white">{r.value}</p>
            <div className="flex items-center gap-3">
              <p className="text-[12px] text-slate-500">
                {r.count} question{r.count === 1 ? "" : "s"} · {r.actualPct}%{r.targetPct !== null ? ` (target ${r.targetPct}%)` : ""}
              </p>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${gapBadgeClass(r.gap)}`}>{r.gap}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function CoverageIntelligencePage() {
  await requireRole(["admin", "instructor"], { loginRedirectTo: "/admin/ai-generation/coverage" });

  const report = await getCoverageReport("PMP");

  return (
    <div className="relative min-h-screen px-6 py-24">
      <div className="container-page relative max-w-4xl">
        <Link href="/admin/ai-generation" className="text-[13px] text-slate-500 hover:text-slate-300 transition-colors">
          ← AI Generation
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-white">Coverage Intelligence</h1>
        <p className="mt-2 text-[13px] text-slate-500">
          How the {report.totalApproved} currently approved {report.certificationCode} questions are distributed vs. target
          coverage. This report only surfaces gaps as recommendations - it never generates or queues questions itself.
        </p>

        <div className="card mt-6 p-5">
          <p className="text-[13px] font-semibold text-white">Recommendations</p>
          {report.recommendations.length === 0 ? (
            <p className="mt-2 text-[13px] text-emerald-400">No significant coverage gaps detected.</p>
          ) : (
            <div className="mt-2 space-y-1.5">
              {report.recommendations.map((rec, i) => (
                <p key={i} className="text-[12px] text-amber-400">⚠ {rec}</p>
              ))}
            </div>
          )}
        </div>

        <DimensionTable title="Domain (PMI ECO target)" rows={report.domain} />
        <DimensionTable title="Approach (approximate target)" rows={report.approach} />
        <DimensionTable title="Difficulty (internal authoring target)" rows={report.difficulty} />
        <DimensionTable title="Interaction type (no fixed target - flags thin/zero coverage)" rows={report.interactionType} />
      </div>
    </div>
  );
}
