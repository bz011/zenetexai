import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { requireApiRole } from "@/lib/auth/requireRole";
import { deletePostSchema } from "@/lib/validators/blogValidators";
import { isRateLimited } from "@/lib/rateLimit";

export async function DELETE(req: Request) {
  const auth = await requireApiRole(["admin"]);
  if (!auth.authorized) {
    return NextResponse.json(
      { success: false, error: auth.status === 401 ? "Not authenticated" : "Forbidden" },
      { status: auth.status }
    );
  }

  if (isRateLimited(`delete-post:${auth.user.id}`, 10, 60_000)) {
    return NextResponse.json({ success: false, error: "Too many requests, please slow down" }, { status: 429 });
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = deletePostSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid or missing slug" }, { status: 400 });
  }
  const { slug } = parsed.data;

  console.log(`[delete-post] Incoming delete request from admin ${auth.user.id} for slug "${slug}"`);

  try {
    const pool = getPool();
    // Fully parameterized - slug is never concatenated into SQL text, and
    // was already validated against a strict [a-z0-9-]+ shape above.
    const result = await pool.query(
      `DELETE FROM website_posts WHERE slug = $1 RETURNING id, slug`,
      [slug]
    );

    if (result.rowCount === 0) {
      console.warn(`[delete-post] No post found with slug: "${slug}"`);
      return NextResponse.json(
        { success: false, error: `No post found with slug "${slug}"` },
        { status: 404 }
      );
    }

    const deleted = result.rows[0];
    console.log(`[delete-post] Post deleted — id: ${deleted.id}, slug: "${deleted.slug}"`);

    return NextResponse.json({
      success: true,
      message: "Post deleted successfully",
      id: deleted.id,
      slug: deleted.slug,
    });
  } catch (error: unknown) {
    const pg = error as { message?: string };
    console.error("[delete-post] DB error:", pg.message ?? error);
    return NextResponse.json(
      { success: false, error: "Database error while deleting post" },
      { status: 500 }
    );
  }
}
