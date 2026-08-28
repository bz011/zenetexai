#!/usr/bin/env node
/**
 * One-off asset recovery (Sprint 9.2): uploads the original question-image
 * files - found on the local machine at Desktop/question_images after the
 * Sprint 9.1 investigation confirmed the Storage bucket had always been
 * empty - to the question-images bucket, at the exact object key already
 * stored in question_images.image_path (question_images/<filename>), so no
 * DB row needs to change at all.
 *
 * Only uploads files that were confidently matched 1:1 against an existing
 * question_images row during manual inspection (see the Sprint 9.2 chat
 * report for the full inventory/match table) - never invents or guesses a
 * mapping. Preserves original bytes (no recompression).
 *
 * Usage: npx tsx scripts/content/uploadRecoveredQuestionImages.ts
 */

import { config as loadEnv } from "dotenv";
import path from "node:path";
import fs from "node:fs";
loadEnv({ path: path.resolve(__dirname, "../../.env.local") });

import { supabaseAdmin } from "@/lib/supabase/admin";
import { QUESTION_IMAGE_BUCKET } from "@/lib/supabase/imageUrls";

const LOCAL_FOLDER = "C:\\Users\\PC\\Desktop\\question_images";

// Exactly the filenames confirmed MATCHED against a real question_images
// row for a question that currently exists in the database - see the
// inspection step. Q000485.png (MISSING_LOCAL_FILE) and the 8 files with no
// corresponding question row at all are deliberately excluded.
const MATCHED_FILENAMES = [
  "Q000009.png",
  "Q000023.png",
  "Q000066.png",
  "Q000121.png",
  "Q000122.png",
  "Q000123.png",
  "Q000124.png",
  "Q000190.png",
  "Q000195.png",
  "Q000199.png",
  "Q000245.png",
  "Q000246.png",
  "Q000247.png",
  "Q000298.png",
  "Q000301.png",
  "Q000302.png",
  "Q000303.png",
  "Q000371.png",
  "Q000421.png",
];

async function main() {
  console.log(`Uploading ${MATCHED_FILENAMES.length} matched file(s) from ${LOCAL_FOLDER} to bucket "${QUESTION_IMAGE_BUCKET}"...\n`);

  let uploaded = 0;
  let failed = 0;

  for (const filename of MATCHED_FILENAMES) {
    const localPath = path.join(LOCAL_FOLDER, filename);
    const objectKey = `question_images/${filename}`;

    if (!fs.existsSync(localPath)) {
      console.log(`✗ SKIP (local file vanished): ${filename}`);
      failed++;
      continue;
    }

    const fileBuffer = fs.readFileSync(localPath);
    const { error } = await supabaseAdmin.storage.from(QUESTION_IMAGE_BUCKET).upload(objectKey, fileBuffer, {
      contentType: "image/png",
      upsert: true,
    });

    if (error) {
      console.log(`✗ FAILED: ${objectKey} - ${error.message}`);
      failed++;
    } else {
      console.log(`✓ uploaded: ${objectKey} (${fileBuffer.length} bytes)`);
      uploaded++;
    }
  }

  console.log(`\nDone. ${uploaded} uploaded, ${failed} failed.`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
