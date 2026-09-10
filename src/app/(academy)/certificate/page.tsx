import type { Metadata } from "next";
import { requireProfile } from "@/lib/auth/requireRole";
import { getCourseBySlug } from "@/features/courses/services/courseService";
import { hasCapability } from "@/features/commerce/services/entitlementService";
import { getOrIssueCourseCertificate } from "@/features/courses/services/certificateService";
import { supabaseAdmin } from "@/lib/supabase/admin";
import LockedAccess from "@/components/academy/LockedAccess";
import CertificateContent from "./CertificateContent";

const COURSE_SLUG = "pmp";

export const metadata: Metadata = { title: "Certificate of Completion — ZENTEXAI Academy" };
export const dynamic = "force-dynamic";

export default async function CertificatePage() {
  const { supabase, user, profile } = await requireProfile({ loginRedirectTo: "/certificate" });

  const course = await getCourseBySlug(supabase, COURSE_SLUG);
  if (!course) {
    return <LockedAccess variant="course" ctaHref="/courses/pmp-mastery-program" />;
  }

  const entitled = await hasCapability(supabase, user.id, `course:${COURSE_SLUG}`);
  if (!entitled) {
    return <LockedAccess variant="course" ctaHref="/courses/pmp-mastery-program" />;
  }

  // Issuance is server-verified (service-role client, independent of
  // anything the request could claim) - see certificateService's own
  // header comment. This is what makes "issue automatically on first
  // visit to the certificate page" safe: visiting this page cannot forge
  // eligibility, it can only trigger the same check a direct DB read would
  // give the same answer to.
  const result = await getOrIssueCourseCertificate(supabaseAdmin, {
    userId: user.id,
    courseId: course.id,
    courseSlug: COURSE_SLUG,
    firstName: profile?.first_name ?? null,
    lastName: profile?.last_name ?? null,
  });

  return (
    <CertificateContent
      result={result}
      courseTitleEn={course.title_en}
      courseTitleAr={course.title_ar}
      initialFirstName={profile?.first_name ?? ""}
      initialLastName={profile?.last_name ?? ""}
    />
  );
}
