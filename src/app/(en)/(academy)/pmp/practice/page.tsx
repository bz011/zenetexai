import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/requireRole";
import { hasCapability } from "@/features/commerce/services/entitlementService";
import LockedAccess from "@/components/academy/LockedAccess";
import PracticeConfigForm from "@/features/practice/components/PracticeConfigForm";

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
        <span className="label">PMP</span>
        <h1 className="mt-3 text-2xl font-bold text-white">Practice Mode</h1>
        <p className="mt-2 text-[14px] text-slate-400">
          Configure a practice session from the approved PMP question bank.
        </p>

        <PracticeConfigForm />
      </div>
    </div>
  );
}
