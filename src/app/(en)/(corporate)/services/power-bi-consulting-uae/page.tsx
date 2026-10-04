import type { Metadata } from "next";
import { mirroredPageMetadata } from "@/lib/seo";
import ServiceLandingContent from "@/components/ServiceLandingContent";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd, faqJsonLd, serviceJsonLd } from "@/lib/structuredData";
import { powerBiCopy } from "@/lib/serviceLandingCopy";

const title = "Power BI Consulting | ZentexAI";
const description =
  "Power BI consulting: management dashboards, data models, scheduled refresh, access design, report reviews and team training.";
const PATH = "/services/power-bi-consulting-uae";

export const metadata: Metadata = mirroredPageMetadata(PATH, "en", title, description);

export default function PowerBiConsultingPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Services", path: "/services" },
          { name: "Power BI Consulting", path: PATH },
        ])}
      />
      <JsonLd
        data={serviceJsonLd({
          name: "Power BI Consulting",
          description: "Power BI dashboards, data models, refresh and access setup, report reviews, and training.",
          path: PATH,
        })}
      />
      <JsonLd data={faqJsonLd(powerBiCopy.en.faq)} />
      <ServiceLandingContent copyKey="powerBi" mechanism="powerBi" />
    </>
  );
}
