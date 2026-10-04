import type { Metadata } from "next";
import { mirroredPageMetadata } from "@/lib/seo";
import ServicesContent from "./ServicesContent";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd, serviceJsonLd } from "@/lib/structuredData";

const title = "AI Agents, Data & Analytics, Machine Learning | ZentexAI";
const description =
  "AI agents & automation, data & analytics, and machine learning, plus AI and project management consulting — built for real business operations.";

export const metadata: Metadata = mirroredPageMetadata("/services", "en", title, description);

const SERVICE_SCHEMAS = [
  { name: "AI Agents & Automation", description: "Practical AI systems built to do real work inside your organization.", path: "/services#ai-solutions" },
  { name: "Data & Analytics", description: "KPI frameworks, clean data models, and dashboards built around the decisions your business actually needs to make.", path: "/services#data-analytics" },
  { name: "Machine Learning", description: "Practical machine learning for forecasting, classification, and anomaly detection.", path: "/services#machine-learning" },
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
