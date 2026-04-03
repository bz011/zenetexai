"use client";

import Link from "next/link";
import { useLang } from "@/lib/LanguageContext";

export default function ToolsContent() {
  const { t } = useLang();
  const tl = t.tools;
  const s = t.shared;

  // tools array uses a `description` field in translations (typed as ToolItem with desc, but stored as description)
  // We cast to any to safely access both shapes
  const toolsArr = tl.tools as unknown as Array<{
    title: string; category: string; icon: string;
    desc?: string; description?: string;
  }>;

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/[0.06] px-6 pb-24 pt-36">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/[0.08] blur-[120px]" />
        <div className="container-page relative text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-500/[0.2] bg-amber-500/[0.06] px-4 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-amber-400">
              {tl.hero_badge}
            </span>
          </div>
          <h1 className="text-4xl font-bold text-white md:text-5xl lg:text-6xl">{tl.hero_h1}</h1>
          <p className="mx-auto mt-5 max-w-lg text-[16px] leading-relaxed text-slate-400">{tl.hero_sub}</p>
        </div>
      </section>

      {/* Tools grid */}
      <section className="px-6 py-24">
        <div className="container-page">
          <div className="grid gap-6 md:grid-cols-2">
            {toolsArr.map((tool) => (
              <div key={tool.title} className="card p-8">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/[0.08] text-xl text-indigo-400">
                    {tool.icon}
                  </div>
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.04] px-3 py-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    <span className="text-[11px] text-slate-500">{s.coming_soon}</span>
                  </div>
                </div>
                <span className="label text-[10px]">{tool.category}</span>
                <h3 className="mt-2 text-lg font-semibold text-white">{tool.title}</h3>
                <p className="mt-2.5 text-[14px] leading-relaxed text-slate-400">
                  {tool.desc ?? tool.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Waitlist */}
      <section className="border-t border-white/[0.06] bg-white/[0.015] px-6 py-20 text-center">
        <div className="container-page">
          <span className="label">{tl.waitlist_eyebrow}</span>
          <h2 className="mt-3 text-2xl font-bold text-white md:text-3xl">{tl.waitlist_h2}</h2>
          <p className="mx-auto mt-3 max-w-md text-[15px] text-slate-400">{tl.waitlist_p}</p>
          <div className="mt-7 flex justify-center gap-3">
            <Link href="/contact" className="btn-primary">{tl.waitlist_btn}</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
