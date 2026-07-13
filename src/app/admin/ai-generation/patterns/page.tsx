import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";

export const metadata: Metadata = { title: "Admin — Pattern Library" };
export const dynamic = "force-dynamic";

export default async function PatternLibraryPage() {
  const { supabase } = await requireRole(["admin", "instructor"], { loginRedirectTo: "/admin/ai-generation/patterns" });

  const { data: patterns } = await supabase
    .from("question_patterns")
    .select(
      "id, domain, task, topic, approach, difficulty, interaction_type, answer_type, status, times_used, questions_generated, questions_approved, questions_rejected, avg_quality_score, source_question_ids"
    )
    .order("times_used", { ascending: false });

  return (
    <div className="relative min-h-screen px-6 py-24">
      <div className="container-page relative max-w-4xl">
        <Link href="/admin/ai-generation" className="text-[13px] text-slate-500 hover:text-slate-300 transition-colors">
          ← AI Generation
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-white">Pattern Library</h1>
        <p className="mt-2 text-[13px] text-slate-500">
          Abstracted reasoning patterns used to generate new questions. Never contains verbatim source-question
          text - only structure/decision/principle descriptions and pointers to source_question_ids.
        </p>

        <div className="mt-6 space-y-2">
          {(patterns ?? []).length === 0 && <p className="text-[13px] text-slate-500">No patterns yet.</p>}
          {(patterns ?? []).map((p) => (
            <div key={p.id} className="card p-5">
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-medium text-white">
                  {p.domain} / {p.task} / {p.topic} — {p.interaction_type} / {p.answer_type}
                </p>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                    p.status === "active" ? "bg-emerald-500/[0.12] text-emerald-400" : "bg-white/[0.07] text-slate-400"
                  }`}
                >
                  {p.status}
                </span>
              </div>
              <p className="mt-2 text-[12px] text-slate-500">
                Approach: {p.approach ?? "-"} · Difficulty: {p.difficulty ?? "-"} · Used {p.times_used}x · Generated {p.questions_generated} ·
                Approved {p.questions_approved} · Rejected {p.questions_rejected}
                {p.avg_quality_score ? ` · Avg score ${p.avg_quality_score}` : ""}
              </p>
              <p className="mt-1 text-[11px] text-slate-600">Source questions: {p.source_question_ids.join(", ")}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
