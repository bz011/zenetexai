"use server";

/**
 * Personal per-lesson notes — plain text only, one per (student, lesson),
 * strictly private (see migration 009: no admin/instructor read policy at
 * all on student_lesson_notes). No rich text, no attachments, no sharing.
 */

import { requireUser } from "@/lib/auth/requireRole";
import { checkRateLimit } from "@/lib/upstashRateLimit";
import { saveLessonNoteSchema } from "@/lib/validators/courseValidators";
import type { StudentLessonNote } from "@/features/courses/types/course";

export async function getLessonNote(lessonId: string): Promise<StudentLessonNote | null> {
  const { supabase, user } = await requireUser();

  const { data } = await supabase
    .from("student_lesson_notes")
    .select("lesson_id, note_text, updated_at")
    .eq("user_id", user.id)
    .eq("lesson_id", lessonId)
    .maybeSingle();

  if (!data) return null;
  return { lessonId: data.lesson_id, noteText: data.note_text, updatedAt: data.updated_at };
}

export async function saveLessonNote(
  lessonId: string,
  noteText: string
): Promise<{ success: boolean; error?: string }> {
  const { supabase, user } = await requireUser();

  const limit = await checkRateLimit("note-write", user.id);
  if (!limit.allowed) return { success: false, error: "rate_limited" };

  const parsed = saveLessonNoteSchema.safeParse({ noteText });
  if (!parsed.success) {
    return { success: false, error: "Invalid note" };
  }

  const { error } = await supabase
    .from("student_lesson_notes")
    .upsert(
      { user_id: user.id, lesson_id: lessonId, note_text: parsed.data.noteText },
      { onConflict: "user_id,lesson_id" }
    );

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}
