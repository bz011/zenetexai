"use client";

import Link from "next/link";
import { useLang } from "@/lib/LanguageContext";
import type { PublishedPost } from "@/lib/posts";
import PageHero from "@/components/ui/PageHero";

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
      <PageHero eyebrow={bl.hero_eyebrow} title={bl.hero_h1} sub={bl.hero_sub} />

      <section className="px-6 py-20">
        <div className="container-page">
          {publishedPosts.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-[14px] text-ink-3">No articles published yet. Check back soon.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {publishedPosts.map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`} className="card card-hover block p-6">
                  <p className="text-[11px] text-ink-3">{formatDate(post.published_at)}</p>
                  <h3 className="mt-2 text-[15px] font-semibold text-ink leading-snug">{post.title}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-ink-2">{excerpt(post.body)}</p>
                  <p className="mt-4 text-[12px] font-medium text-accent-fg">Read more →</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
