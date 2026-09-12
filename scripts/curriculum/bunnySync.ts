#!/usr/bin/env node
/**
 * Server-only Bunny Stream matching/sync for the PMP Mastery Program
 * curriculum. Queries the Bunny Stream MANAGEMENT API (video.bunnycdn.com -
 * distinct from the public iframe embed surface already used by the
 * player in bunnyVideo.ts/VideoEmbed.tsx, which is untouched by this
 * script) to list every video in the library, matches each against
 * pmpCurriculum.ts's `bunnyReferenceName` by exact normalized-title
 * comparison, and — only for a confident single match on a fully
 * processed video with no conflicting existing attachment — attaches its
 * GUID/duration to the corresponding lesson row via the EXISTING columns
 * (video_provider/video_url/duration_minutes, migration 006). Never writes
 * bunny_reference_name here (that is seedPmpCurriculum.ts's job) and never
 * touches title/order/publication state.
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
 * exact string comparisons, never fuzzy/partial matching. Unchanged from
 * the original version of this script.
 *
 * DEFAULT MODE IS DRY RUN: queries Bunny, inspects the curriculum, computes
 * every lesson's status, and prints a full report - but makes ZERO database
 * writes - unless --apply is passed explicitly. This makes it safe to run
 * repeatedly (e.g. from an operator's own machine, or CI) purely to see
 * current state before ever touching production data.
 *
 * MODULE SCOPE: defaults to the entire curriculum. Pass --module <n> (1-based,
 * matching how modules are referred to everywhere else - "Module 3" is
 * PMP_CURRICULUM[2]) to restrict both matching and any writes to that one
 * module only. Every other module's lessons are never read for write
 * purposes and never touched.
 *
 * CONFLICT PROTECTION: a lesson with no existing video is MATCH (safe to
 * attach). A lesson already holding the exact same bunny provider+GUID is
 * ALREADY_CORRECT (left untouched, not re-written). A lesson already
 * holding ANY different video (a different bunny GUID, or a different
 * provider like youtube/vimeo entirely) is CONFLICT - this script NEVER
 * overwrites it automatically, regardless of --apply; it is only ever
 * reported for manual review.
 *
 * Idempotent: safe to rerun any time (e.g. once more videos finish Bunny's
 * encoding pipeline, or after fixing an ambiguous filename in the Bunny
 * dashboard) - only ever overwrites a lesson's video_provider/video_url/
 * duration_minutes when that lesson currently has no video, never guesses,
 * never touches an existing conflicting attachment, never deletes/renames/
 * reuploads anything in Bunny. Applying twice in a row produces zero writes
 * the second time (every previously-applied row reports ALREADY_CORRECT).
 *
 * Usage:
 *   npm run bunny-sync                        (dry run, entire curriculum)
 *   npm run bunny-sync -- --module 3          (dry run, Module 3 only)
 *   npm run bunny-sync -- --module 3 --apply  (writes MATCH rows in Module 3 only)
 *   npm run bunny-sync -- --apply             (writes MATCH rows across the whole curriculum)
 */

import { config as loadEnv } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
loadEnv({ path: path.resolve(__dirname, "../../.env.local") });

import { supabaseAdmin } from "../../src/lib/supabase/admin";
import { PMP_COURSE_SLUG, PMP_CURRICULUM, lessonSlug } from "./pmpCurriculum";

const BUNNY_STREAM_FINISHED_STATUS = 4;

export interface BunnyVideo {
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

export function normalize(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").toLowerCase();
}

export function stripExtension(s: string): string {
  return s.replace(/\.(mp4|mov|m4v|webm)$/i, "");
}

export function matchKeys(raw: string): string[] {
  const n = normalize(raw);
  const stripped = stripExtension(n);
  return stripped === n ? [n] : [n, stripped];
}

export async function fetchAllBunnyVideos(libraryId: string, apiKey: string): Promise<BunnyVideo[]> {
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

export function buildIndex(videos: BunnyVideo[]): Map<string, BunnyVideo[]> {
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

export function findCandidates(index: Map<string, BunnyVideo[]>, reference: string): BunnyVideo[] {
  const found = new Map<string, BunnyVideo>();
  for (const key of matchKeys(reference)) {
    for (const v of index.get(key) ?? []) found.set(v.guid, v);
  }
  return [...found.values()];
}

export interface CurriculumEntry {
  moduleNumber: number; // 1-based position in PMP_CURRICULUM, stable regardless of --module filtering
  moduleSlug: string;
  moduleTitleEn: string;
  n: number;
  titleEn: string;
  bunnyReferenceName: string;
}

/** Absolute module numbering is computed from the FULL curriculum before any
 * --module filtering is applied, so "Module 3" always means the same thing
 * in the report regardless of scope. */
export function flattenCurriculum(): CurriculumEntry[] {
  const entries: CurriculumEntry[] = [];
  PMP_CURRICULUM.forEach((mod, i) => {
    for (const lesson of mod.lessons) {
      entries.push({
        moduleNumber: i + 1,
        moduleSlug: mod.slug,
        moduleTitleEn: mod.titleEn,
        n: lesson.n,
        titleEn: lesson.titleEn,
        bunnyReferenceName: lesson.bunnyReferenceName,
      });
    }
  });
  return entries;
}

export function filterByModule(entries: CurriculumEntry[], moduleNumber: number | undefined): CurriculumEntry[] {
  if (moduleNumber === undefined) return entries;
  return entries.filter((e) => e.moduleNumber === moduleNumber);
}

export type SyncStatus = "MATCH" | "ALREADY_CORRECT" | "MISSING" | "AMBIGUOUS" | "CONFLICT";

export interface LessonCurrentState {
  provider: string;
  videoUrl: string | null;
}

export interface ComputedMatch {
  status: SyncStatus;
  matchedVideo?: BunnyVideo;
  ambiguousCandidates?: BunnyVideo[];
}

/**
 * Pure decision logic - no I/O. Given the (possibly empty/ambiguous) set of
 * Bunny candidates for one lesson's bunnyReferenceName and that lesson's
 * CURRENT provider/video_url, decides the single status this script ever
 * reports or acts on. This is the one place conflict protection and
 * idempotency are decided, so it is covered directly by unit tests rather
 * than only indirectly through a full script run.
 */
export function computeMatchStatus(candidates: BunnyVideo[], current: LessonCurrentState): ComputedMatch {
  if (candidates.length === 0) {
    return { status: "MISSING" };
  }
  if (candidates.length > 1) {
    return { status: "AMBIGUOUS", ambiguousCandidates: candidates };
  }

  const video = candidates[0];
  if (video.status !== BUNNY_STREAM_FINISHED_STATUS) {
    // Matched a real Bunny video, but it hasn't finished processing yet -
    // never safe to attach. Reported as MISSING (not yet available), same
    // as no match at all, per the fixed 5-status contract.
    return { status: "MISSING" };
  }

  const hasExistingVideo = current.provider !== "none" || Boolean(current.videoUrl);
  if (!hasExistingVideo) {
    return { status: "MATCH", matchedVideo: video };
  }
  if (current.provider === "bunny" && current.videoUrl === video.guid) {
    return { status: "ALREADY_CORRECT", matchedVideo: video };
  }
  return { status: "CONFLICT", matchedVideo: video };
}

export interface ParsedArgs {
  moduleNumber?: number;
  apply: boolean;
}

export function parseArgs(argv: string[]): ParsedArgs {
  let moduleNumber: number | undefined;
  let apply = false;

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--module") {
      const raw = argv[++i];
      const n = raw ? Number(raw) : NaN;
      if (!Number.isInteger(n) || n < 1) {
        throw new Error(`Invalid --module value: "${raw ?? ""}". Must be a positive integer (1-based module number, e.g. --module 3).`);
      }
      moduleNumber = n;
    } else if (argv[i] === "--apply") {
      apply = true;
    }
  }

  return { moduleNumber, apply };
}

export interface SyncRow extends CurriculumEntry {
  lessonId: string | null;
  currentProvider: string;
  currentVideoUrl: string | null;
  computed: ComputedMatch;
}

/** Reads (never writes) the course/module/lesson rows needed to compute
 * every entry's current state. Read-only by construction - safe to call in
 * dry-run mode with no risk to production data. */
export async function loadCurrentLessonStates(entries: CurriculumEntry[]): Promise<SyncRow[]> {
  const { data: course } = await supabaseAdmin.from("courses").select("id").eq("slug", PMP_COURSE_SLUG).maybeSingle();
  const courseId = (course as { id: string } | null)?.id ?? null;

  const moduleIdCache = new Map<string, string | null>();
  async function getModuleId(slug: string): Promise<string | null> {
    if (!courseId) return null;
    if (moduleIdCache.has(slug)) return moduleIdCache.get(slug)!;
    const { data } = await supabaseAdmin.from("modules").select("id").eq("course_id", courseId).eq("slug", slug).maybeSingle();
    const id = (data as { id: string } | null)?.id ?? null;
    moduleIdCache.set(slug, id);
    return id;
  }

  const rows: SyncRow[] = [];
  for (const entry of entries) {
    const modId = await getModuleId(entry.moduleSlug);
    let lessonId: string | null = null;
    let currentProvider = "none";
    let currentVideoUrl: string | null = null;

    if (modId) {
      const slug = lessonSlug(entry.moduleSlug, entry.n);
      const { data: lesson } = await supabaseAdmin
        .from("lessons")
        .select("id, video_provider, video_url")
        .eq("module_id", modId)
        .eq("slug", slug)
        .maybeSingle();
      if (lesson) {
        const l = lesson as { id: string; video_provider: string; video_url: string | null };
        lessonId = l.id;
        currentProvider = l.video_provider;
        currentVideoUrl = l.video_url;
      }
    }

    rows.push({ ...entry, lessonId, currentProvider, currentVideoUrl, computed: { status: "MISSING" } });
  }
  return rows;
}

/**
 * Applies writes for MATCH rows only - the single enforcement point for
 * "apply safety" (requirement 6). ALREADY_CORRECT/MISSING/AMBIGUOUS/CONFLICT
 * rows are never passed to an update call here, regardless of caller intent,
 * so a bug elsewhere in the script cannot accidentally widen what gets
 * written.
 */
export async function applyMatches(rows: SyncRow[]): Promise<{ applied: SyncRow[]; errors: string[] }> {
  const applied: SyncRow[] = [];
  const errors: string[] = [];

  for (const row of rows) {
    if (row.computed.status !== "MATCH" || !row.computed.matchedVideo) continue;

    if (!row.lessonId) {
      errors.push(`Module ${row.moduleNumber} lesson ${row.n} ("${row.titleEn}"): lesson row not found in DB - run seedPmpCurriculum.ts first.`);
      continue;
    }

    const durationMinutes = Math.max(1, Math.round(row.computed.matchedVideo.length / 60));
    const { error } = await supabaseAdmin
      .from("lessons")
      .update({ video_provider: "bunny", video_url: row.computed.matchedVideo.guid, duration_minutes: durationMinutes })
      .eq("id", row.lessonId);

    if (error) {
      errors.push(`Module ${row.moduleNumber} lesson ${row.n} ("${row.titleEn}"): ${error.message}`);
    } else {
      applied.push(row);
    }
  }

  return { applied, errors };
}

function formatCurrent(row: Pick<SyncRow, "currentProvider" | "currentVideoUrl">): string {
  return row.currentProvider === "none" ? "none" : `${row.currentProvider}:${row.currentVideoUrl}`;
}

function printReport(rows: SyncRow[], opts: { moduleNumber?: number; apply: boolean; applied: SyncRow[]; applyErrors: string[] }): void {
  const appliedIds = new Set(opts.applied.map((r) => r.lessonId));

  console.log("========================================");
  console.log("BUNNY SYNC REPORT");
  console.log("========================================");
  console.log(`Scope: ${opts.moduleNumber !== undefined ? `Module ${opts.moduleNumber} (${rows[0]?.moduleTitleEn ?? "not found"})` : "Entire curriculum"}`);
  console.log(`Mode: ${opts.apply ? "APPLY" : "DRY RUN - no database writes were made"}\n`);

  console.log(["Module", "Lesson", "Title", "Expected Ref", "Matched Title", "Matched GUID", "Current", "Status"].join(" | "));
  for (const row of rows) {
    const matchedTitle = row.computed.matchedVideo?.title ?? (row.computed.ambiguousCandidates ? `${row.computed.ambiguousCandidates.length} candidates` : "-");
    const matchedGuid = row.computed.matchedVideo?.guid ?? "-";
    const displayStatus = row.computed.status === "MATCH" && appliedIds.has(row.lessonId) ? "MATCH (applied)" : row.computed.status;
    console.log(
      `${row.moduleNumber} | ${row.n} | ${row.titleEn} | ${row.bunnyReferenceName} | ${matchedTitle} | ${matchedGuid} | ${formatCurrent(row)} | ${displayStatus}`
    );
  }

  const totals: Record<SyncStatus, number> = { MATCH: 0, ALREADY_CORRECT: 0, MISSING: 0, AMBIGUOUS: 0, CONFLICT: 0 };
  for (const row of rows) totals[row.computed.status]++;

  console.log("\n--- Totals ---");
  console.log(`Total lessons in scope: ${rows.length}`);
  console.log(`MATCH (safe to attach): ${totals.MATCH}`);
  console.log(`ALREADY_CORRECT: ${totals.ALREADY_CORRECT}`);
  console.log(`MISSING: ${totals.MISSING}`);
  console.log(`AMBIGUOUS: ${totals.AMBIGUOUS}`);
  console.log(`CONFLICT: ${totals.CONFLICT}`);

  if (opts.apply) {
    console.log(`\nApplied (written): ${opts.applied.length}`);
    if (opts.applyErrors.length > 0) {
      console.log(`Apply errors: ${opts.applyErrors.length}`);
      opts.applyErrors.forEach((e) => console.log(`  - ${e}`));
    }
  } else {
    console.log(`\nDRY RUN - no database writes were made. ${totals.MATCH} lesson(s) would be attached if run with --apply.`);
  }

  if (totals.CONFLICT > 0) {
    console.log("\n--- Conflicts (never auto-resolved - manual review required) ---");
    for (const row of rows.filter((r) => r.computed.status === "CONFLICT")) {
      console.log(`  Module ${row.moduleNumber} Lesson ${row.n} "${row.titleEn}": existing ${formatCurrent(row)} vs new candidate ${row.computed.matchedVideo?.guid} ("${row.computed.matchedVideo?.title}")`);
    }
  }

  if (totals.AMBIGUOUS > 0) {
    console.log("\n--- Ambiguous (multiple Bunny videos match - never auto-resolved) ---");
    for (const row of rows.filter((r) => r.computed.status === "AMBIGUOUS")) {
      console.log(`  Module ${row.moduleNumber} Lesson ${row.n} "${row.titleEn}": ${row.computed.ambiguousCandidates?.map((c) => `${c.guid} ("${c.title}")`).join(", ")}`);
    }
  }

  console.log("\nDone.");
}

export async function main(): Promise<void> {
  let parsed: ParsedArgs;
  try {
    parsed = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error((err as Error).message);
    process.exit(1);
  }
  const { moduleNumber, apply } = parsed;

  if (moduleNumber !== undefined && moduleNumber > PMP_CURRICULUM.length) {
    console.error(`--module ${moduleNumber} is out of range. This curriculum has ${PMP_CURRICULUM.length} modules.`);
    process.exit(1);
  }

  const apiKey = process.env.BUNNY_STREAM_API_KEY;
  const libraryId = process.env.NEXT_PUBLIC_BUNNY_STREAM_LIBRARY_ID;

  if (!apiKey) {
    console.error(
      "BUNNY_STREAM_API_KEY is not set - cannot query the Bunny Stream API.\n" +
        "Set it as a server-only environment variable (never NEXT_PUBLIC_):\n" +
        "  - Locally: add BUNNY_STREAM_API_KEY=<your Bunny Stream API key> to .env.local\n" +
        "  - Vercel: Project Settings -> Environment Variables -> add BUNNY_STREAM_API_KEY for Production (and Preview if used), scoped server-only.\n" +
        "No changes were made."
    );
    process.exit(1);
  }
  if (!libraryId) {
    console.error("NEXT_PUBLIC_BUNNY_STREAM_LIBRARY_ID is not set. This is required to know which Bunny library to query. No changes were made.");
    process.exit(1);
  }

  console.log(apply ? "Mode: APPLY (writes enabled for safe MATCH rows only)" : "Mode: DRY RUN (default - no database writes; pass --apply to write)");
  console.log(moduleNumber !== undefined ? `Scope: Module ${moduleNumber} only` : "Scope: entire curriculum");
  console.log("");

  console.log("Fetching video list from Bunny Stream...");
  const videos = await fetchAllBunnyVideos(libraryId, apiKey);
  console.log(`Fetched ${videos.length} video(s) from Bunny library ${libraryId}.\n`);
  const index = buildIndex(videos);

  const allEntries = flattenCurriculum();
  const entries = filterByModule(allEntries, moduleNumber);

  if (entries.length === 0) {
    console.error(`No curriculum entries found for the requested scope. Nothing to do.`);
    process.exit(1);
  }

  const rows = await loadCurrentLessonStates(entries);
  for (const row of rows) {
    const candidates = findCandidates(index, row.bunnyReferenceName);
    row.computed = computeMatchStatus(candidates, { provider: row.currentProvider, videoUrl: row.currentVideoUrl });
  }

  let applied: SyncRow[] = [];
  let applyErrors: string[] = [];
  if (apply) {
    const result = await applyMatches(rows);
    applied = result.applied;
    applyErrors = result.errors;
  }

  printReport(rows, { moduleNumber, apply, applied, applyErrors });

  process.exit(applyErrors.length > 0 ? 1 : 0);
}

// Only run main() when this file is executed directly (npx tsx / npm run
// bunny-sync), never when imported by a test file - mirrors the same
// pattern already used in scripts/question-generation/generateBatch.ts.
const isDirectRun = process.argv[1] ? path.resolve(process.argv[1]) === fileURLToPath(import.meta.url) : false;
if (isDirectRun) {
  main().catch((err) => {
    console.error("Bunny sync FAILED:", err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
