import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { requireApiRole } from "@/lib/auth/requireRole";
import { publishPostSchema } from "@/lib/validators/blogValidators";
import { isRateLimited } from "@/lib/rateLimit";

export async function POST(req: Request) {
  const auth = await requireApiRole(["admin"]);
  if (!auth.authorized) {
    return NextResponse.json(
      { success: false, error: auth.status === 401 ? "Not authenticated" : "Forbidden" },
      { status: auth.status }
    );
  }

  if (isRateLimited(`publish-post:${auth.user.id}`, 10, 60_000)) {
    return NextResponse.json({ success: false, error: "Too many requests, please slow down" }, { status: 429 });
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = publishPostSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid post data" }, { status: 400 });
  }
  const { title, slug, body: postBody, meta_title, meta_description } = parsed.data;

  console.log(`[publish-post] Incoming publish request from admin ${auth.user.id}`);

  try {
    const pool = getPool();

    // Schema (table, PK, slug UNIQUE, RLS) is owned by migrations/029_website_posts.sql,
    // not this route - see that file for why. Fully parameterized below - no
    // request value is ever concatenated into SQL text.
    const result = await pool.query(
      `INSERT INTO website_posts (title, slug, body, meta_title, meta_description)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (slug) DO UPDATE SET
         title            = EXCLUDED.title,
         body             = EXCLUDED.body,
         meta_title       = EXCLUDED.meta_title,
         meta_description = EXCLUDED.meta_description,
         published_at     = NOW()
       RETURNING id, slug, created_at`,
      [title, slug, postBody, meta_title, meta_description]
    );

    const inserted = result.rows[0];
    console.log(`[publish-post] Post saved — id: ${inserted.id}, slug: "${inserted.slug}"`);

    return NextResponse.json({
      success: true,
      message: "Post published successfully",
      id: inserted.id,
      slug: inserted.slug,
    });
  } catch (error: unknown) {
    const pg = error as { code?: string; message?: string };

    if (pg.code === "23505") {
      console.error(`[publish-post] Duplicate slug rejected: "${slug}"`);
      return NextResponse.json(
        { success: false, error: `A post with slug "${slug}" already exists` },
        { status: 409 }
      );
    }

    console.error("[publish-post] DB error:", pg.message ?? error);
    return NextResponse.json(
      { success: false, error: "Database error while saving post" },
      { status: 500 }
    );
  }
}
