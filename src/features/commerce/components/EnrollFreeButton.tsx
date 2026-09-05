"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/LanguageContext";
import { enrollFreeInProduct } from "@/features/commerce/services/freeEnrollmentService";

export default function EnrollFreeButton({ productSlug }: { productSlug: string }) {
  const { t } = useLang();
  const c = t.commerce.card;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await enrollFreeInProduct(productSlug);
      if (result.success) {
        setDone(true);
        if (result.redirectTo) {
          router.push(result.redirectTo);
        } else {
          router.refresh();
        }
      } else {
        setError(result.error ?? t.commerce.errors.generic);
      }
    });
  }

  if (done) {
    return <p className="text-[14px] font-medium text-emerald-400">{c.owned_badge} ✓</p>;
  }

  return (
    <div>
      <button onClick={handleClick} disabled={isPending} className="btn-primary px-5 py-2.5 text-[13px] disabled:cursor-not-allowed disabled:opacity-60">
        {isPending ? c.enrolling : c.enroll_free}
      </button>
      {error && <p className="mt-2 text-[13px] text-red-400">{error}</p>}
    </div>
  );
}
