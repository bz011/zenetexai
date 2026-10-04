import type { Metadata } from "next";
import { mirroredPageMetadata } from "@/lib/seo";
import ServiceLandingContent from "@/components/ServiceLandingContent";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd, faqJsonLd, serviceJsonLd } from "@/lib/structuredData";
import { dataAnalyticsCopy } from "@/lib/serviceLandingCopy";

const title = "Data Analytics Services | ZentexAI";
const description =
  "Data analytics for growing businesses and teams: KPI frameworks, data audits, clean data models, dashboards and reporting automation built around real decisions.";
const PATH = "/services/data-analytics-uae";

export const metadata: Metadata = mirroredPageMetadata(PATH, "en", title, description);

export default function DataAnalyticsPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Services", path: "/services" },
          { name: "Data Analytics Services", path: PATH },
        ])}
      />
      <JsonLd
        data={serviceJsonLd({
          name: "Data Analytics Services",
          description: "KPI frameworks, data audits, data modelling, dashboards, and reporting automation.",
          path: PATH,
        })}
      />
      <JsonLd data={faqJsonLd(dataAnalyticsCopy.en.faq)} />
      <ServiceLandingContent copyKey="dataAnalytics" mechanism="analytics" />
    </>
  );
}
