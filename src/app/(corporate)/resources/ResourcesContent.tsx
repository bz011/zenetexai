"use client";

import Link from "next/link";
import { useLang } from "@/lib/LanguageContext";
import type { PublishedPost } from "@/lib/posts";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function excerpt(body: string, maxLen = 120) {
  const text = body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text.length > maxLen ? text.slice(0, maxLen) + "…" : text;
}

interface Props {
  latestPosts: PublishedPost[];
}

export default function ResourcesContent({ latestPosts }: Props) {
  const { t } = useLang();
  const r = t.resources;

  const pillars = [
    { title: r.blog_title, desc: r.blog_desc, href: "/blog" },
    { title: r.insights_title, desc: r.insights_desc, href: "/blog" },
    { title: r.free_title, desc: r.free_desc, href: "/contact" },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/[0.06] px-6 pb-20 pt-36">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[350px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/[0.08] blur-[100px]" />
        <div className="container-page relative text-center">
          <span className="label">{r.hero_eyebrow}</span>
          <h1 className="mt-3 text-4xl font-bold text-white md:text-5xl">{r.hero_h1}</h1>
          <p className="mx-auto mt-4 max-w-md text-[16px] leading-relaxed text-slate-400">{r.hero_sub}</p>
        </div>
      </section>

      {/* Pillars: Blog / Insights / Free Resources */}
      <section className="border-b border-white/[0.06] px-6 py-16">
        <div className="container-page">
          <div className="grid gap-4 md:grid-cols-3">
            {pillars.map((p) => (
              <Link key={p.title} href={p.href} className="card card-hover p-6">
                <h3 className="text-[15px] font-semibold text-white">{p.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-slate-400">{p.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Latest articles */}
      <section className="px-6 py-20">
        <div className="container-page">
          <div className="mb-8 flex items-center justify-between">
            <span className="label">{r.articles_h2}</span>
            <Link href="/blog" className="btn-ghost text-[13px]">{r.view_all} →</Link>
          </div>

          {latestPosts.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-[14px] text-slate-500">{r.articles_empty}</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {latestPosts.map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`} className="card card-hover block p-6">
                  <p className="text-[11px] text-slate-500">{formatDate(post.published_at)}</p>
                  <h3 className="mt-2 text-[15px] font-semibold text-white leading-snug">{post.title}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-slate-400">{excerpt(post.body)}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
