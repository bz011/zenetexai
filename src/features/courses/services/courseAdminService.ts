"use server";

/**
 * Admin course/module/lesson CRUD (create + update only — no delete UI this
 * sprint; unpublish via is_published is the practical equivalent for
 * content that's meant to be kept, not destroyed).
 *
 * Every action calls requireRole(['admin','instructor']) first. RLS on
 * courses/modules/lessons enforces the same restriction as a backstop —
 * this isn't the only thing standing between a student and a write.
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

function formToObject(formData: FormData): Record<string, FormDataEntryValue> {
  return Object.fromEntries(formData.entries());
}

export async function createCourse(formData: FormData) {
  const { supabase } = await requireRole([...MANAGE_ROLES]);

  const parsed = courseFormSchema.safeParse(formToObject(formData));
  if (!parsed.success) {
    throw new Error("Invalid course data");
  }

  const { error } = await supabase.from("courses").insert(parsed.data);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/courses");
  redirect("/admin/courses");
}

export async function updateCourse(courseId: string, formData: FormData) {
  const { supabase } = await requireRole([...MANAGE_ROLES]);

  const parsed = courseFormSchema.safeParse(formToObject(formData));
  if (!parsed.success) {
    throw new Error("Invalid course data");
  }

  const { error } = await supabase.from("courses").update(parsed.data).eq("id", courseId);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath("/admin/courses");
}

export async function createModule(courseId: string, formData: FormData) {
  const { supabase } = await requireRole([...MANAGE_ROLES]);

  const parsed = moduleFormSchema.safeParse(formToObject(formData));
  if (!parsed.success) {
    throw new Error("Invalid module data");
  }

  const { error } = await supabase.from("modules").insert({ ...parsed.data, course_id: courseId });
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/courses/${courseId}`);
}

export async function updateModule(courseId: string, moduleId: string, formData: FormData) {
  const { supabase } = await requireRole([...MANAGE_ROLES]);

  const parsed = moduleFormSchema.safeParse(formToObject(formData));
  if (!parsed.success) {
    throw new Error("Invalid module data");
  }

  const { error } = await supabase.from("modules").update(parsed.data).eq("id", moduleId);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/courses/${courseId}/modules/${moduleId}`);
  revalidatePath(`/admin/courses/${courseId}`);
}

export async function createLesson(courseId: string, moduleId: string, formData: FormData) {
  const { supabase } = await requireRole([...MANAGE_ROLES]);

  const parsed = lessonFormSchema.safeParse(formToObject(formData));
  if (!parsed.success) {
    throw new Error("Invalid lesson data");
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

  const parsed = lessonFormSchema.safeParse(formToObject(formData));
  if (!parsed.success) {
    throw new Error("Invalid lesson data");
  }

  const { error } = await supabase.from("lessons").update(parsed.data).eq("id", lessonId);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`);
  revalidatePath(`/admin/courses/${courseId}/modules/${moduleId}`);
}
