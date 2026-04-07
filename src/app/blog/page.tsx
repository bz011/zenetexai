import type { Metadata } from "next";
import BlogContent from "./BlogContent";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Blog — ZENTEXAI" };

export interface PublishedPost {
  id: string;
  title: string;
  slug: string;
  body: string;
  published_at: string;
}

async function fetchPublishedPosts(): Promise<PublishedPost[]> {
  try {
    const pool = getPool();
    const result = await pool.query<PublishedPost>(
      `SELECT id, title, slug, body, published_at
       FROM website_posts
       ORDER BY published_at DESC`
    );
    return result.rows;
  } catch (err: unknown) {
    console.error("[blog] Failed to fetch posts:", (err as Error).message);
    return [];
  }
}

export default async function BlogPage() {
  const publishedPosts = await fetchPublishedPosts();
  return <BlogContent publishedPosts={publishedPosts} />;
}
