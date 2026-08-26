"use client";

import Link from "next/link";
import { useLang } from "@/lib/LanguageContext";

export default function AdminContent({ firstName }: { firstName: string | null }) {
  const { t } = useLang();
  const a = t.auth.admin;

  return (
    <div className="relative min-h-screen px-6 py-24">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[350px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/[0.08] blur-[100px]" />

      <div className="container-page relative max-w-2xl">
        <div className="card p-8">
          <span className="label">Admin</span>
          <h1 className="mt-3 text-2xl font-bold text-white">
            {a.title}{firstName ? ` — ${firstName}` : ""}
          </h1>
          <p className="mt-6 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-[13px] leading-relaxed text-slate-400">
            {a.placeholder_note}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/admin/courses" className="btn-primary inline-flex px-5 py-2.5 text-[13px]">
              Manage Courses
            </Link>
            <Link href="/admin/content-diagnostics" className="btn-secondary inline-flex px-5 py-2.5 text-[13px]">
              Content Diagnostics
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
