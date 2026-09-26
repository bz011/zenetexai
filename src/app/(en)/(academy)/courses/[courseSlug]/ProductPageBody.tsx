import { notFound } from "next/navigation";
import { getOptionalUser } from "@/lib/auth/requireRole";
import { getProductBySlug } from "@/features/commerce/services/productService";
import { getUserCapabilities } from "@/features/commerce/services/entitlementService";
import { getPublicCurriculumOutline } from "@/features/courses/services/courseService";
import ProductDetailContent from "./ProductDetailContent";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd, courseJsonLd, faqJsonLd } from "@/lib/structuredData";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getActiveBlueprint } from "@/features/mock-exam/config/examBlueprint";
import { SIMULATOR_SLUG, fillCopy, simulatorFactsFromBlueprint, simulatorPageCopy } from "@/lib/simulatorPageCopy";
import { toArabicPath } from "@/lib/i18nRoutes";

// Public product detail page body, shared by /courses/[slug] and the Arabic
// /ar/courses/pmp-exam-simulator route so the product lookup, entitlement
// check and curriculum read exist once. The language of the rendered copy
// comes from the URL (see LanguageContext); `lang` here only localises the
// breadcrumb / structured data.
//
// The dynamic segment is a PRODUCT slug (e.g. "pmp-mastery-program"), not a
// `courses` table slug. No requireUser(): browsing a product never requires
// an account; auth is required only to actually enroll.
export default async function ProductPageBody({ productSlug, lang = "en" }: { productSlug: string; lang?: "en" | "ar" }) {
  const { supabase, user } = await getOptionalUser();

  const product = await getProductBySlug(supabase, productSlug);
  if (!product || !product.is_published) notFound();

  const courseCapability = product.capabilities.find((c) => c.startsWith("course:"));
  const courseSlug = courseCapability ? courseCapability.split(":")[1] : null;

  // The course/module/lesson tables are readable only by the `authenticated`
  // role (migration 006), so a logged-out visitor's own client always got an
  // empty outline and the page showed "curriculum coming soon". The outline
  // is public, titles-only data that getPublicCurriculumOutline already
  // restricts to published rows, so it reads with the server-side admin
  // client instead of loosening RLS (which would also expose lesson
  // content and video references to anonymous REST callers).
  const [ownedCapabilities, curriculum] = await Promise.all([
    user ? getUserCapabilities(supabase, user.id) : Promise.resolve(new Set<string>()),
    courseSlug ? getPublicCurriculumOutline(supabaseAdmin, courseSlug) : Promise.resolve([]),
  ]);

  const alreadyOwned = product.capabilities.length > 0 && product.capabilities.every((c) => ownedCapabilities.has(c));

  const path = lang === "ar" ? toArabicPath(`/courses/${product.slug}`) : `/courses/${product.slug}`;
  const crumbs =
    lang === "ar"
      ? [{ name: "الرئيسية", path: "/ar" }, { name: "الدورات", path: "/ar/courses" }, { name: product.title_ar || product.title_en, path }]
      : [{ name: "Home", path: "/" }, { name: "Courses", path: "/courses" }, { name: product.title_en, path }];

  const simulatorFaq =
    product.slug === SIMULATOR_SLUG
      ? simulatorPageCopy[lang].faq.map((f) => {
          const facts = simulatorFactsFromBlueprint(getActiveBlueprint());
          return { q: fillCopy(f.q, facts as never), a: fillCopy(f.a, facts as never) };
        })
      : null;

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      {product.type === "course" && (
        <JsonLd data={courseJsonLd({ name: product.title_en, description: product.description_en, path })} />
      )}
      {simulatorFaq && <JsonLd data={faqJsonLd(simulatorFaq, lang)} />}
      <ProductDetailContent
        product={product}
        courseSlug={courseSlug}
        curriculum={curriculum}
        isAuthenticated={!!user}
        alreadyOwned={alreadyOwned}
      />
    </>
  );
}
