"use server";

/**
 * Admin course/module/lesson CRUD (create + update only — no delete UI this
 * sprint; unpublish via is_published is the practical equivalent for
 * content that's meant to be kept, not destroyed).
 *
 * Every action calls requireRole(['admin','instructor']) first. RLS on
 * courses/modules/lessons enforces the same restriction as a backstop —
 * this isn't the only thing standing between a student and a write.
 *
 * FormData conversion is explicit and separate from validation (see
 * courseValidators.ts's comment) - each form has its own
 * *InputFromFormData() helper that reads raw FormData and produces a
 * properly-typed object (checkbox -> boolean via a real "was it present"
 * check, number input -> number via Number(), everything else -> string),
 * which is THEN handed to the zod schema for business-rule validation only.
 */

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/requireRole";
import {
  courseFormSchema,
  moduleFormSchema,
  lessonFormSchema,
} from "@/lib/validators/courseValidators";

const MANAGE_ROLES = ["admin", "instructor"] as const;

export interface CourseActionResult {
  success: boolean;
  /** field name -> list of human-readable issues for that field, from zod's flatten(). */
  fieldErrors?: Record<string, string[]>;
  error?: string;
}

function toBoolean(value: FormDataEntryValue | null): boolean {
  // A real HTML checkbox that's unchecked is OMITTED from FormData entirely
  // (no key at all) - it never reaches here as "false", the key is just
  // absent, so `value === null` covers that case. When checked, browsers
  // submit the checkbox's value attribute, defaulting to the literal
  // string "on" if none is set (this form never sets one).
  return value === "on" || value === "true" || value === "1";
}

function toNumber(value: FormDataEntryValue | null, fallback = 0): number {
  if (value === null || value === "") return fallback;
  const n = Number(value);
  return Number.isNaN(n) ? fallback : n;
}

function toOptionalNumber(value: FormDataEntryValue | null): number | undefined {
  if (value === null || value === "") return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
}

function courseInputFromFormData(formData: FormData) {
  return {
    slug: String(formData.get("slug") ?? ""),
    title_en: String(formData.get("title_en") ?? ""),
    title_ar: String(formData.get("title_ar") ?? ""),
    description_en: String(formData.get("description_en") ?? ""),
    description_ar: String(formData.get("description_ar") ?? ""),
    order_index: toNumber(formData.get("order_index")),
    is_published: toBoolean(formData.get("is_published")),
  };
}

function moduleInputFromFormData(formData: FormData) {
  return {
    title_en: String(formData.get("title_en") ?? ""),
    title_ar: String(formData.get("title_ar") ?? ""),
    description_en: String(formData.get("description_en") ?? ""),
    description_ar: String(formData.get("description_ar") ?? ""),
    order_index: toNumber(formData.get("order_index")),
    is_published: toBoolean(formData.get("is_published")),
  };
}

function lessonInputFromFormData(formData: FormData) {
  return {
    title_en: String(formData.get("title_en") ?? ""),
    title_ar: String(formData.get("title_ar") ?? ""),
    content_en: String(formData.get("content_en") ?? ""),
    content_ar: String(formData.get("content_ar") ?? ""),
    video_provider: String(formData.get("video_provider") ?? "none"),
    video_url: String(formData.get("video_url") ?? ""),
    duration_minutes: toOptionalNumber(formData.get("duration_minutes")),
    order_index: toNumber(formData.get("order_index")),
    is_published: toBoolean(formData.get("is_published")),
  };
}

/** Never throws a bare "Invalid X data" - logs the real field errors server-side and, for actions not wired to useFormState, throws a message that names the failing fields (never raw submitted values, which could be arbitrarily long/contain unrelated content). */
function logAndSummarize(actionName: string, fieldErrors: Record<string, string[] | undefined>): string {
  console.error(`[${actionName}] validation failed:`, fieldErrors);
  const summary = Object.entries(fieldErrors)
    .filter(([, issues]) => issues && issues.length > 0)
    .map(([field, issues]) => `${field} (${issues!.join(", ")})`)
    .join("; ");
  return `Invalid data: ${summary || "unknown validation error"}`;
}

export async function createCourse(
  _prevState: CourseActionResult,
  formData: FormData
): Promise<CourseActionResult> {
  const { supabase } = await requireRole([...MANAGE_ROLES]);

  const parsed = courseFormSchema.safeParse(courseInputFromFormData(formData));
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    console.error("[createCourse] validation failed:", fieldErrors);
    return { success: false, fieldErrors };
  }

  const { error } = await supabase.from("courses").insert(parsed.data);
  if (error) {
    console.error("[createCourse] insert failed:", error.message);
    return { success: false, error: "Failed to create course. Please try again." };
  }

  revalidatePath("/admin/courses");
  redirect("/admin/courses");
}

export async function updateCourse(courseId: string, formData: FormData) {
  const { supabase } = await requireRole([...MANAGE_ROLES]);

  const parsed = courseFormSchema.safeParse(courseInputFromFormData(formData));
  if (!parsed.success) {
    throw new Error(logAndSummarize("updateCourse", parsed.error.flatten().fieldErrors));
  }

  const { error } = await supabase.from("courses").update(parsed.data).eq("id", courseId);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath("/admin/courses");
}

export async function createModule(courseId: string, formData: FormData) {
  const { supabase } = await requireRole([...MANAGE_ROLES]);

  const parsed = moduleFormSchema.safeParse(moduleInputFromFormData(formData));
  if (!parsed.success) {
    throw new Error(logAndSummarize("createModule", parsed.error.flatten().fieldErrors));
  }

  const { error } = await supabase.from("modules").insert({ ...parsed.data, course_id: courseId });
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/courses/${courseId}`);
}

export async function updateModule(courseId: string, moduleId: string, formData: FormData) {
  const { supabase } = await requireRole([...MANAGE_ROLES]);

  const parsed = moduleFormSchema.safeParse(moduleInputFromFormData(formData));
  if (!parsed.success) {
    throw new Error(logAndSummarize("updateModule", parsed.error.flatten().fieldErrors));
  }

  const { error } = await supabase.from("modules").update(parsed.data).eq("id", moduleId);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/courses/${courseId}/modules/${moduleId}`);
  revalidatePath(`/admin/courses/${courseId}`);
}

export async function createLesson(courseId: string, moduleId: string, formData: FormData) {
  const { supabase } = await requireRole([...MANAGE_ROLES]);

  const parsed = lessonFormSchema.safeParse(lessonInputFromFormData(formData));
  if (!parsed.success) {
    throw new Error(logAndSummarize("createLesson", parsed.error.flatten().fieldErrors));
  }

  const { error } = await supabase.from("lessons").insert({ ...parsed.data, module_id: moduleId });
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/courses/${courseId}/modules/${moduleId}`);
}

export async function updateLesson(
  courseId: string,
  moduleId: string,
  lessonId: string,
  formData: FormData
) {
  const { supabase } = await requireRole([...MANAGE_ROLES]);

  const parsed = lessonFormSchema.safeParse(lessonInputFromFormData(formData));
  if (!parsed.success) {
    throw new Error(logAndSummarize("updateLesson", parsed.error.flatten().fieldErrors));
  }

  const { error } = await supabase.from("lessons").update(parsed.data).eq("id", lessonId);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`);
  revalidatePath(`/admin/courses/${courseId}/modules/${moduleId}`);
}
