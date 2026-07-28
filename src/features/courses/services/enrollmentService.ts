"use server";

/**
 * Enrollment: a real, self-service replacement for the "email us to
 * enroll" flow. Every action re-derives the caller's own user_id via
 * requireUser() and scopes queries to it, same pattern as
 * practiceSessionService.ts/progressService.ts.
 *
 * Not a paywall: published course content is already visible to any
 * authenticated user (migration 006). An enrollment row is a real record
 * of intent/status, not an access gate — see migration 013 for why status
 * defaults straight to 'active' while payment integration is deferred.
 */

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/requireRole";
import type { EnrollmentStatus } from "@/features/courses/types/course";

export async function getMyEnrollment(courseSlug: string): Promise<EnrollmentStatus | null> {
  const { supabase, user } = await requireUser();

  const { data: course } = await supabase.from("courses").select("id").eq("slug", courseSlug).maybeSingle();
  if (!course) return null;

  const { data } = await supabase
    .from("enrollments")
    .select("status, enrolled_at")
    .eq("user_id", user.id)
    .eq("course_id", (course as { id: string }).id)
    .maybeSingle();

  if (!data) return null;
  return data as EnrollmentStatus;
}

export interface EnrollResult {
  success: boolean;
  error?: string;
}

export async function enrollInCourse(courseSlug: string): Promise<EnrollResult> {
  const { supabase, user } = await requireUser({ loginRedirectTo: "/enroll" });

  const { data: course } = await supabase.from("courses").select("id").eq("slug", courseSlug).eq("is_published", true).maybeSingle();
  if (!course) {
    return { success: false, error: "Course not found" };
  }

  const { error } = await supabase
    .from("enrollments")
    .upsert(
      { user_id: user.id, course_id: (course as { id: string }).id, status: "active" },
      { onConflict: "user_id,course_id", ignoreDuplicates: true }
    );

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/enroll");
  revalidatePath("/dashboard");
  return { success: true };
}
