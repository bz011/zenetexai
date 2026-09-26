"use server";

/**
 * AI Course Builder — admin supplies a course title, module titles, and
 * lesson titles; the AI fills in description/learning-objectives/estimated
 * duration/SEO slug. Same "single synchronous LLM call from within a
 * Server Action" pattern as aiGenerationReviseService.ts (a handful of
 * seconds, not a multi-item batch — never route a real multi-question/
 * multi-course batch through this pattern, that belongs in a CLI runner).
 *
 * Two-step, review-before-save by construction:
 *   1. generateCourseDraft() only calls the LLM and returns a draft object -
 *      it never touches the database.
 *   2. saveApprovedCourse() takes the (possibly admin-edited) draft and
 *      inserts it - always with is_published forced to false, regardless of
 *      what the caller sends, so there is no path from "AI generated this"
 *      to "students can see this" without the existing admin publish step
 *      (courseAdminService.ts's updateCourse/updateModule/updateLesson).
 *
 * Ordering: module/lesson order_index is simply the array index the admin
 * entered them in. The AI is asked for content, not reordering - preserving
 * the admin's own input order is safer and more predictable than trusting
 * the model to invent a sequence.
 */

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/requireRole";
import { getLLMProvider } from "@scripts/question-generation/llm";
import { courseFormSchema, moduleFormSchema, lessonFormSchema } from "@/lib/validators/courseValidators";
import type { CourseBuilderInput, CourseDraft } from "@/features/courses/types/course";

const MANAGE_ROLES = ["admin", "instructor"] as const;

interface RawDraftLesson {
  description_en: string;
  learning_objectives_en: string[];
  duration_minutes: number;
}
interface RawDraftModule {
  description_en: string;
  lessons: RawDraftLesson[];
}
interface RawCourseDraft {
  slug: string;
  description_en: string;
  modules: RawDraftModule[];
}

function buildCourseDraftSchema(input: CourseBuilderInput) {
  const lessonSchema = {
    type: "object",
    properties: {
      description_en: { type: "string" },
      learning_objectives_en: { type: "array", items: { type: "string" } },
      duration_minutes: { type: "integer" },
    },
    required: ["description_en", "learning_objectives_en", "duration_minutes"],
    additionalProperties: false,
  };
  const moduleSchema = {
    type: "object",
    properties: {
      description_en: { type: "string" },
      lessons: { type: "array", items: lessonSchema },
    },
    required: ["description_en", "lessons"],
    additionalProperties: false,
  };
  return {
    type: "object",
    properties: {
      slug: { type: "string" },
      description_en: { type: "string" },
      modules: { type: "array", items: moduleSchema },
    },
    required: ["slug", "description_en", "modules"],
    additionalProperties: false,
  };
}

function buildPrompt(input: CourseBuilderInput) {
  const outline = input.modules
    .map(
      (m, mi) =>
        `Module ${mi + 1}: "${m.title_en}"\n` + m.lessons.map((l, li) => `  Lesson ${mi + 1}.${li + 1}: "${l.title_en}"`).join("\n")
    )
    .join("\n\n");

  return {
    systemPrompt:
      "You are an instructional designer writing draft content for a professional certification-prep course. " +
      "Given a course title and an outline of module/lesson titles, write a course description, a description for " +
      "each module, and for each lesson: a short description, 2-4 concrete learning objectives, and a realistic " +
      "estimated duration in minutes (typically 5-30 for a single lesson). Also propose a URL-safe slug for the " +
      "course (lowercase letters, numbers, hyphens only). Return arrays in the exact same order and count as the " +
      "input outline - one modules[] entry per module listed, one lessons[] entry per lesson listed under it. " +
      "This is a DRAFT an editor will review and revise before publishing - do not invent titles, only describe " +
      "the ones given.",
    userPrompt: `Course title: "${input.title_en}"\n\nOutline:\n${outline}`,
    schema: buildCourseDraftSchema(input),
    schemaName: "course_draft",
  };
}

export interface GenerateDraftResult {
  success: boolean;
  draft?: CourseDraft;
  error?: string;
}

export async function generateCourseDraft(input: CourseBuilderInput): Promise<GenerateDraftResult> {
  await requireRole([...MANAGE_ROLES]);

  if (!input.title_en.trim()) return { success: false, error: "Course title is required." };
  if (input.modules.length === 0) return { success: false, error: "Add at least one module." };
  for (const m of input.modules) {
    if (!m.title_en.trim()) return { success: false, error: "Every module needs a title." };
    if (m.lessons.length === 0) return { success: false, error: `Module "${m.title_en}" needs at least one lesson.` };
    for (const l of m.lessons) {
      if (!l.title_en.trim()) return { success: false, error: `Every lesson in "${m.title_en}" needs a title.` };
    }
  }

  let raw: RawCourseDraft;
  try {
    const provider = getLLMProvider();
    const result = await provider.generateStructured<RawCourseDraft>({ ...buildPrompt(input), model: provider.defaultModel });
    raw = result.data;
  } catch (err) {
    console.error("[AI_COURSE_BUILDER_ERROR] generation failed", { message: err instanceof Error ? err.message : String(err) });
    return { success: false, error: "AI generation failed. Please try again." };
  }

  if (raw.modules.length !== input.modules.length) {
    return { success: false, error: "AI response didn't match the number of modules given. Please try again." };
  }
  for (let i = 0; i < input.modules.length; i++) {
    if (raw.modules[i].lessons.length !== input.modules[i].lessons.length) {
      return { success: false, error: `AI response didn't match the number of lessons in module "${input.modules[i].title_en}". Please try again.` };
    }
  }

  const draft: CourseDraft = {
    title_en: input.title_en,
    slug: raw.slug,
    description_en: raw.description_en,
    modules: input.modules.map((m, mi) => ({
      title_en: m.title_en,
      description_en: raw.modules[mi].description_en,
      order_index: mi,
      lessons: m.lessons.map((l, li) => ({
        title_en: l.title_en,
        description_en: raw.modules[mi].lessons[li].description_en,
        learning_objectives_en: raw.modules[mi].lessons[li].learning_objectives_en,
        duration_minutes: raw.modules[mi].lessons[li].duration_minutes,
        order_index: li,
      })),
    })),
  };

  return { success: true, draft };
}

export interface SaveDraftResult {
  success: boolean;
  courseId?: string;
  error?: string;
}

/** Renders learning objectives into the lesson's markdown body alongside its description - a starting draft, not final lesson content. */
function lessonContentFromDraft(description: string, objectives: string[]): string {
  const objectiveLines = objectives.map((o) => `- ${o}`).join("\n");
  return `${description}\n\n**Learning objectives:**\n${objectiveLines}`;
}

export async function saveApprovedCourse(draft: CourseDraft): Promise<SaveDraftResult> {
  const { supabase } = await requireRole([...MANAGE_ROLES]);

  const courseParsed = courseFormSchema.safeParse({
    slug: draft.slug,
    title_en: draft.title_en,
    title_ar: "",
    description_en: draft.description_en,
    description_ar: "",
    order_index: 0,
    is_published: false, // never trusted from the caller - see file header
  });
  if (!courseParsed.success) {
    return { success: false, error: `Invalid course data: ${Object.keys(courseParsed.error.flatten().fieldErrors).join(", ")}` };
  }

  const { data: course, error: courseError } = await supabase.from("courses").insert(courseParsed.data).select("id").single();
  if (courseError || !course) {
    console.error("[AI_COURSE_BUILDER_ERROR] course insert failed", { message: courseError?.message });
    return { success: false, error: "Failed to save course. Please try again." };
  }
  const courseId = (course as { id: string }).id;

  for (const mod of draft.modules) {
    const moduleParsed = moduleFormSchema.safeParse({
      title_en: mod.title_en,
      title_ar: "",
      description_en: mod.description_en,
      description_ar: "",
      order_index: mod.order_index,
      is_published: false,
    });
    if (!moduleParsed.success) {
      return { success: false, courseId, error: `Invalid data for module "${mod.title_en}" - course was partially saved as a draft.` };
    }

    const { data: moduleRow, error: moduleError } = await supabase
      .from("modules")
      .insert({ ...moduleParsed.data, course_id: courseId })
      .select("id")
      .single();
    if (moduleError || !moduleRow) {
      console.error("[AI_COURSE_BUILDER_ERROR] module insert failed", { message: moduleError?.message });
      return { success: false, courseId, error: `Failed to save module "${mod.title_en}" - course was partially saved as a draft.` };
    }
    const moduleId = (moduleRow as { id: string }).id;

    for (const lesson of mod.lessons) {
      const lessonParsed = lessonFormSchema.safeParse({
        title_en: lesson.title_en,
        title_ar: "",
        content_en: lessonContentFromDraft(lesson.description_en, lesson.learning_objectives_en),
        content_ar: "",
        video_provider: "none",
        video_url: "",
        duration_minutes: lesson.duration_minutes,
        order_index: lesson.order_index,
        is_published: false,
      });
      if (!lessonParsed.success) {
        return { success: false, courseId, error: `Invalid data for lesson "${lesson.title_en}" - course was partially saved as a draft.` };
      }

      const { error: lessonError } = await supabase.from("lessons").insert({ ...lessonParsed.data, module_id: moduleId });
      if (lessonError) {
        console.error("[AI_COURSE_BUILDER_ERROR] lesson insert failed", { message: lessonError.message });
        return { success: false, courseId, error: `Failed to save lesson "${lesson.title_en}" - course was partially saved as a draft.` };
      }
    }
  }

  revalidatePath("/admin/courses");
  revalidatePath(`/admin/courses/${courseId}`);
  return { success: true, courseId };
}
