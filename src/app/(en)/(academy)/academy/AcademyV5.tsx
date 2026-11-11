import { createClient } from "@supabase/supabase-js";
import { getStorefrontProducts } from "@/features/commerce/services/productService";
import type { EffectivePrice } from "@/features/commerce/types/commerce";
import AcademyPage from "@/site/academy/AcademyPage";

/**
 * Server body of /academy and /ar/academy (language from the URL).
 *
 * Prices come from the existing storefront query (published products and
 * active prices - public under RLS, exactly what an anonymous visitor may
 * read) and the same effective-price logic as /courses. The client is a
 * cookieless anonymous one (public URL + anon key, no session), so the page
 * stays statically rendered and is revalidated (see `revalidate` on the
 * pages) instead of becoming per-request. Never the service-role key.
 * Read-only: no price, purchase or entitlement is touched. If the catalog
 * cannot be read, the programs show no price rather than a hard-coded one.
 */
async function readPrices(): Promise<Record<string, EffectivePrice | null>> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return {};
  try {
    const supabase = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const products = await getStorefrontProducts(supabase);
    return Object.fromEntries(products.map((p) => [p.slug, p.price]));
  } catch (err) {
    console.error("[academy] storefront prices unavailable:", (err as Error).message);
    return {};
  }
}

export default async function AcademyV5({ lang }: { lang: "en" | "ar" }) {
  const prices = await readPrices();
  return <AcademyPage lang={lang} prices={prices} />;
}
