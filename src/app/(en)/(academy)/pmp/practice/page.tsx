import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/requireRole";
import { hasCapability } from "@/features/commerce/services/entitlementService";
import LockedAccess from "@/components/academy/LockedAccess";
import PracticeConfigForm from "@/features/practice/components/PracticeConfigForm";
import SimulatorPageHeader from "@/components/academy/SimulatorPageHeader";

export const metadata: Metadata = { title: "Practice Mode — ZENTEXAI", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PracticeConfigPage() {
  const { supabase, user } = await requireUser({ loginRedirectTo: "/pmp/practice" });

  const entitled = await hasCapability(supabase, user.id, "practice:pmp");
  if (!entitled) {
    return <LockedAccess variant="simulator" ctaHref="/courses/pmp-exam-simulator" />;
  }

  return (
    <div className="relative min-h-screen px-6 py-24">
      <div className="container-page relative max-w-2xl">
        <SimulatorPageHeader variant="practice" />

        <PracticeConfigForm />
      </div>
    </div>
  );
}
