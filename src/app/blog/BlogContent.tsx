"use client";

import { useLang } from "@/lib/LanguageContext";

// Tag → color map keyed by stable ID, not display string
const tagColors: Record<string, string> = {
  ai:       "bg-indigo-500/[0.12] text-indigo-400",
  academy:  "bg-violet-500/[0.12] text-violet-400",
  tools:    "bg-emerald-500/[0.12] text-emerald-400",
  services: "bg-blue-500/[0.12] text-blue-400",
  skills:   "bg-purple-500/[0.12] text-purple-400",
};

export default function BlogContent() {
  const { t } = useLang();
  const bl = t.blog;

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/[0.06] px-6 pb-20 pt-36">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[350px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/[0.08] blur-[100px]" />
        <div className="container-page relative text-center">
          <span className="label">{bl.hero_eyebrow}</span>
          <h1 className="mt-3 text-4xl font-bold text-white md:text-5xl">{bl.hero_h1}</h1>
          <p className="mx-auto mt-4 max-w-md text-[16px] leading-relaxed text-slate-400">{bl.hero_sub}</p>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="container-page">
          {/* Featured */}
          <div className="mb-8">
            <span className="label">{bl.featured_label}</span>
          </div>
          <div className="card card-hover mb-10 p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${tagColors[bl.featured.id] ?? "bg-white/[0.07] text-slate-400"}`}>
                    {bl.featured.tag}
                  </span>
                  <span className="text-[12px] text-slate-600">{bl.coming_soon}</span>
                </div>
                <h2 className="mt-3 text-xl font-bold text-white md:text-2xl">{bl.featured.title}</h2>
                <p className="mt-2.5 text-[14px] leading-relaxed text-slate-400">{bl.featured.desc}</p>
              </div>
              <div className="shrink-0 md:ms-8">
                <div className="h-32 w-full rounded-xl bg-white/[0.04] md:h-24 md:w-36" />
              </div>
            </div>
            <div className="mt-5 flex items-center gap-4 border-t border-white/[0.06] pt-4">
              <span className="text-[12px] text-slate-500">{bl.featured.readTime}</span>
            </div>
          </div>

          {/* All articles */}
          <div className="mb-6">
            <span className="label">{bl.all_label}</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {bl.posts.map((post) => (
              <div key={post.id} className="card card-hover p-6">
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${tagColors[post.id] ?? "bg-white/[0.07] text-slate-400"}`}>
                    {post.tag}
                  </span>
                  <span className="text-[12px] text-slate-600">{bl.coming_soon}</span>
                </div>
                <h3 className="mt-3 text-[15px] font-semibold text-white">{post.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-slate-400">{post.desc}</p>
                <div className="mt-4 border-t border-white/[0.06] pt-3">
                  <span className="text-[12px] text-slate-600">{post.readTime}</span>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-12 text-center text-[13px] text-slate-600">{bl.content_note}</p>
        </div>
      </section>
    </div>
  );
}
