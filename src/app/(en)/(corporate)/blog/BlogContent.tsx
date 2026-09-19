"use client";

import Link from "next/link";
import { useLang } from "@/lib/LanguageContext";
import type { PublishedPost } from "@/lib/posts";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function excerpt(body: string, maxLen = 120) {
  const text = body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text.length > maxLen ? text.slice(0, maxLen) + "…" : text;
}

interface Props {
  publishedPosts: PublishedPost[];
}

export default function BlogContent({ publishedPosts }: Props) {
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
          {publishedPosts.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-[14px] text-slate-500">No articles published yet. Check back soon.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {publishedPosts.map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`} className="card card-hover block p-6">
                  <p className="text-[11px] text-slate-500">{formatDate(post.published_at)}</p>
                  <h3 className="mt-2 text-[15px] font-semibold text-white leading-snug">{post.title}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-slate-400">{excerpt(post.body)}</p>
                  <p className="mt-4 text-[12px] font-medium text-indigo-400">Read more →</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
