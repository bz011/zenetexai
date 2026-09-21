import type { Metadata } from "next";
import ProductPageBody from "@/app/(en)/(academy)/courses/[courseSlug]/ProductPageBody";
import { arabicMetadata } from "@/lib/arabicSeo";
import { SIMULATOR_SLUG } from "@/lib/simulatorPageCopy";

export const metadata: Metadata = arabicMetadata("/courses/pmp-exam-simulator");
export const dynamic = "force-dynamic";

export default function ArabicSimulatorPage() {
  return <ProductPageBody productSlug={SIMULATOR_SLUG} lang="ar" />;
}
