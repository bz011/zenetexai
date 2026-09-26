"use client";

import Link from "next/link";
import { useLang } from "@/lib/LanguageContext";
import type { PublishedPost } from "@/lib/posts";
import PageHero from "@/components/ui/PageHero";

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
      <PageHero eyebrow={r.hero_eyebrow} title={r.hero_h1} sub={r.hero_sub} />

      {/* Pillars: Blog / Insights / Free Resources */}
      <section className="border-b border-line px-6 py-16">
        <div className="container-page">
          <div className="grid gap-4 md:grid-cols-3">
            {pillars.map((p) => (
              <Link key={p.title} href={p.href} className="card card-hover p-6">
                <h3 className="text-[15px] font-semibold text-ink">{p.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-ink-2">{p.desc}</p>
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
              <p className="text-[14px] text-ink-3">{r.articles_empty}</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {latestPosts.map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`} className="card card-hover block p-6">
                  <p className="text-[11px] text-ink-3">{formatDate(post.published_at)}</p>
                  <h3 className="mt-2 text-[15px] font-semibold text-ink leading-snug">{post.title}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-ink-2">{excerpt(post.body)}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
