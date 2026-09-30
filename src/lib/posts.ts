import { getPool } from "@/lib/db";

export interface PublishedPost {
  id: string;
  title: string;
  slug: string;
  body: string;
  published_at: string;
}

/**
 * Removed from public/indexable content (Pre-Implementation Master Audit,
 * 2026-09-30, Wave 0-B): both contained unsupported fabricated case studies
 * and statistics, which do not meet ZentexAI's editorial standard - not a
 * takedown for legal/DMCA/privacy reasons, and not a redirect candidate
 * (neither has a genuine equivalent replacement to send a visitor to).
 * Excluded here, at the one shared query every listing (Home, Resources,
 * Blog index, sitemap.ts) and the single-post page both read through, so
 * removal is enforced in one place rather than four. The underlying
 * website_posts rows are untouched - this is an application-layer
 * suppression, not a database deletion; removing the rows themselves (or
 * flipping a future is_published flag) is a separate, owner-authorized
 * action via the existing admin tooling.
 */
export const REMOVED_SLUGS = [
  "transforming-learning-how-ai-is-enhancing-education-in-mena-businesses",
  "transforming-learning-how-ai-is-enhancing-employee-development-in-mena-businesses",
] as const;

function queryPublishedPosts(limit?: number) {
  const pool = getPool();
  return pool.query<PublishedPost>(
    `SELECT id, title, slug, body, published_at
     FROM website_posts
     WHERE slug != ALL($1::text[])
     ORDER BY published_at DESC
     ${limit ? "LIMIT $2" : ""}`,
    limit ? [REMOVED_SLUGS, limit] : [REMOVED_SLUGS]
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
