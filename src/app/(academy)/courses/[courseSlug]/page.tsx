import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getOptionalUser } from "@/lib/auth/requireRole";
import { getProductBySlug } from "@/features/commerce/services/productService";
import { getUserCapabilities } from "@/features/commerce/services/entitlementService";
import { getPublicCurriculumOutline } from "@/features/courses/services/courseService";
import ProductDetailContent from "./ProductDetailContent";

interface Props {
  params: Promise<{ courseSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { courseSlug } = await params;
  return { title: `${courseSlug} — ZENTEXAI Academy` };
}

export const dynamic = "force-dynamic";

// Sprint 10: public product detail page. The dynamic segment is a PRODUCT
// slug (e.g. "pmp-mastery-program"), not a `courses` table slug - kept
// under the existing [courseSlug] folder name so the lesson/assessment
// routes nested beneath it (which DO take the real course content slug,
// e.g. "pmp") are unaffected; the two never collide because they're
// reached via different full paths. No requireUser() here - see the
// Sprint 10 product rule (browsing/understanding a product must not
// require an account; auth is required only to actually enroll).
export default async function ProductDetailPage({ params }: Props) {
  const { courseSlug: productSlug } = await params;
  const { supabase, user } = await getOptionalUser();

  const product = await getProductBySlug(supabase, productSlug);
  if (!product || !product.is_published) notFound();

  const courseCapability = product.capabilities.find((c) => c.startsWith("course:"));
  const courseSlug = courseCapability ? courseCapability.split(":")[1] : null;

  const [ownedCapabilities, curriculum] = await Promise.all([
    user ? getUserCapabilities(supabase, user.id) : Promise.resolve(new Set<string>()),
    courseSlug ? getPublicCurriculumOutline(supabase, courseSlug) : Promise.resolve([]),
  ]);

  const alreadyOwned = product.capabilities.length > 0 && product.capabilities.every((c) => ownedCapabilities.has(c));

  return (
    <ProductDetailContent
      product={product}
      courseSlug={courseSlug}
      curriculum={curriculum}
      isAuthenticated={!!user}
      alreadyOwned={alreadyOwned}
    />
  );
}
