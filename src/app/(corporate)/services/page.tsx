import type { Metadata } from "next";
import ServicesContent from "./ServicesContent";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd, serviceJsonLd } from "@/lib/structuredData";

const title = "AI Solutions, Automation & Consulting for UAE Businesses — ZentexAI";
const description =
  "Practical AI agents, workflow automation, and AI consulting for businesses in the UAE and MENA region, plus hands-on project management consulting. Built to produce real outcomes.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/services" },
  openGraph: { title, description, url: "/services", type: "website" },
  twitter: { card: "summary_large_image", title, description },
};

const SERVICE_SCHEMAS = [
  { name: "AI Solutions", description: "Practical AI systems built to do real work inside your organization.", path: "/services#ai-solutions" },
  { name: "AI Consulting", description: "Clear guidance on where AI fits your organization, and how to adopt it responsibly.", path: "/services#ai-consulting" },
  { name: "Project Management Consulting", description: "Hands-on project delivery expertise — from setting up a PMO to recovering a troubled project.", path: "/services#pm-consulting" },
];

export default function ServicesPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Services", path: "/services" }])} />
      {SERVICE_SCHEMAS.map((s) => (
        <JsonLd key={s.path} data={serviceJsonLd(s)} />
      ))}
      <ServicesContent />
    </>
  );
}
