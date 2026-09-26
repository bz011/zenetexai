import type { Metadata } from "next";
import AcademyContent from "@/app/(en)/(academy)/academy/AcademyContent";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd } from "@/lib/structuredData";
import PmpDiscoverabilitySection from "@/components/seo/PmpDiscoverabilitySection";
import { arabicMetadata } from "@/lib/arabicSeo";

export const metadata: Metadata = arabicMetadata("/academy");

export default function ArabicAcademyPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "الرئيسية", path: "/ar" }, { name: "الأكاديمية", path: "/ar/academy" }])} />
      <AcademyContent />
      <PmpDiscoverabilitySection variant="course" arabicOnly />
    </>
  );
}
