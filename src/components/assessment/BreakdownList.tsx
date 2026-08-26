"use client";

interface Props {
  title: string;
  entries: { label: string; total: number; correct: number }[];
}

export default function BreakdownList({ title, entries }: Props) {
  if (entries.length === 0) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{title}</p>
      <div className="space-y-2">
        {entries.map((e) => {
          const pct = e.total > 0 ? Math.round((e.correct / e.total) * 100) : 0;
          return (
            <div key={e.label} className="flex items-center justify-between gap-3 text-[13px]">
              <span className="text-slate-500">{e.label}</span>
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                  <span className={`block h-full rounded-full ${pct >= 70 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${pct}%` }} />
                </span>
                <span className="w-14 text-right text-slate-900">
                  {e.correct}/{e.total}
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
