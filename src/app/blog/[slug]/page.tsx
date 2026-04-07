import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPool } from "@/lib/db";
import MarkdownBody from "./MarkdownBody";

export const dynamic = "force-dynamic";

interface Post {
  id: string;
  title: string;
  slug: string;
  body: string;
  meta_title: string;
  meta_description: string;
  published_at: string;
}

async function fetchPost(slug: string): Promise<Post | null> {
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
  if (!post) return { title: "Post Not Found — ZENTEXAI" };
  return {
    title: post.meta_title,
    description: post.meta_description,
  };
}

export default async function BlogPostPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const post = await fetchPost(slug);
  if (!post) notFound();

  const publishedDate = new Date(post.published_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[350px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/[0.08] blur-[100px]" />

      <article className="container-page relative px-6 pb-24 pt-36">
        <Link href="/blog" className="mb-8 inline-flex items-center gap-1.5 text-[13px] text-slate-500 hover:text-slate-300 transition-colors">
          ← Back to Blog
        </Link>

        <header className="mb-12 border-b border-white/[0.06] pb-10">
          <p className="label mb-3">Blog</p>
          <h1 className="text-3xl font-bold text-white md:text-4xl leading-tight">{post.title}</h1>
          <p className="mt-4 text-[13px] text-slate-500">Published {publishedDate}</p>
        </header>

        <MarkdownBody content={post.body} />
      </article>
    </div>
  );
}
