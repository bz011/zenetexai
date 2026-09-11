import type { Metadata } from "next";
import AcademyContent from "./AcademyContent";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd } from "@/lib/structuredData";

const title = "ZentexAI Academy — PMP Mastery Program & Exam Simulator";
const description =
  "Professional training from ZentexAI: a comprehensive Arabic-friendly PMP Mastery Program, an intelligent PMP exam simulator, and upcoming AI Agents training.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/academy" },
  openGraph: { title, description, url: "/academy", type: "website" },
  twitter: { card: "summary_large_image", title, description },
};

export default function AcademyPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Academy", path: "/academy" }])} />
      <AcademyContent />
    </>
  );
}
