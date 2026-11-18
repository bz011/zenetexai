"use server";

import { createSupabaseServer } from "@/lib/supabase/server";
import { getUserCapabilities } from "@/features/commerce/services/entitlementService";

export interface SimulatorNavAccess {
  practice: boolean;
  mockExam: boolean;
}

/** The Academy navigation's starting state, resolved on the server for the current request. */
export interface AcademyNavState extends SimulatorNavAccess {
  /** The signed-in user's id, or null when signed out. */
  userId: string | null;
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
  const { practice, mockExam } = await getAcademyNavState();
  return { practice, mockExam };
}

/**
 * Who is signed in and which Simulator links they may see, for the request
 * being rendered (audit F3): the Academy layout calls this on the server so
 * the first HTML already carries the right navigation - no signed-out state
 * that flips after the browser has loaded the session. Verified with
 * supabase.auth.getUser() (checked by the auth server, not just a decoded
 * cookie). Never grants anything: the pages enforce access themselves.
 */
export async function getAcademyNavState(): Promise<AcademyNavState> {
  const signedOut = { userId: null, practice: false, mockExam: false };
  try {
    const supabase = createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return signedOut;
    const capabilities = await getUserCapabilities(supabase, user.id);
    return { userId: user.id, practice: capabilities.has("practice:pmp"), mockExam: capabilities.has("mock_exam:pmp") };
  } catch {
    return signedOut;
  }
}
