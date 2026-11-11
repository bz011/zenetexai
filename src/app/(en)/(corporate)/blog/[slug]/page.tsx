import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { notFound } from "next/navigation";
import { getPool } from "@/lib/db";
import { REMOVED_SLUGS, fetchPublishedPosts } from "@/lib/posts";
import ArticlePage from "@/site/blog/ArticlePage";
import { relatedTo, toIso, toPost } from "@/site/blog/blogData";

export const dynamic = "force-dynamic";

interface Post {
  id: string;
  title: string;
  slug: string;
  body: string;
  meta_title: string;
  meta_description: string;
  published_at: string | Date;
}

/** Arabic-script Unicode range check - used only to pick lang/dir for the article wrapper, since website_posts has no language column. */

async function fetchPost(slug: string): Promise<Post | null> {
  // Removed from public content (see REMOVED_SLUGS in @/lib/posts for why) -
  // checked before the query even runs, so a direct/bookmarked/crawled hit
  // on the old URL 404s exactly like a slug that never existed, rather than
  // depending on the row itself being deleted.
  if ((REMOVED_SLUGS as readonly string[]).includes(slug)) return null;

  try {
    const pool = getPool();
    const result = await pool.query<Post>(
      `SELECT id, title, slug, body, meta_title, meta_description, published_at
       FROM website_posts
       WHERE slug = $1
       LIMIT 1`,
      [slug]
    );
    return result.rows[0] ?? null;
  } catch (err: unknown) {
    console.error("[blog/slug] Failed to fetch post:", (err as Error).message);
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchPost(slug);
  if (!post) return { title: "Post Not Found — ZENTEXAI", robots: { index: false, follow: false } };

  const path = `/blog/${post.slug}`;
  return pageMetadata({ title: post.meta_title, description: post.meta_description, path, type: "article", publishedTime: toIso(post.published_at) });
}

export default async function BlogPostPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const post = await fetchPost(slug);
  if (!post) notFound();

  // Same row, mapped for the approved design (dates are the stored values,
  // see src/site/blog/blogData.ts). Related: same-language published posts.
  const article = toPost(post);
  const related = relatedTo(article, (await fetchPublishedPosts()).map(toPost));
  return <ArticlePage post={article} related={related} />;
}
