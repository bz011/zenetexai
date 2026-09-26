import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/features/commerce/services/productService";
import ProductPageBody from "./ProductPageBody";
import { createSupabaseServer } from "@/lib/supabase/server";
import { SIMULATOR_SLUG, simulatorMetadataText } from "@/lib/simulatorPageCopy";
import { mirroredPageMetadata, pageMetadata } from "@/lib/seo";

interface Props {
  params: Promise<{ courseSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { courseSlug: productSlug } = await params;
  const supabase = createSupabaseServer();
  const product = await getProductBySlug(supabase, productSlug);

  // A missing or unpublished product must answer HTTP 404. This route must NOT
  // have a loading.tsx: it would make Next stream the shell (status 200) before
  // this check runs, leaving a soft 404 (200 + noindex). Metadata resolution
  // is the first place the product is read, so deciding here also skips
  // building metadata for a page that does not exist. ProductPageBody keeps its
  // own notFound() as a second guard. (tests/productRoute404.test.ts guards this.)
  if (!product || !product.is_published) notFound();

  const path = `/courses/${product.slug}`;

  if (product.slug === SIMULATOR_SLUG) {
    const { title, description } = simulatorMetadataText("en");
    return mirroredPageMetadata(path, "en", title, description);
  }

  return pageMetadata({ title: `${product.title_en} — ZentexAI Academy`, description: product.description_en, path });
}

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({ params }: Props) {
  const { courseSlug } = await params;
  return <ProductPageBody productSlug={courseSlug} />;
}
