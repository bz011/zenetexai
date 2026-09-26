import { alternatesFor } from "@/lib/i18nRoutes";
import type { Metadata } from "next";
import AcademyContent from "./AcademyContent";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd } from "@/lib/structuredData";
import PmpDiscoverabilitySection from "@/components/seo/PmpDiscoverabilitySection";

const title = "PMP Course in Arabic & English (UAE) | ZentexAI Academy";
const description =
  "ZentexAI Academy offers an Arabic-friendly PMP Mastery Program (دورة PMP بالعربي) and a PMP exam simulator for professionals in the UAE and MENA, plus upcoming AI Agents training.";

export const metadata: Metadata = {
  title,
  description,
  alternates: alternatesFor("/academy", "en"),
  openGraph: { title, description, url: "/academy", type: "website" },
  twitter: { card: "summary_large_image", title, description },
};

export default function AcademyPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Academy", path: "/academy" }])} />
      <AcademyContent />
      <PmpDiscoverabilitySection variant="course" englishOnly />
    </>
  );
}
