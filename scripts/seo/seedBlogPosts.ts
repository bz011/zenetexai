/**
 * Idempotent seed for the first 8 SEO blog articles, using the EXACT same
 * table/columns/upsert shape as /api/publish-post (this is intentionally
 * not a new content system - it reuses the existing website_posts
 * architecture verbatim, including its own CREATE_TABLE_SQL, so a post
 * created here is indistinguishable from one an admin publishes through
 * the existing admin flow).
 *
 * Safe to re-run: ON CONFLICT (slug) DO UPDATE keeps this in sync with
 * blogPostsData.ts without ever creating a duplicate row.
 *
 * Schema (table, PK, slug UNIQUE, indexes, RLS) is owned by
 * migrations/029_website_posts.sql - run that first. This script only ever
 * seeds rows, never creates or alters schema.
 *
 * Usage: npx tsx scripts/seo/seedBlogPosts.ts
 */
import { config as loadEnv } from "dotenv";
import path from "node:path";
loadEnv({ path: path.resolve(__dirname, "../../.env.local") });
import { getPool } from "../../src/lib/db";
import { BLOG_POSTS } from "./blogPostsData";

async function main() {
  const pool = getPool();
  console.log(`Seeding ${BLOG_POSTS.length} posts...\n`);

  for (const post of BLOG_POSTS) {
    const result = await pool.query(
      `INSERT INTO website_posts (title, slug, body, meta_title, meta_description)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (slug) DO UPDATE SET
         title            = EXCLUDED.title,
         body             = EXCLUDED.body,
         meta_title       = EXCLUDED.meta_title,
         meta_description = EXCLUDED.meta_description
       RETURNING id, slug, (xmax = 0) AS inserted`,
      [post.title, post.slug, post.body, post.meta_title, post.meta_description]
    );
    const row = result.rows[0];
    console.log(`  ${row.inserted ? "inserted" : "updated (already existed)"} — ${row.slug} (${row.id})`);
  }

  const { rows: countRows } = await pool.query("SELECT count(*) FROM website_posts");
  console.log(`\nTotal posts in website_posts: ${countRows[0].count}`);
  process.exit(0);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
