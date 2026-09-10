"use server";

/**
 * Small, self-contained server action used only by the certificate page's
 * "add your name" prompt (see CertificateContent.tsx) — a student with no
 * usable first/last name on file cannot be issued a certificate (see
 * certificateService.getOrIssueCourseCertificate), so this lets them supply
 * one inline rather than requiring a full profile-settings page that
 * doesn't otherwise exist in this app yet.
 *
 * Uses the normal RLS-respecting server client, not supabaseAdmin — the
 * existing "Users can update own profile" policy (migration 005) is the
 * only authorization this needs; a student can only ever update their own
 * row (auth.uid() = id), never anyone else's.
 */

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth/requireRole";

export interface UpdateNameResult {
  success: boolean;
  error?: string;
}

export async function updateNameForCertificate(firstName: string, lastName: string): Promise<UpdateNameResult> {
  const { supabase, user } = await requireProfile({ loginRedirectTo: "/certificate" });

  const trimmedFirst = firstName.trim();
  const trimmedLast = lastName.trim();
  if (!trimmedFirst || !trimmedLast) {
    return { success: false, error: "Please enter both your first and last name." };
  }
  if (trimmedFirst.length > 100 || trimmedLast.length > 100) {
    return { success: false, error: "Name is too long." };
  }

  const { error } = await supabase.from("profiles").update({ first_name: trimmedFirst, last_name: trimmedLast }).eq("id", user.id);
  if (error) {
    return { success: false, error: "Something went wrong saving your name. Please try again." };
  }

  revalidatePath("/certificate");
  return { success: true };
}
