"use server";

/**
 * Thin wrapper around the grant_free_enrollment() SQL function (migration
 * 019) - all authorization/verification (auth, product availability,
 * whether an AED-0 promotion is actually currently valid, idempotency)
 * happens server-side inside that SECURITY DEFINER function, never here.
 * This action exists only to give the client something to call and to
 * translate the function's JSON result into the shape the UI needs.
 *
 * Never accepts a price, "free" flag, or promotion claim from the caller -
 * only a product slug. See migration 019 for why that's sufficient: the
 * function re-resolves everything else itself.
 */

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireUser } from "@/lib/auth/requireRole";

export interface FreeEnrollmentResult {
  success: boolean;
  alreadyEnrolled?: boolean;
  expiresAt?: string | null;
  error?: string;
  /** Where to send the student right after enrolling - the first published
   * lesson of the course this product grants, when one exists. Falls back
   * to the product page itself (courseSlug is only ever set on the client
   * to whatever page it's already viewing, so a null here just means
   * "stay put and re-render as owned"). */
  redirectTo?: string | null;
}

const ERROR_MESSAGES: Record<string, string> = {
  not_authenticated: "Please log in to continue.",
  product_unavailable: "This product is not currently available.",
  no_active_free_promotion: "This product is not currently free. Please refresh the page.",
};

export async function enrollFreeInProduct(productSlug: string): Promise<FreeEnrollmentResult> {
  const { supabase } = await requireUser({ loginRedirectTo: `/courses/${productSlug}` });

  const { data, error } = await supabase.rpc("grant_free_enrollment", { p_product_slug: productSlug });

  if (error) {
    console.error("[freeEnrollmentService] grant_free_enrollment RPC error:", error.message);
    return { success: false, error: "Something went wrong. Please try again." };
  }

  const result = data as { success: boolean; already_enrolled?: boolean; expires_at?: string | null; error?: string };

  if (!result.success) {
    return { success: false, error: ERROR_MESSAGES[result.error ?? ""] ?? "Something went wrong. Please try again." };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/courses/${productSlug}`);

  const redirectTo = await findFirstLessonUrl(supabase, productSlug);

  return { success: true, alreadyEnrolled: result.already_enrolled ?? false, expiresAt: result.expires_at ?? null, redirectTo };
}

/**
 * Best-effort only - if anything here comes back empty (no course
 * capability, no published modules/lessons yet), returns null and the
 * caller just re-renders the product page in its "owned" state instead of
 * redirecting. Never blocks/fails the enrollment itself on this lookup.
 */
async function findFirstLessonUrl(supabase: SupabaseClient, productSlug: string): Promise<string | null> {
  const { data: product } = await supabase.from("products").select("id").eq("slug", productSlug).maybeSingle();
  if (!product) return null;

  const { data: capRows } = await supabase
    .from("product_capabilities")
    .select("capability")
    .eq("product_id", (product as { id: string }).id);
  const courseCapability = ((capRows ?? []) as { capability: string }[]).find((r) => r.capability.startsWith("course:"));
  if (!courseCapability) return null;
  const courseSlug = courseCapability.capability.split(":")[1];

  const { data: course } = await supabase.from("courses").select("id").eq("slug", courseSlug).eq("is_published", true).maybeSingle();
  if (!course) return null;

  const { data: modules } = await supabase
    .from("modules")
    .select("id")
    .eq("course_id", (course as { id: string }).id)
    .eq("is_published", true)
    .order("order_index", { ascending: true });
  const moduleIds = ((modules ?? []) as { id: string }[]).map((m) => m.id);
  if (moduleIds.length === 0) return null;

  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, module_id, order_index")
    .in("module_id", moduleIds)
    .eq("is_published", true);
  const lessonList = (lessons ?? []) as { id: string; module_id: string; order_index: number }[];
  if (lessonList.length === 0) return null;

  // First lesson = lowest module order_index, then lowest lesson order_index within it.
  const moduleOrder = new Map(moduleIds.map((id, i) => [id, i]));
  lessonList.sort((a, b) => {
    const moduleDiff = (moduleOrder.get(a.module_id) ?? 0) - (moduleOrder.get(b.module_id) ?? 0);
    return moduleDiff !== 0 ? moduleDiff : a.order_index - b.order_index;
  });

  return `/courses/${courseSlug}/lessons/${lessonList[0].id}`;
}
