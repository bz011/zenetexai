"use client";

import { useLang } from "@/lib/LanguageContext";
import ProductCard from "@/features/commerce/components/ProductCard";
import type { ProductWithPricing } from "@/features/commerce/types/commerce";

function ownsProduct(product: ProductWithPricing, ownedCapabilities: Set<string>): boolean {
  return product.capabilities.length > 0 && product.capabilities.every((cap) => ownedCapabilities.has(cap));
}

export default function CoursesContent({
  products,
  ownedCapabilities,
}: {
  products: ProductWithPricing[];
  ownedCapabilities: string[];
}) {
  const { t } = useLang();
  const s = t.commerce.storefront;
  const ownedSet = new Set(ownedCapabilities);

  return (
    <div className="relative min-h-screen px-6 py-24">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[350px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/[0.08] blur-[100px]" />

      <div className="container-page relative max-w-4xl">
        <span className="label">{s.eyebrow}</span>
        <h1 className="mt-3 text-3xl font-bold text-white">{s.heading}</h1>
        <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-slate-400">{s.sub}</p>

        {products.length === 0 ? (
          <div className="card mt-8 p-8 text-center">
            <p className="text-[14px] text-slate-500">{s.empty}</p>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} owned={ownsProduct(product, ownedSet)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
