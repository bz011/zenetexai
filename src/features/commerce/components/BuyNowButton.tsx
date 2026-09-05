"use client";

import { useState, useTransition } from "react";
import { useLang } from "@/lib/LanguageContext";
import { startZiinaCheckout } from "@/features/commerce/services/checkoutService";

export default function BuyNowButton({ productSlug }: { productSlug: string }) {
  const { t } = useLang();
  const c = t.commerce.card;
  const errors = t.commerce.errors;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await startZiinaCheckout(productSlug);
      if (result.success && result.redirectUrl) {
        // Cross-origin navigation to Ziina's hosted checkout - next/navigation's
        // router only handles in-app routes.
        window.location.href = result.redirectUrl;
        return;
      }
      const message = (result.error && (errors as Record<string, string>)[result.error]) || errors.generic;
      setError(message);
    });
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={isPending}
        className="btn-primary w-full px-5 py-2.5 text-[13px] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? c.redirecting_to_payment : c.buy_now}
      </button>
      {error && <p className="mt-2 text-[13px] text-red-400">{error}</p>}
    </div>
  );
}
