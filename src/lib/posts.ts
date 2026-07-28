import { getPool } from "@/lib/db";

export interface PublishedPost {
  id: string;
  title: string;
  slug: string;
  body: string;
  published_at: string;
}

/**
 * Shared read used by the Home ("Latest Articles"), Resources, and Blog
 * pages - one query, one place that knows the website_posts schema.
 */
export async function fetchPublishedPosts(limit?: number): Promise<PublishedPost[]> {
  try {
    const pool = getPool();
    const result = await pool.query<PublishedPost>(
      `SELECT id, title, slug, body, published_at
       FROM website_posts
       ORDER BY published_at DESC
       ${limit ? "LIMIT $1" : ""}`,
      limit ? [limit] : []
    );
    return result.rows;
  } catch (err: unknown) {
    console.error("[posts] Failed to fetch published posts:", (err as Error).message);
    return [];
  }
}
