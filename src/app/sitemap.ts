import type { MetadataRoute } from "next";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { fetchPublishedPosts } from "@/lib/posts";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://zentexai.com";

/**
 * Dynamic XML sitemap (served natively by Next.js at /sitemap.xml from this
 * file - no package needed). Lists ONLY real, public, canonical pages that
 * return 200:
 *  - static marketing pages (home, services, academy, about, contact,
 *    resources, blog index)
 *  - published product pages (currently: PMP Mastery Program, PMP Exam
 *    Simulator) - read directly by slug/is_published, not hardcoded, so an
 *    admin publishing/unpublishing a product is reflected automatically
 *  - published blog articles, one entry per real row in website_posts
 *
 * Deliberately EXCLUDED (see the task's own list): /tools and /enroll
 * (301 redirects, not 200 pages - next.config.js), every authenticated
 * route (/dashboard, /certificate, lessons, assessments, practice, mock
 * exam, checkout), /admin/**, /api/**, and all auth pages (login/signup/
 * password reset/verify-email) - none of those are meant to rank, and
 * several require a session that a crawler will never have anyway.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/services`, changeFrequency: "monthly" },
    { url: `${SITE_URL}/academy`, changeFrequency: "monthly" },
    { url: `${SITE_URL}/about`, changeFrequency: "yearly" },
    { url: `${SITE_URL}/contact`, changeFrequency: "yearly" },
    { url: `${SITE_URL}/resources`, changeFrequency: "weekly" },
    { url: `${SITE_URL}/blog`, changeFrequency: "weekly" },
    { url: `${SITE_URL}/courses`, changeFrequency: "monthly" },
  ];

  let productEntries: MetadataRoute.Sitemap = [];
  try {
    const { data: products } = await supabaseAdmin.from("products").select("slug, updated_at").eq("is_published", true);
    productEntries = ((products ?? []) as { slug: string; updated_at: string | null }[]).map((p) => ({
      url: `${SITE_URL}/courses/${p.slug}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : undefined,
      changeFrequency: "monthly" as const,
    }));
  } catch (err) {
    console.error("[sitemap] failed to load products:", (err as Error).message);
  }

  let postEntries: MetadataRoute.Sitemap = [];
  try {
    const posts = await fetchPublishedPosts();
    postEntries = posts.map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: new Date(post.published_at),
      changeFrequency: "yearly" as const,
    }));
  } catch (err) {
    console.error("[sitemap] failed to load posts:", (err as Error).message);
  }

  return [...staticEntries, ...productEntries, ...postEntries];
}
