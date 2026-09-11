import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/requireRole";
import { verifyAndFulfillZiinaPurchase } from "@/features/commerce/services/checkoutService";
import CheckoutResultContent from "../CheckoutResultContent";

interface Props {
  searchParams: Promise<{ purchase_id?: string }>;
}

export const metadata: Metadata = { title: "Checkout Cancelled — ZENTEXAI Academy", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

// Uses the exact same verification call as /checkout/success - which URL
// the browser landed on is only a UI hint, never the basis for granting
// (or withholding) access. If Ziina's own status somehow says the payment
// did complete, this page grants access exactly like the success page
// would; otherwise nothing is ever created here.
export default async function CheckoutCancelPage({ searchParams }: Props) {
  const { purchase_id: purchaseId } = await searchParams;
  const loginRedirectTo = purchaseId ? `/checkout/cancel?purchase_id=${purchaseId}` : "/checkout/cancel";
  const { user } = await requireUser({ loginRedirectTo });

  const result = purchaseId ? await verifyAndFulfillZiinaPurchase(purchaseId, user.id) : { status: "not_found" as const };

  return <CheckoutResultContent result={result} />;
}
