import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPool } from "@/lib/db";

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

        <div
          className="prose-blog max-w-none text-slate-300 text-[15px] leading-[1.85]
            [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-white
            [&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:text-[17px] [&_h3]:font-semibold [&_h3]:text-white
            [&_p]:mb-5
            [&_ul]:mb-5 [&_ul]:list-disc [&_ul]:pl-5 [&_ul>li]:mb-1.5
            [&_ol]:mb-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol>li]:mb-1.5
            [&_strong]:text-white [&_strong]:font-semibold
            [&_a]:text-indigo-400 [&_a]:underline [&_a]:underline-offset-2
            [&_code]:rounded [&_code]:bg-white/[0.06] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[13px]
            [&_pre]:mb-5 [&_pre]:rounded-xl [&_pre]:bg-white/[0.05] [&_pre]:p-4 [&_pre]:overflow-x-auto
            [&_blockquote]:border-l-2 [&_blockquote]:border-indigo-500/50 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-slate-400"
          dangerouslySetInnerHTML={{ __html: post.body }}
        />
      </article>
    </div>
  );
}
