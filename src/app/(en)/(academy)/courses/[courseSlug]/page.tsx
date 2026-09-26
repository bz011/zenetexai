import type { Metadata } from "next";
import { getProductBySlug } from "@/features/commerce/services/productService";
import ProductPageBody from "./ProductPageBody";
import { createSupabaseServer } from "@/lib/supabase/server";
import { SIMULATOR_SLUG, simulatorMetadataText } from "@/lib/simulatorPageCopy";
import { alternatesFor } from "@/lib/i18nRoutes";

interface Props {
  params: Promise<{ courseSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { courseSlug: productSlug } = await params;
  const supabase = createSupabaseServer();
  const product = await getProductBySlug(supabase, productSlug);

  if (!product || !product.is_published) {
    return { title: "Product Not Found — ZENTEXAI Academy", robots: { index: false, follow: false } };
  }

  const path = `/courses/${product.slug}`;

  if (product.slug === SIMULATOR_SLUG) {
    const { title, description } = simulatorMetadataText("en");
    return {
      title,
      description,
      alternates: alternatesFor(path, "en"),
      openGraph: { title, description, url: path, type: "website" },
      twitter: { card: "summary_large_image", title, description },
    };
  }

  const title = `${product.title_en} — ZentexAI Academy`;
  const description = product.description_en;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({ params }: Props) {
  const { courseSlug } = await params;
  return <ProductPageBody productSlug={courseSlug} />;
}
