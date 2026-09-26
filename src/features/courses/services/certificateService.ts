/**
 * ZentexAI Academy "Certificate of Completion" — a course-completion
 * record, explicitly NOT a PMP/PMI exam certification (see migration 028's
 * header comment for why this is a dedicated table rather than reusing the
 * unrelated `certifications` exam-metadata table).
 *
 * Eligibility is verified ENTIRELY server-side using the service-role
 * client (supabaseAdmin) — a client can never forge eligibility, because
 * every check here re-reads the actual entitlement/lesson-progress/attempt
 * rows itself rather than trusting anything passed in. Issuance is
 * idempotent (INSERT ... ON CONFLICT DO NOTHING + a unique (user_id,
 * course_id) constraint), so calling this concurrently or repeatedly never
 * creates a duplicate certificate and always converges on the same row.
 *
 * Point-in-time semantics: once a row exists, it is returned as-is and
 * eligibility is never re-checked or revoked — a later failed quiz retake,
 * an edited lesson, or a changed passing_score must never un-issue an
 * already-issued certificate. See getCourseCertificate() below.
 */

import crypto from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { SupabaseAdmin } from "@/lib/supabase/admin";
import { hasCapability } from "@/features/commerce/services/entitlementService";

type Client = SupabaseClient | SupabaseAdmin;

export interface CourseCertificate {
  id: string;
  userId: string;
  courseId: string;
  certificateNumber: string;
  studentName: string;
  issuedAt: string;
}

export interface PublicCertificate {
  certificateNumber: string;
  studentName: string;
  courseTitleEn: string;
  courseTitleAr: string | null;
  issuedAt: string;
}

function toCertificate(row: {
  id: string;
  user_id: string;
  course_id: string;
  certificate_number: string;
  student_name: string;
  issued_at: string;
}): CourseCertificate {
  return {
    id: row.id,
    userId: row.user_id,
    courseId: row.course_id,
    certificateNumber: row.certificate_number,
    studentName: row.student_name,
    issuedAt: row.issued_at,
  };
}

/** Already-issued certificate for this user/course, if any — read-only, no eligibility check (point-in-time: an issued certificate is always returned as-is). */
export async function getCourseCertificate(supabase: Client, userId: string, courseId: string): Promise<CourseCertificate | null> {
  const { data } = await supabase
    .from("course_certificates")
    .select("id, user_id, course_id, certificate_number, student_name, issued_at")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .maybeSingle();

  return data ? toCertificate(data as never) : null;
}

/** e.g. "ZTX-PMP-2026-7F3A9C2E" — year plus 8 unguessable hex chars from crypto.randomBytes, never a sequential id. */
function generateCertificateNumber(): string {
  const year = new Date().getFullYear();
  const random = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `ZTX-PMP-${year}-${random}`;
}

export interface EligibilityResult {
  eligible: boolean;
  reason?: "not_entitled" | "lessons_incomplete" | "quizzes_incomplete";
}

/**
 * Independently re-verifies every eligibility condition against the real
 * data — entitlement, every published lesson across the whole course, and
 * a passed (ever, not "latest") attempt on every published module_assessment.
 * Module 1 has no module_assessment row, so it is naturally excluded rather
 * than hardcoded — this generalizes correctly if the curriculum changes.
 */
export async function checkCourseCertificateEligibility(
  supabaseAdmin: SupabaseAdmin,
  userId: string,
  courseId: string,
  courseSlug: string
): Promise<EligibilityResult> {
  const entitled = await hasCapability(supabaseAdmin, userId, `course:${courseSlug}`);
  if (!entitled) return { eligible: false, reason: "not_entitled" };

  const { data: modules } = await supabaseAdmin.from("modules").select("id").eq("course_id", courseId).eq("is_published", true);
  const moduleIds = (modules ?? []).map((m: { id: string }) => m.id);

  if (moduleIds.length > 0) {
    const { data: lessons } = await supabaseAdmin.from("lessons").select("id").in("module_id", moduleIds).eq("is_published", true);
    const lessonIds = (lessons ?? []).map((l: { id: string }) => l.id);

    if (lessonIds.length > 0) {
      const { data: progress } = await supabaseAdmin.from("lesson_progress").select("lesson_id").eq("user_id", userId).in("lesson_id", lessonIds);
      const completedCount = new Set((progress ?? []).map((p: { lesson_id: string }) => p.lesson_id)).size;
      if (completedCount < lessonIds.length) return { eligible: false, reason: "lessons_incomplete" };
    }

    const { data: assessments } = await supabaseAdmin
      .from("learning_assessments")
      .select("id")
      .in("module_id", moduleIds)
      .eq("type", "module_assessment")
      .eq("is_published", true);
    const assessmentIds = (assessments ?? []).map((a: { id: string }) => a.id);

    if (assessmentIds.length > 0) {
      const { data: attempts } = await supabaseAdmin
        .from("learning_assessment_attempts")
        .select("assessment_id, passed")
        .eq("user_id", userId)
        .in("assessment_id", assessmentIds)
        .eq("passed", true);
      const passedAssessmentIds = new Set((attempts ?? []).map((a: { assessment_id: string }) => a.assessment_id));
      const allPassed = assessmentIds.every((id: string) => passedAssessmentIds.has(id));
      if (!allPassed) return { eligible: false, reason: "quizzes_incomplete" };
    }
  }

  return { eligible: true };
}

export type IssuanceResult =
  | { status: "issued"; certificate: CourseCertificate }
  | { status: "not_eligible"; reason: NonNullable<EligibilityResult["reason"]> }
  | { status: "missing_name" };

/**
 * The single entry point for certificate issuance — idempotent and atomic.
 * Always call this (never insert into course_certificates any other way).
 *
 * 1. Fast path: an existing row is returned immediately, no re-check (see
 *    module header — point-in-time semantics).
 * 2. Otherwise, independently verifies eligibility server-side.
 * 3. Refuses to issue with a blank/unusable name rather than ever writing
 *    a garbled certificate.
 * 4. Inserts with ON CONFLICT DO NOTHING, then re-reads on conflict — safe
 *    even if two requests race (e.g. two browser tabs hitting the
 *    certificate page at once): exactly one row ever exists per
 *    (user_id, course_id), enforced by the DB constraint, not just this
 *    check-then-insert logic.
 */
export async function getOrIssueCourseCertificate(
  supabaseAdmin: SupabaseAdmin,
  params: { userId: string; courseId: string; courseSlug: string; firstName: string | null; lastName: string | null }
): Promise<IssuanceResult> {
  const existing = await getCourseCertificate(supabaseAdmin, params.userId, params.courseId);
  if (existing) return { status: "issued", certificate: existing };

  const eligibility = await checkCourseCertificateEligibility(supabaseAdmin, params.userId, params.courseId, params.courseSlug);
  if (!eligibility.eligible) return { status: "not_eligible", reason: eligibility.reason! };

  const studentName = [params.firstName, params.lastName].map((s) => s?.trim()).filter(Boolean).join(" ");
  if (!studentName) return { status: "missing_name" };

  // Retry a handful of times only to cover the astronomically unlikely
  // certificate_number collision (32-bit random hex per year) — not a
  // concurrency mechanism (that's the unique constraint + ON CONFLICT).
  for (let attempt = 0; attempt < 5; attempt++) {
    const certificateNumber = generateCertificateNumber();
    const { data, error } = await supabaseAdmin
      .from("course_certificates")
      .insert({
        user_id: params.userId,
        course_id: params.courseId,
        certificate_number: certificateNumber,
        student_name: studentName,
      })
      .select("id, user_id, course_id, certificate_number, student_name, issued_at")
      .maybeSingle();

    if (!error && data) return { status: "issued", certificate: toCertificate(data as never) };

    // 23505 = unique_violation. Could be the (user_id, course_id) constraint
    // (a concurrent request won the race - re-read and return its row) or
    // the certificate_number constraint (collision - loop and try a new
    // number). Either way, re-check for an existing row before retrying.
    const pgError = error as { code?: string } | null;
    if (pgError?.code === "23505") {
      const raceWinner = await getCourseCertificate(supabaseAdmin, params.userId, params.courseId);
      if (raceWinner) return { status: "issued", certificate: raceWinner };
      continue; // was a certificate_number collision - try again with a new number
    }
    throw new Error(`Failed to issue certificate: ${error?.message ?? "unknown error"}`);
  }

  throw new Error("Failed to issue certificate after multiple certificate_number attempts");
}

/**
 * PUBLIC verification lookup — the ONLY function the public /verify page
 * may call. Deliberately returns a narrow, explicitly-whitelisted shape
 * (never the raw row) so user_id/course_id/created_at/etc. can never leak
 * through this path, even by future accident. Uses supabaseAdmin because
 * course_certificates has no RLS policy for anon/unauthenticated readers
 * at all (see migration 028) - this function is the sanctioned, narrow
 * substitute for one.
 */
export async function getPublicCertificateByNumber(supabaseAdmin: SupabaseAdmin, certificateNumber: string): Promise<PublicCertificate | null> {
  const { data } = await supabaseAdmin
    .from("course_certificates")
    .select("student_name, issued_at, courses(title_en, title_ar)")
    .eq("certificate_number", certificateNumber)
    .maybeSingle();

  if (!data) return null;
  const row = data as unknown as { student_name: string; issued_at: string; courses: { title_en: string; title_ar: string | null } | null };

  return {
    certificateNumber,
    studentName: row.student_name,
    courseTitleEn: row.courses?.title_en ?? "PMP Mastery Program",
    courseTitleAr: row.courses?.title_ar ?? null,
    issuedAt: row.issued_at,
  };
}
