import { getPool } from "@/lib/db";

export interface PublishedPost {
  id: string;
  title: string;
  slug: string;
  body: string;
  published_at: string;
}

function queryPublishedPosts(limit?: number) {
  const pool = getPool();
  return pool.query<PublishedPost>(
    `SELECT id, title, slug, body, published_at
     FROM website_posts
     ORDER BY published_at DESC
     ${limit ? "LIMIT $1" : ""}`,
    limit ? [limit] : []
  );
}

/**
 * Shared read used by the Home ("Latest Articles"), Resources, and Blog
 * pages - one query, one place that knows the website_posts schema.
 *
 * Retries once on failure: Neon (and pooled Postgres generally) can
 * terminate an idle connection between requests - e.g. compute
 * auto-suspend, or the admin-shutdown code (57P01) already anticipated by
 * the pool.on('error') handler in db.ts. node-postgres discards a client
 * that errors like that from the pool automatically, so a retry acquires a
 * genuinely fresh connection rather than repeating the same failure - this
 * is what turns an intermittent connection blip into a normal successful
 * response instead of a silently empty result (which is otherwise
 * indistinguishable from "there are genuinely no posts" to every caller).
 */
export async function fetchPublishedPosts(limit?: number): Promise<PublishedPost[]> {
  try {
    const result = await queryPublishedPosts(limit);
    return result.rows;
  } catch (err: unknown) {
    console.error("[posts] Failed to fetch published posts (attempt 1):", (err as Error).message);
    try {
      const retryResult = await queryPublishedPosts(limit);
      return retryResult.rows;
    } catch (retryErr: unknown) {
      console.error("[posts] Failed to fetch published posts (retry failed):", (retryErr as Error).message);
      return [];
    }
  }
}
