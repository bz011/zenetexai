import type { Metadata } from "next";
import AcademyV5 from "@/app/(en)/(academy)/academy/AcademyV5";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd } from "@/lib/structuredData";
import PmpDiscoverabilitySection from "@/components/seo/PmpDiscoverabilitySection";
import { arabicMetadata } from "@/lib/arabicSeo";

/** Effective prices are read at render; refresh them every 5 minutes. */
export const revalidate = 300;

export const metadata: Metadata = arabicMetadata("/academy");

export default function ArabicAcademyPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "الرئيسية", path: "/ar" }, { name: "الأكاديمية", path: "/ar/academy" }])} />
      <AcademyV5 lang="ar" />
      <PmpDiscoverabilitySection variant="course" arabicOnly />
    </>
  );
}
