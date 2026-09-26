import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPool } from "@/lib/db";
import MarkdownBody from "@/components/MarkdownBody";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd, articleJsonLd } from "@/lib/structuredData";

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

/** Arabic-script Unicode range check - used only to pick lang/dir for the article wrapper, since website_posts has no language column. */
function isArabicText(text: string): boolean {
  return /[؀-ۿ]/.test(text);
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
  if (!post) return { title: "Post Not Found — ZENTEXAI", robots: { index: false, follow: false } };

  const path = `/blog/${post.slug}`;
  return pageMetadata({ title: post.meta_title, description: post.meta_description, path, type: "article", publishedTime: post.published_at });
}

export default async function BlogPostPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const post = await fetchPost(slug);
  if (!post) notFound();

  const arabic = isArabicText(post.title);
  const publishedDate = new Date(post.published_at).toLocaleDateString(arabic ? "ar" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="relative min-h-screen overflow-hidden">
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }, { name: post.title, path: `/blog/${post.slug}` }])} />
      <JsonLd
        data={articleJsonLd({
          headline: post.title,
          description: post.meta_description,
          path: `/blog/${post.slug}`,
          datePublished: post.published_at,
          inLanguage: arabic ? "ar" : "en",
        })}
      />

      <article
        lang={arabic ? "ar" : "en"}
        dir={arabic ? "rtl" : "ltr"}
        className="container-page relative px-6 pb-24 pt-36"
      >
        <Link href="/blog" className="mb-8 inline-flex items-center gap-1.5 text-[13px] text-ink-3 hover:text-ink-2 transition-colors">
          {arabic ? "→ العودة إلى المدونة" : "← Back to Blog"}
        </Link>

        <header className="mb-12 border-b border-line pb-10">
          <p className="label mb-3">{arabic ? "المدونة" : "Blog"}</p>
          <h1 className="text-h2 text-ink leading-tight">{post.title}</h1>
          <p className="mt-4 text-[13px] text-ink-3">{arabic ? `نُشر بتاريخ ${publishedDate}` : `Published ${publishedDate}`}</p>
        </header>

        <MarkdownBody content={post.body} />
      </article>
    </div>
  );
}
