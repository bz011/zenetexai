#!/usr/bin/env node
/**
 * Backfills question_images.natural_width/natural_height (migration 027)
 * by fetching each image once and reading its real dimensions from the
 * file itself - never from a client, never re-derived at grading/render
 * time. This is what makes hotspot region normalization (pixel ->
 * percentage, quizGradingService.ts) deterministic: the natural size is a
 * fixed, known fact about the file, computed once and persisted, not a
 * network fetch on every graded click.
 *
 * Only PNG and JPEG are parsed (the only formats this question bank uses -
 * see question_images.image_path in the DB). Idempotent and safe to rerun
 * any time a new image is added: only rows with a NULL width/height are
 * touched, existing values are never overwritten.
 *
 * Usage: npx tsx scripts/content/backfillImageDimensions.ts
 */

import { config as loadEnv } from "dotenv";
import path from "node:path";
loadEnv({ path: path.resolve(__dirname, "../../.env.local") });

import { supabaseAdmin } from "@/lib/supabase/admin";
import { getQuestionImagePublicUrl } from "@/lib/supabase/imageUrls";

interface ImageRow {
  id: string;
  question_id: string;
  image_path: string;
}

/** PNG: signature + IHDR chunk's first two 4-byte big-endian fields. */
function parsePng(buf: Buffer): { width: number; height: number } | null {
  if (buf.length < 24 || buf.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

/** JPEG: walk markers to the first SOF (Start Of Frame) segment. */
function parseJpeg(buf: Buffer): { width: number; height: number } | null {
  if (buf.length < 4 || buf.readUInt16BE(0) !== 0xffd8) return null;
  let offset = 2;
  while (offset + 9 < buf.length) {
    if (buf[offset] !== 0xff) return null;
    const marker = buf[offset + 1];
    const isSOF = (marker >= 0xc0 && marker <= 0xcf) && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isSOF) {
      return { height: buf.readUInt16BE(offset + 5), width: buf.readUInt16BE(offset + 7) };
    }
    const segmentLength = buf.readUInt16BE(offset + 2);
    offset += 2 + segmentLength;
  }
  return null;
}

function parseDimensions(buf: Buffer, imagePath: string): { width: number; height: number } | null {
  if (/\.(jpg|jpeg)$/i.test(imagePath)) return parseJpeg(buf);
  return parsePng(buf) ?? parseJpeg(buf);
}

async function main() {
  const { data, error } = await supabaseAdmin
    .from("question_images")
    .select("id, question_id, image_path")
    .is("natural_width", null);
  if (error) throw error;

  const rows = (data ?? []) as ImageRow[];
  console.log(`${rows.length} question_images row(s) missing natural_width/natural_height.`);
  if (rows.length === 0) return;

  let updated = 0;
  const failures: string[] = [];

  for (const row of rows) {
    const url = getQuestionImagePublicUrl(row.image_path);
    try {
      const res = await fetch(url);
      if (!res.ok) {
        failures.push(`${row.question_id} (${row.image_path}): HTTP ${res.status}`);
        continue;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      const dims = parseDimensions(buf, row.image_path);
      if (!dims) {
        failures.push(`${row.question_id} (${row.image_path}): could not parse image dimensions`);
        continue;
      }
      const { error: updateError } = await supabaseAdmin
        .from("question_images")
        .update({ natural_width: dims.width, natural_height: dims.height })
        .eq("id", row.id);
      if (updateError) {
        failures.push(`${row.question_id} (${row.image_path}): DB update failed - ${updateError.message}`);
        continue;
      }
      console.log(`  ${row.question_id}: ${dims.width}x${dims.height}`);
      updated++;
    } catch (err) {
      failures.push(`${row.question_id} (${row.image_path}): ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  console.log(`\nUpdated ${updated}/${rows.length}.`);
  if (failures.length > 0) {
    console.log(`\n${failures.length} failure(s):`);
    failures.forEach((f) => console.log(`  - ${f}`));
  }
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
