import type { Metadata } from "next";
import { mirroredPageMetadata } from "@/lib/seo";
import AcademyContent from "./AcademyContent";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd } from "@/lib/structuredData";
import PmpDiscoverabilitySection from "@/components/seo/PmpDiscoverabilitySection";

const title = "PMP Course in Arabic & English (UAE) | ZentexAI Academy";
const description =
  "ZentexAI Academy: an Arabic-friendly PMP Mastery Program (دورة PMP بالعربي) and a PMP exam simulator for professionals in the UAE and MENA.";

export const metadata: Metadata = mirroredPageMetadata("/academy", "en", title, description);

export default function AcademyPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Academy", path: "/academy" }])} />
      <AcademyContent />
      <PmpDiscoverabilitySection variant="course" englishOnly />
    </>
  );
}
