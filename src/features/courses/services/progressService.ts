"use server";

/**
 * Lesson-completion writes. Server Actions, called directly from client
 * components — no separate API route needed for a single upsert.
 */

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/requireRole";
import { checkRateLimit } from "@/lib/upstashRateLimit";

export async function markLessonComplete(
  lessonId: string,
  courseSlug: string
): Promise<{ success: boolean; error?: string }> {
  const { supabase, user } = await requireUser();

  const limit = await checkRateLimit("progress-write", user.id);
  if (!limit.allowed) return { success: false, error: "rate_limited" };

  const { error } = await supabase
    .from("lesson_progress")
    .upsert({ user_id: user.id, lesson_id: lessonId }, { onConflict: "user_id,lesson_id" });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/courses/${courseSlug}`);
  return { success: true };
}

/**
 * Fire-and-forget on every lesson page view (not just completion) — powers
 * "Resume Learning". Upserts the single per-(user,course) pointer row rather
 * than appending history, so resume lookup stays O(1).
 */
export async function recordLessonView(lessonId: string): Promise<{ success: boolean; error?: string }> {
  const { supabase, user } = await requireUser();

  // Fires on every lesson page view - the "progress-write" bucket's 60/min
  // is generous enough for legitimate rapid navigation; a rejection here
  // is silent/best-effort (this powers "Resume Learning" only, it never
  // blocks the lesson itself from rendering).
  const limit = await checkRateLimit("progress-write", user.id);
  if (!limit.allowed) return { success: false, error: "rate_limited" };

  const { data: lesson } = await supabase
    .from("lessons")
    .select("module_id, modules(course_id)")
    .eq("id", lessonId)
    .single();

  const moduleId = (lesson as { module_id: string } | null)?.module_id;
  const courseId = (lesson as { modules: { course_id: string } | null } | null)?.modules?.course_id;

  if (!moduleId || !courseId) {
    return { success: false, error: "Lesson not found" };
  }

  const { error } = await supabase.from("learning_progress_pointer").upsert(
    {
      user_id: user.id,
      course_id: courseId,
      last_module_id: moduleId,
      last_lesson_id: lessonId,
      last_visited_at: new Date().toISOString(),
    },
    { onConflict: "user_id,course_id" }
  );

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}
