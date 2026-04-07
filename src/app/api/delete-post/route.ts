import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export async function DELETE(req: Request) {
  console.log("[delete-post] Incoming delete request");

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { slug } = body as Record<string, string>;

  if (!slug) {
    return NextResponse.json(
      { success: false, error: "Missing required field: slug" },
      { status: 400 }
    );
  }

  try {
    const pool = getPool();
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
