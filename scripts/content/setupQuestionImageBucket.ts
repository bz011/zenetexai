#!/usr/bin/env node
/**
 * One-off, idempotent Storage bucket provisioning (Sprint 9.1). Live
 * inspection during this sprint found ZERO Storage buckets in the Supabase
 * project - confirming that no question_images.image_path row has ever
 * pointed at a real, reachable file, regardless of whether the row's
 * metadata looks complete. This creates the public bucket that
 * src/lib/supabase/imageUrls.ts's URL construction assumes exists; it does
 * NOT upload any image files (none exist in this repo/session to upload -
 * that remains a real content task for whoever curates question images).
 *
 * Usage: npx tsx scripts/content/setupQuestionImageBucket.ts
 */

import { config as loadEnv } from "dotenv";
import path from "node:path";
loadEnv({ path: path.resolve(__dirname, "../../.env.local") });

import { supabaseAdmin } from "@/lib/supabase/admin";
import { QUESTION_IMAGE_BUCKET } from "@/lib/supabase/imageUrls";

async function main() {
  const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
  if (listError) {
    console.error("Failed to list buckets:", listError.message);
    process.exit(1);
  }

  const existing = (buckets ?? []).find((b) => b.name === QUESTION_IMAGE_BUCKET);
  if (existing) {
    console.log(`Bucket "${QUESTION_IMAGE_BUCKET}" already exists (public: ${existing.public}). Nothing to do.`);
    return;
  }

  const { error: createError } = await supabaseAdmin.storage.createBucket(QUESTION_IMAGE_BUCKET, {
    public: true,
    fileSizeLimit: "5MB",
    allowedMimeTypes: ["image/png", "image/jpeg", "image/webp"],
  });

  if (createError) {
    console.error(`Failed to create bucket "${QUESTION_IMAGE_BUCKET}":`, createError.message);
    process.exit(1);
  }

  console.log(`Created public bucket "${QUESTION_IMAGE_BUCKET}". Upload real question images to it at the exact object key stored in question_images.image_path, then re-run scripts/content/verifyQuestionImages.ts.`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
