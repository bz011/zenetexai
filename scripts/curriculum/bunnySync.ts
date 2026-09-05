/**
 * Server-only Bunny Stream matching/sync for the PMP Mastery Program
 * curriculum. Queries the Bunny Stream MANAGEMENT API (video.bunnycdn.com -
 * distinct from the public iframe embed surface already used by the
 * player in bunnyVideo.ts/VideoEmbed.tsx, which is untouched by this
 * script) to list every video in the library, matches each against
 * pmpCurriculum.ts's `bunnyReferenceName` by exact normalized-title
 * comparison, and — only for a confident single match on a fully
 * processed video — attaches its GUID/duration to the corresponding
 * lesson row via the EXISTING columns (video_provider/video_url/
 * duration_minutes, migration 006). Never writes bunny_reference_name
 * here (that is seedPmpCurriculum.ts's job) and never touches
 * title/order/publication state.
 *
 * Requires BUNNY_STREAM_API_KEY (server-only secret - never log it, never
 * put it in a NEXT_PUBLIC_ variable, never write it to any table). Reuses
 * the existing NEXT_PUBLIC_BUNNY_STREAM_LIBRARY_ID for the library id path
 * segment, since the library id itself is already public (embedded in
 * every iframe src - see bunnyVideo.ts's own comment on this).
 *
 * Matching: trims + collapses whitespace + lowercases both the curriculum
 * reference and Bunny's returned `title`, and additionally compares with a
 * trailing .mp4/.mov/.m4v/.webm extension stripped from either side (some
 * curriculum references include an extension, some Bunny titles do too,
 * depending on how the file was originally uploaded) - both variants are
 * exact string comparisons, never fuzzy/partial matching.
 *
 * Idempotent: safe to rerun any time (e.g. once more videos finish Bunny's
 * encoding pipeline, or after fixing an ambiguous filename in the Bunny
 * dashboard) - only ever overwrites a lesson's video_provider/video_url/
 * duration_minutes with a freshly confirmed single match, never guesses,
 * never deletes/renames/reuploads anything in Bunny.
 *
 * Usage: npx tsx scripts/curriculum/bunnySync.ts
 */

import { config as loadEnv } from "dotenv";
import path from "node:path";
loadEnv({ path: path.resolve(__dirname, "../../.env.local") });

import { supabaseAdmin } from "../../src/lib/supabase/admin";
import { PMP_COURSE_SLUG, PMP_CURRICULUM, lessonSlug, TOTAL_CURRICULUM_LESSONS } from "./pmpCurriculum";

const BUNNY_STREAM_FINISHED_STATUS = 4;

interface BunnyVideo {
  guid: string;
  title: string;
  length: number; // seconds
  status: number; // 4 = Finished (fully processed, ready to play)
}

interface BunnyListResponse {
  totalItems: number;
  currentPage: number;
  itemsPerPage: number;
  items: BunnyVideo[];
}

function normalize(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").toLowerCase();
}

function stripExtension(s: string): string {
  return s.replace(/\.(mp4|mov|m4v|webm)$/i, "");
}

function matchKeys(raw: string): string[] {
  const n = normalize(raw);
  const stripped = stripExtension(n);
  return stripped === n ? [n] : [n, stripped];
}

async function fetchAllBunnyVideos(libraryId: string, apiKey: string): Promise<BunnyVideo[]> {
  const all: BunnyVideo[] = [];
  let page = 1;
  const itemsPerPage = 100;

  for (;;) {
    const res = await fetch(`https://video.bunnycdn.com/library/${encodeURIComponent(libraryId)}/videos?page=${page}&itemsPerPage=${itemsPerPage}&orderBy=date`, {
      headers: { AccessKey: apiKey },
    });

    if (!res.ok) {
      throw new Error(`Bunny list-videos request failed: HTTP ${res.status}`);
    }

    const body = (await res.json()) as BunnyListResponse;
    all.push(...body.items);

    if (all.length >= body.totalItems || body.items.length < itemsPerPage) break;
    page++;
  }

  return all;
}

function buildIndex(videos: BunnyVideo[]): Map<string, BunnyVideo[]> {
  const index = new Map<string, BunnyVideo[]>();
  for (const v of videos) {
    for (const key of matchKeys(v.title)) {
      const list = index.get(key) ?? [];
      list.push(v);
      index.set(key, list);
    }
  }
  return index;
}

function findCandidates(index: Map<string, BunnyVideo[]>, reference: string): BunnyVideo[] {
  const found = new Map<string, BunnyVideo>();
  for (const key of matchKeys(reference)) {
    for (const v of index.get(key) ?? []) found.set(v.guid, v);
  }
  return [...found.values()];
}

interface CurriculumEntry {
  moduleSlug: string;
  moduleTitleEn: string;
  n: number;
  titleEn: string;
  bunnyReferenceName: string;
}

function flattenCurriculum(): CurriculumEntry[] {
  const entries: CurriculumEntry[] = [];
  for (const mod of PMP_CURRICULUM) {
    for (const lesson of mod.lessons) {
      entries.push({ moduleSlug: mod.slug, moduleTitleEn: mod.titleEn, n: lesson.n, titleEn: lesson.titleEn, bunnyReferenceName: lesson.bunnyReferenceName });
    }
  }
  return entries;
}

async function main() {
  const apiKey = process.env.BUNNY_STREAM_API_KEY;
  const libraryId = process.env.NEXT_PUBLIC_BUNNY_STREAM_LIBRARY_ID;

  if (!apiKey) {
    console.error(
      "BUNNY_STREAM_API_KEY is not set - cannot query the Bunny Stream API.\n" +
        "Set it as a server-only environment variable (never NEXT_PUBLIC_):\n" +
        "  - Locally: add BUNNY_STREAM_API_KEY=<your Bunny Stream API key> to .env.local\n" +
        "  - Vercel: Project Settings -> Environment Variables -> add BUNNY_STREAM_API_KEY for Production (and Preview if used), scoped server-only.\n" +
        "No changes were made. Curriculum text/structure (if already seeded via seedPmpCurriculum.ts) is unaffected."
    );
    process.exit(1);
  }
  if (!libraryId) {
    console.error("NEXT_PUBLIC_BUNNY_STREAM_LIBRARY_ID is not set. This is required to know which Bunny library to query. No changes were made.");
    process.exit(1);
  }

  console.log("Fetching video list from Bunny Stream...");
  const videos = await fetchAllBunnyVideos(libraryId, apiKey);
  console.log(`Fetched ${videos.length} video(s) from Bunny library ${libraryId}.\n`);

  const index = buildIndex(videos);
  const entries = flattenCurriculum();

  const matched: { entry: CurriculumEntry; video: BunnyVideo }[] = [];
  const notReady: { entry: CurriculumEntry; video: BunnyVideo }[] = [];
  const ambiguous: { entry: CurriculumEntry; candidates: BunnyVideo[] }[] = [];
  const unmatched: CurriculumEntry[] = [];
  const referencedGuids = new Set<string>();

  for (const entry of entries) {
    const candidates = findCandidates(index, entry.bunnyReferenceName);
    candidates.forEach((c) => referencedGuids.add(c.guid));

    if (candidates.length === 0) {
      unmatched.push(entry);
    } else if (candidates.length > 1) {
      ambiguous.push({ entry, candidates });
    } else if (candidates[0].status !== BUNNY_STREAM_FINISHED_STATUS) {
      notReady.push({ entry, video: candidates[0] });
    } else {
      matched.push({ entry, video: candidates[0] });
    }
  }

  const unusedVideos = videos.filter((v) => !referencedGuids.has(v.guid));

  // -------------------------------------------------------------------
  // Apply confirmed single matches to the DB (curriculum must already be
  // seeded - see seedPmpCurriculum.ts).
  // -------------------------------------------------------------------
  const { data: course } = await supabaseAdmin.from("courses").select("id").eq("slug", PMP_COURSE_SLUG).maybeSingle();
  const applied: { entry: CurriculumEntry; video: BunnyVideo }[] = [];
  const applyErrors: string[] = [];

  if (course) {
    const courseId = (course as { id: string }).id;
    for (const { entry, video } of matched) {
      const { data: mod } = await supabaseAdmin.from("modules").select("id").eq("course_id", courseId).eq("slug", entry.moduleSlug).maybeSingle();
      if (!mod) {
        applyErrors.push(`Module "${entry.moduleSlug}" not found in DB - run seedPmpCurriculum.ts first.`);
        continue;
      }
      const slug = lessonSlug(entry.moduleSlug, entry.n);
      const { data: lesson } = await supabaseAdmin.from("lessons").select("id").eq("module_id", (mod as { id: string }).id).eq("slug", slug).maybeSingle();
      if (!lesson) {
        applyErrors.push(`Lesson "${slug}" not found in DB - run seedPmpCurriculum.ts first.`);
        continue;
      }

      const durationMinutes = Math.max(1, Math.round(video.length / 60));
      const { error } = await supabaseAdmin
        .from("lessons")
        .update({ video_provider: "bunny", video_url: video.guid, duration_minutes: durationMinutes })
        .eq("id", (lesson as { id: string }).id);

      if (error) {
        applyErrors.push(`Failed to update lesson "${slug}": ${error.message}`);
      } else {
        applied.push({ entry, video });
      }
    }
  } else {
    applyErrors.push(`Course "${PMP_COURSE_SLUG}" not found - run seedPmpCurriculum.ts first. No lessons were updated.`);
  }

  // -------------------------------------------------------------------
  // Report (never prints BUNNY_STREAM_API_KEY or any credential).
  // -------------------------------------------------------------------
  console.log("========================================");
  console.log("BUNNY SYNC REPORT");
  console.log("========================================");
  console.log(`Total curriculum video references: ${TOTAL_CURRICULUM_LESSONS}`);
  console.log(`Matched (single, ready, applied): ${applied.length} / ${TOTAL_CURRICULUM_LESSONS}`);
  console.log(`Matched but not yet finished processing (not applied): ${notReady.length}`);
  console.log(`Ambiguous (multiple Bunny videos match): ${ambiguous.length}`);
  console.log(`Unmatched curriculum references: ${unmatched.length}`);
  console.log(`Unused Bunny videos (not referenced by any curriculum entry): ${unusedVideos.length}`);
  if (applyErrors.length > 0) {
    console.log(`Apply errors: ${applyErrors.length}`);
  }

  console.log("\n--- Matched & applied ---");
  for (const { entry, video } of applied) {
    const moduleNum = PMP_CURRICULUM.findIndex((m) => m.slug === entry.moduleSlug) + 1;
    console.log(
      `Module ${moduleNum} / Lesson ${entry.n} - "${entry.titleEn}" | ref: "${entry.bunnyReferenceName}" | guid: ${video.guid} | duration: ${Math.max(1, Math.round(video.length / 60))} min`
    );
  }

  if (notReady.length > 0) {
    console.log("\n--- Matched but not ready yet (Bunny still processing - not applied) ---");
    for (const { entry, video } of notReady) {
      console.log(`  - "${entry.bunnyReferenceName}" (module ${entry.moduleSlug}, lesson ${entry.n}) - guid ${video.guid}, status=${video.status}`);
    }
  }

  if (ambiguous.length > 0) {
    console.log("\n--- Ambiguous (needs manual resolution - not applied) ---");
    for (const { entry, candidates } of ambiguous) {
      console.log(`  - "${entry.bunnyReferenceName}" (module ${entry.moduleSlug}, lesson ${entry.n}) matched ${candidates.length} videos: ${candidates.map((c) => c.guid).join(", ")}`);
    }
  }

  if (unmatched.length > 0) {
    console.log("\n--- Unmatched curriculum references (no Bunny video found) ---");
    for (const entry of unmatched) {
      console.log(`  - "${entry.bunnyReferenceName}" (module ${entry.moduleSlug}, lesson ${entry.n}, "${entry.titleEn}")`);
    }
  }

  if (unusedVideos.length > 0) {
    console.log("\n--- Unused Bunny videos (present in library, not referenced by curriculum) ---");
    for (const v of unusedVideos) {
      console.log(`  - "${v.title}" (guid ${v.guid})`);
    }
  }

  if (applyErrors.length > 0) {
    console.log("\n--- Apply errors ---");
    applyErrors.forEach((e) => console.log(`  - ${e}`));
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Bunny sync FAILED:", err instanceof Error ? err.message : err);
  process.exit(1);
});
