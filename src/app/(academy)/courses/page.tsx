import type { Metadata } from "next";
import { getOptionalUser } from "@/lib/auth/requireRole";
import { getStorefrontProducts } from "@/features/commerce/services/productService";
import { getUserCapabilities } from "@/features/commerce/services/entitlementService";
import CoursesContent from "./CoursesContent";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd } from "@/lib/structuredData";

const title = "PMP Courses & Exam Simulator — ZentexAI Academy";
const description =
  "Browse the PMP Mastery Program and PMP Exam Simulator from ZentexAI Academy — structured lessons, a full practice question bank, and realistic exam simulations.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/courses" },
  openGraph: { title, description, url: "/courses", type: "website" },
  twitter: { card: "summary_large_image", title, description },
};
export const dynamic = "force-dynamic";

// Sprint 10: public Academy storefront. Deliberately no requireUser() here -
// browsing the catalog must never require an account (see the Sprint 10
// product rule). Capabilities are looked up only to badge cards "Owned" for
// a visitor who happens to be logged in and already holds every capability
// a product would grant (e.g. a Complete Package owner sees the standalone
// Simulator card as owned too) - an unauthenticated visitor sees the exact
// same catalog with no "Owned" badges.
export default async function CoursesPage() {
  const { supabase, user } = await getOptionalUser();

  const [products, ownedCapabilities] = await Promise.all([
    getStorefrontProducts(supabase),
    user ? getUserCapabilities(supabase, user.id) : Promise.resolve(new Set<string>()),
  ]);

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Courses", path: "/courses" }])} />
      <CoursesContent products={products} ownedCapabilities={Array.from(ownedCapabilities)} />
    </>
  );
}
