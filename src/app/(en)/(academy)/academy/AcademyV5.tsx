import { getOptionalUser } from "@/lib/auth/requireRole";
import { getStorefrontProducts } from "@/features/commerce/services/productService";
import type { EffectivePrice } from "@/features/commerce/types/commerce";
import AcademyPage from "@/site/academy/AcademyPage";

/**
 * Server body of /academy and /ar/academy (language from the URL). Prices are
 * read from the existing storefront query (published products, active
 * prices; public under RLS, as on /courses) and resolved by the same
 * effective-price logic. Read-only: no entitlement, purchase or price is
 * touched. If the catalog cannot be read, the programs show no price rather
 * than a hard-coded one.
 */
export default async function AcademyV5({ lang }: { lang: "en" | "ar" }) {
  let prices: Record<string, EffectivePrice | null> = {};
  try {
    const { supabase } = await getOptionalUser();
    const products = await getStorefrontProducts(supabase);
    prices = Object.fromEntries(products.map((p) => [p.slug, p.price]));
  } catch (err) {
    console.error("[academy] storefront prices unavailable:", (err as Error).message);
  }
  return <AcademyPage lang={lang} prices={prices} />;
}
