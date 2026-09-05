"use client";

import Link from "next/link";
import { useLang } from "@/lib/LanguageContext";
import type { ProductWithPricing } from "@/features/commerce/types/commerce";
import { formatMoney } from "@/features/commerce/utils/money";

export default function ProductCard({ product, owned }: { product: ProductWithPricing; owned: boolean }) {
  const { t, lang } = useLang();
  const c = t.commerce.card;

  const title = lang === "ar" && product.title_ar ? product.title_ar : product.title_en;
  const description = lang === "ar" && product.description_ar ? product.description_ar : product.description_en;
  const price = product.price;
  const isFreeNow = !!price && price.isPromotionActive && price.effectiveAmountMinorUnits === 0;

  return (
    <Link href={`/courses/${product.slug}`} className="card card-hover flex flex-col p-6">
      <div className="flex items-start justify-between gap-3">
        <span className="label text-[10px]">{product.type}</span>
        {owned ? (
          <span className="shrink-0 rounded-full bg-emerald-500/[0.12] px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
            {c.owned_badge}
          </span>
        ) : (
          isFreeNow && (
            <span className="shrink-0 rounded-full bg-amber-500/[0.15] px-2.5 py-0.5 text-[11px] font-semibold text-amber-400">
              {c.launch_offer_badge}
            </span>
          )
        )}
      </div>

      <h3 className="mt-3 text-[16px] font-semibold text-white">{title}</h3>
      {description && <p className="mt-2 flex-1 text-[13px] leading-relaxed text-slate-400">{description}</p>}

      <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-4">
        {price ? (
          isFreeNow ? (
            <span className="text-[13px] font-semibold">
              {price.regularAmountMinorUnits !== null && (
                <span className="mr-1.5 text-slate-500 line-through">{formatMoney(price.regularAmountMinorUnits, price.currency)}</span>
              )}
              <span className="text-emerald-400">{c.free_badge}</span>
            </span>
          ) : (
            <span className="text-[13px] font-semibold text-white">{formatMoney(price.effectiveAmountMinorUnits, price.currency)}</span>
          )
        ) : (
          <span className="text-[12px] text-slate-500">—</span>
        )}
        <span className="btn-ghost text-[12px]">{owned ? c.continue_learning : c.view_details}</span>
      </div>
    </Link>
  );
}
