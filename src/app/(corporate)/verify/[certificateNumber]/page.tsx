import type { Metadata } from "next";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getPublicCertificateByNumber } from "@/features/courses/services/certificateService";
import VerifyContent from "./VerifyContent";

interface Props {
  params: Promise<{ certificateNumber: string }>;
}

export const metadata: Metadata = { title: "Certificate Verification — ZENTEXAI Academy" };
export const dynamic = "force-dynamic";

/**
 * Fully public — no auth, no entitlement check. Reads ONLY through
 * getPublicCertificateByNumber(), which returns an explicitly whitelisted,
 * narrow shape (student name, course title, issue date) — never user_id,
 * email, or any other row data. See certificateService's own comment for
 * why this uses supabaseAdmin internally rather than an anon-role RLS
 * policy on course_certificates.
 */
export default async function VerifyPage({ params }: Props) {
  const { certificateNumber } = await params;
  const certificate = await getPublicCertificateByNumber(supabaseAdmin, certificateNumber);

  return <VerifyContent certificate={certificate} certificateNumber={certificateNumber} />;
}
