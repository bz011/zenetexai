/**
 * Deterministic, idempotent seed/upsert for the real PMP Mastery Program
 * curriculum (see pmpCurriculum.ts — the source of truth for module/lesson
 * structure, ordering, and bilingual titles).
 *
 * This script owns ONLY curriculum content: title_en/title_ar, slug,
 * bunny_reference_name, order_index, is_published, module_id/course_id
 * linkage. It never touches video_provider/video_url/duration_minutes —
 * that is bunnySync.ts's job exclusively, so a curriculum-text rerun here
 * can never clobber an already-matched video, and a Bunny sync rerun can
 * never touch titles/ordering.
 *
 * Safety model:
 *  - Every module/lesson is matched by its stable slug (module: course_id +
 *    slug; lesson: module_id + slug — see migration 022), never by
 *    position/index and never by title text, so reruns update in place
 *    instead of duplicating.
 *  - Pre-existing modules with no slug (i.e. content created before this
 *    curriculum/slug convention existed — placeholder/test content) are
 *    inspected before touching anything: a placeholder module is only
 *    ever deleted if NONE of its lessons have any lesson_progress rows.
 *    If real student progress is attached, it is left alone and reported
 *    instead of guessed at.
 *  - Never deletes/touches purchases, entitlements, or enrollments — this
 *    script only writes to modules/lessons (and, only for a placeholder
 *    module confirmed to have zero real progress, cascades the delete of
 *    that module's own lessons/assessments via existing FK ON DELETE
 *    CASCADE, exactly as migration 006 already defines).
 *
 * Usage: npx tsx scripts/curriculum/seedPmpCurriculum.ts
 */

import { config as loadEnv } from "dotenv";
import path from "node:path";
loadEnv({ path: path.resolve(__dirname, "../../.env.local") });

import { supabaseAdmin } from "../../src/lib/supabase/admin";
import { PMP_COURSE_SLUG, PMP_CURRICULUM, lessonSlug, TOTAL_CURRICULUM_LESSONS } from "./pmpCurriculum";

interface ModuleRow {
  id: string;
  course_id: string;
  slug: string | null;
  title_en: string;
}

interface LessonRow {
  id: string;
  module_id: string;
  slug: string | null;
  title_en: string;
}

async function main() {
  console.log(`Seeding PMP Mastery Program curriculum (${PMP_CURRICULUM.length} modules, ${TOTAL_CURRICULUM_LESSONS} lessons)...\n`);

  const { data: course, error: courseError } = await supabaseAdmin
    .from("courses")
    .select("id, slug")
    .eq("slug", PMP_COURSE_SLUG)
    .maybeSingle();

  if (courseError || !course) {
    console.error(`FATAL: course with slug "${PMP_COURSE_SLUG}" not found. Refusing to create a new course - this script only populates curriculum into the EXISTING course. No changes made.`);
    process.exit(1);
  }
  const courseId = (course as { id: string }).id;
  console.log(`Found existing course "${PMP_COURSE_SLUG}" (id=${courseId}).\n`);

  // ---------------------------------------------------------------------
  // Step 1: inspect and safely clean up pre-existing placeholder modules
  // (anything with no slug predates this seed's slug convention).
  // ---------------------------------------------------------------------
  const { data: existingModules } = await supabaseAdmin
    .from("modules")
    .select("id, course_id, slug, title_en")
    .eq("course_id", courseId);

  const placeholderModules = ((existingModules ?? []) as ModuleRow[]).filter((m) => !m.slug);

  const placeholderReports: string[] = [];
  for (const mod of placeholderModules) {
    const { data: modLessons } = await supabaseAdmin.from("lessons").select("id, title_en").eq("module_id", mod.id);
    const lessonIds = ((modLessons ?? []) as { id: string; title_en: string }[]).map((l) => l.id);

    let progressCount = 0;
    if (lessonIds.length > 0) {
      const { count } = await supabaseAdmin
        .from("lesson_progress")
        .select("id", { count: "exact", head: true })
        .in("lesson_id", lessonIds);
      progressCount = count ?? 0;
    }

    if (progressCount > 0) {
      placeholderReports.push(
        `KEPT (has real progress): placeholder module "${mod.title_en}" (id=${mod.id}) has ${progressCount} lesson_progress row(s) across its ${lessonIds.length} lesson(s) - left untouched. Resolve manually.`
      );
      continue;
    }

    // Zero progress anywhere under this module - safe to remove. Cascades
    // its lessons and any learning_assessments tied to them (migration 006
    // ON DELETE CASCADE) - nothing else references a lesson/module id.
    const { error: deleteError } = await supabaseAdmin.from("modules").delete().eq("id", mod.id);
    if (deleteError) {
      placeholderReports.push(`FAILED to delete placeholder module "${mod.title_en}" (id=${mod.id}): ${deleteError.message}`);
    } else {
      placeholderReports.push(`REMOVED placeholder module "${mod.title_en}" (id=${mod.id}, ${lessonIds.length} lesson(s), zero progress).`);
    }
  }

  if (placeholderReports.length > 0) {
    console.log("Placeholder module cleanup:");
    placeholderReports.forEach((line) => console.log(`  - ${line}`));
    console.log("");
  } else {
    console.log("No placeholder (slug-less) modules found under this course.\n");
  }

  // ---------------------------------------------------------------------
  // Step 2: upsert the 6 real modules and their lessons, keyed by slug.
  // ---------------------------------------------------------------------
  let modulesCreated = 0;
  let modulesUpdated = 0;
  let lessonsCreated = 0;
  let lessonsUpdated = 0;

  for (const mod of PMP_CURRICULUM) {
    const { data: existing } = await supabaseAdmin
      .from("modules")
      .select("id")
      .eq("course_id", courseId)
      .eq("slug", mod.slug)
      .maybeSingle();

    let moduleId: string;
    const modulePayload = {
      title_en: mod.titleEn,
      title_ar: mod.titleAr,
      order_index: mod.orderIndex,
      is_published: true,
    };

    if (existing) {
      moduleId = (existing as { id: string }).id;
      const { error } = await supabaseAdmin.from("modules").update(modulePayload).eq("id", moduleId);
      if (error) throw new Error(`Failed to update module "${mod.slug}": ${error.message}`);
      modulesUpdated++;
    } else {
      const { data: inserted, error } = await supabaseAdmin
        .from("modules")
        .insert({ ...modulePayload, course_id: courseId, slug: mod.slug })
        .select("id")
        .single();
      if (error || !inserted) throw new Error(`Failed to insert module "${mod.slug}": ${error?.message}`);
      moduleId = (inserted as { id: string }).id;
      modulesCreated++;
    }

    for (const lesson of mod.lessons) {
      const slug = lessonSlug(mod.slug, lesson.n);
      const { data: existingLesson } = await supabaseAdmin
        .from("lessons")
        .select("id")
        .eq("module_id", moduleId)
        .eq("slug", slug)
        .maybeSingle();

      const lessonPayload = {
        title_en: lesson.titleEn,
        title_ar: lesson.titleAr,
        order_index: lesson.n - 1,
        is_published: lesson.isPublished,
        bunny_reference_name: lesson.bunnyReferenceName,
      };

      if (existingLesson) {
        const { error } = await supabaseAdmin.from("lessons").update(lessonPayload).eq("id", (existingLesson as { id: string }).id);
        if (error) throw new Error(`Failed to update lesson "${slug}": ${error.message}`);
        lessonsUpdated++;
      } else {
        const { error } = await supabaseAdmin.from("lessons").insert({
          ...lessonPayload,
          module_id: moduleId,
          slug,
          video_provider: "none",
          video_url: null,
        });
        if (error) throw new Error(`Failed to insert lesson "${slug}": ${error.message}`);
        lessonsCreated++;
      }
    }
  }

  console.log("Curriculum seed complete:");
  console.log(`  Modules created: ${modulesCreated}, updated: ${modulesUpdated}`);
  console.log(`  Lessons created: ${lessonsCreated}, updated: ${lessonsUpdated}`);
  console.log(`\nNext step: npx tsx scripts/curriculum/bunnySync.ts (requires BUNNY_STREAM_API_KEY) to attach real Bunny videos.`);
}

main().catch((err) => {
  console.error("Curriculum seed FAILED:", err instanceof Error ? err.message : err);
  process.exit(1);
});
