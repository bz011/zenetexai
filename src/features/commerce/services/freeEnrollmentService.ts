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
import { requireUser } from "@/lib/auth/requireRole";

export interface FreeEnrollmentResult {
  success: boolean;
  alreadyEnrolled?: boolean;
  expiresAt?: string | null;
  error?: string;
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

  return { success: true, alreadyEnrolled: result.already_enrolled ?? false, expiresAt: result.expires_at ?? null };
}
