import type { Metadata } from "next";
import ServicesContent from "@/app/(en)/(corporate)/services/ServicesContent";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd, serviceJsonLd } from "@/lib/structuredData";
import { arabicMetadata } from "@/lib/arabicSeo";
import translations from "@/lib/translations";

export const metadata: Metadata = arabicMetadata("/services");

// Mirrors the English overview's SERVICE_SCHEMAS (src/app/(en)/(corporate)/services/page.tsx)
// one Service entry per category actually shown on this page - built from the same
// ar.services.categories copy the page renders, so the two languages can't drift apart.
const SERVICE_SCHEMAS = translations.ar.services.categories.map((c) => ({
  name: c.title,
  description: c.desc,
  path: `/ar/services#${c.id}`,
}));

export default function ArabicServicesPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "الرئيسية", path: "/ar" }, { name: "الخدمات", path: "/ar/services" }])} />
      {SERVICE_SCHEMAS.map((s) => (
        <JsonLd key={s.path} data={serviceJsonLd(s)} />
      ))}
      <ServicesContent />
    </>
  );
}
