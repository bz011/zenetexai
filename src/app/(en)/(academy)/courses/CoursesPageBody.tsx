import { getOptionalUser } from "@/lib/auth/requireRole";
import { getStorefrontProducts } from "@/features/commerce/services/productService";
import { getUserCapabilities } from "@/features/commerce/services/entitlementService";
import CoursesContent from "./CoursesContent";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd } from "@/lib/structuredData";
import PmpDiscoverabilitySection from "@/components/seo/PmpDiscoverabilitySection";

/**
 * Shared server body of the public storefront, rendered by both /courses
 * and /ar/courses - the language comes from the URL (see
 * LanguageContext), so the data fetching and entitlement lookup exist once.
 * Deliberately no requireUser(): browsing the catalog never requires an
 * account. Capabilities are looked up only to badge already-owned cards.
 */
export default async function CoursesPageBody({ lang }: { lang: "en" | "ar" }) {
  const { supabase, user } = await getOptionalUser();

  const [products, ownedCapabilities] = await Promise.all([
    getStorefrontProducts(supabase),
    user ? getUserCapabilities(supabase, user.id) : Promise.resolve(new Set<string>()),
  ]);

  const crumbs = lang === "ar"
    ? [{ name: "الرئيسية", path: "/ar" }, { name: "الدورات", path: "/ar/courses" }]
    : [{ name: "Home", path: "/" }, { name: "Courses", path: "/courses" }];

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <CoursesContent products={products} ownedCapabilities={Array.from(ownedCapabilities)} />
      <PmpDiscoverabilitySection variant="simulator" arabicOnly={lang === "ar"} englishOnly={lang === "en"} />
    </>
  );
}
