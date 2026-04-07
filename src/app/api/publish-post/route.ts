import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS website_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    body TEXT NOT NULL,
    meta_title TEXT NOT NULL,
    meta_description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
`;

export async function POST(req: Request) {
  console.log("[publish-post] Incoming publish request");

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { title, slug, body: postBody, meta_title, meta_description } = body as Record<string, string>;

  if (!title || !slug || !postBody || !meta_title || !meta_description) {
    return NextResponse.json(
      {
        success: false,
        error: "Missing required fields: title, slug, body, meta_title, meta_description",
      },
      { status: 400 }
    );
  }

  try {
    await pool.query(CREATE_TABLE_SQL);

    const result = await pool.query(
      `INSERT INTO website_posts (title, slug, body, meta_title, meta_description)
       VALUES ($1, $2, $3, $4, $5)
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
