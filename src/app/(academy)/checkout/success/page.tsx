import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/requireRole";
import { verifyAndFulfillZiinaPurchase } from "@/features/commerce/services/checkoutService";
import CheckoutResultContent from "../CheckoutResultContent";

interface Props {
  searchParams: Promise<{ purchase_id?: string }>;
}

export const metadata: Metadata = { title: "Payment — ZENTEXAI Academy" };
export const dynamic = "force-dynamic";

// Reaching this URL proves nothing on its own (Ziina redirects here whether
// or not our own verification would agree) - verifyAndFulfillZiinaPurchase
// always re-checks the real Payment Intent with Ziina before anything is
// ever granted. See checkoutService.ts for the full security rationale.
export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const { purchase_id: purchaseId } = await searchParams;
  const loginRedirectTo = purchaseId ? `/checkout/success?purchase_id=${purchaseId}` : "/checkout/success";
  const { user } = await requireUser({ loginRedirectTo });

  const result = purchaseId ? await verifyAndFulfillZiinaPurchase(purchaseId, user.id) : { status: "not_found" as const };

  return <CheckoutResultContent result={result} />;
}
