import type { Lang } from "@/site/content";
import { markdownExcerpt } from "@/lib/excerpt";
import { topicOf, type Topic } from "@/site/resources/resourcesCopy";

/**
 * Article model for the v5 Blog and Resources designs, built from real rows
 * of the production `website_posts` table (read through the existing data
 * layer: fetchPublishedPosts in src/lib/posts.ts, and the article page's own
 * query). Nothing is invented or overwritten:
 *
 *  - date / publishedAt: the stored `published_at`, unchanged. publishedAt is
 *    the full ISO timestamp (structured data, Open Graph); date is its UTC
 *    calendar day for display ("YYYY-MM-DD", formatted without Intl).
 *  - lang: from the title's script, exactly as the production article page
 *    decides it (isArabicText).
 *  - description: the row's meta_description when the query provides it,
 *    otherwise an excerpt of the body (what the production list showed).
 *  - topic: derived from the slug (Resources rules); minutes: reading time.
 *
 * Order is the query's own (published_at DESC).
 */

export type Post = {
  slug: string;
  title: string;
  metaTitle: string;
  description: string;
  body: string;
  lang: Lang;
  date: string;
  publishedAt: string;
  topic: Topic | null;
  minutes: number;
};

export type PostRow = {
  slug: string;
  title: string;
  body: string;
  published_at: string | Date;
  meta_title?: string | null;
  meta_description?: string | null;
};

const isArabic = (text: string) => /[؀-ۿ]/.test(text);
const words = (md: string) => (md.replace(/\]\([^)]*\)/g, "]").match(/[\p{L}\p{N}]+/gu) ?? []).length;

/** The stored timestamp as ISO 8601 (the pg driver returns a Date; tests may pass a string). */
export function toIso(value: string | Date): string {
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toISOString();
}

export function toPost(row: PostRow): Post {
  const publishedAt = toIso(row.published_at);
  return {
    slug: row.slug,
    title: row.title,
    metaTitle: row.meta_title ?? row.title,
    description: row.meta_description ?? markdownExcerpt(row.body, 160),
    body: row.body,
    lang: isArabic(row.title) ? "ar" : "en",
    date: publishedAt.slice(0, 10),
    publishedAt,
    topic: topicOf(row.slug),
    minutes: Math.max(1, Math.round(words(row.body) / 200)),
  };
}

/** Production article URL: every article, in either language, lives at /blog/<slug>. */
export const articleHref = (post: Pick<Post, "slug">) => `/blog/${post.slug}`;

export const postsIn = (posts: Post[], lang: Lang) => posts.filter((p) => p.lang === lang);

/** Up to `count` other articles in the article's own language, same topic first. */
export function relatedTo(post: Post, all: Post[], count = 3): Post[] {
  const others = postsIn(all, post.lang).filter((p) => p.slug !== post.slug);
  const same = others.filter((p) => p.topic && p.topic === post.topic);
  const rest = others.filter((p) => !same.includes(p));
  return [...same, ...rest].slice(0, count);
}
