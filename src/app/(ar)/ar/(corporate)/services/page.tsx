import type { Metadata } from "next";
import ServicesContent from "@/app/(en)/(corporate)/services/ServicesContent";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd } from "@/lib/structuredData";
import { arabicMetadata } from "@/lib/arabicSeo";

export const metadata: Metadata = arabicMetadata("/services");

export default function ArabicServicesPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "الرئيسية", path: "/ar" }, { name: "الخدمات", path: "/ar/services" }])} />
      <ServicesContent />
    </>
  );
}
