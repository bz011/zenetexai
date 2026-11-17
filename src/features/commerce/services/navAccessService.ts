"use server";

import { createSupabaseServer } from "@/lib/supabase/server";
import { getUserCapabilities } from "@/features/commerce/services/entitlementService";

export interface SimulatorNavAccess {
  practice: boolean;
  mockExam: boolean;
}

/**
 * Which Simulator destinations the CURRENT visitor may open, for the Academy
 * navigation only (AcademySubnav): Practice and Mock Exam links are shown to
 * signed-in learners who hold the matching capability.
 *
 * Read-only, and the same rule the Practice / Mock Exam pages themselves
 * apply (hasCapability -> getUserCapabilities, including the free-product and
 * admin rules). It reads the caller's own session from cookies, so it can only
 * ever describe the caller; signed out, it returns no access. It never grants
 * anything: the pages keep their own server-side checks, and hiding a link
 * does not change who may open the URL directly.
 */
export async function getSimulatorNavAccess(): Promise<SimulatorNavAccess> {
  const none = { practice: false, mockExam: false };
  try {
    const supabase = createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return none;
    const capabilities = await getUserCapabilities(supabase, user.id);
    return { practice: capabilities.has("practice:pmp"), mockExam: capabilities.has("mock_exam:pmp") };
  } catch {
    return none;
  }
}
