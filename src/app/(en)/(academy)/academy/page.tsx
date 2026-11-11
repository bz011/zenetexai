import type { Metadata } from "next";
import { mirroredPageMetadata } from "@/lib/seo";
import AcademyV5 from "@/app/(en)/(academy)/academy/AcademyV5";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd } from "@/lib/structuredData";
import PmpDiscoverabilitySection from "@/components/seo/PmpDiscoverabilitySection";

const title = "PMP Course in Arabic & English | ZentexAI Academy";
const description =
  "ZentexAI Academy: an Arabic-friendly PMP Mastery Program (دورة PMP بالعربي) and a PMP exam simulator for working professionals.";

/** Effective prices are read at render; refresh them every 5 minutes. */
export const revalidate = 300;

export const metadata: Metadata = mirroredPageMetadata("/academy", "en", title, description);

export default function AcademyPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Academy", path: "/academy" }])} />
      <AcademyV5 lang="en" />
      <PmpDiscoverabilitySection variant="course" englishOnly />
    </>
  );
}
