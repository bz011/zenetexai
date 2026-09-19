import { alternatesFor } from "@/lib/i18nRoutes";
import type { Metadata } from "next";
import ServiceLandingContent from "@/components/ServiceLandingContent";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd, faqJsonLd, serviceJsonLd } from "@/lib/structuredData";
import { powerBiCopy } from "@/lib/serviceLandingCopy";

const title = "Power BI Consulting UAE | Dashboards & Data Models | ZentexAI";
const description =
  "Power BI consulting for UAE businesses, including Dubai: management dashboards, data models, scheduled refresh, access design, existing-report reviews, and team training.";
const PATH = "/services/power-bi-consulting-uae";

export const metadata: Metadata = {
  title,
  description,
  alternates: alternatesFor(PATH, "en"),
  openGraph: { title, description, url: PATH, type: "website" },
  twitter: { card: "summary_large_image", title, description },
};

export default function PowerBiConsultingPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Services", path: "/services" },
          { name: "Power BI Consulting UAE", path: PATH },
        ])}
      />
      <JsonLd
        data={serviceJsonLd({
          name: "Power BI Consulting",
          description: "Power BI dashboards, data models, refresh and access setup, report reviews, and training for UAE businesses.",
          path: PATH,
          areaServed: ["United Arab Emirates"],
        })}
      />
      <JsonLd data={faqJsonLd(powerBiCopy.en.faq)} />
      <ServiceLandingContent copyKey="powerBi" />
    </>
  );
}
