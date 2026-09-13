import type { Metadata } from "next";
import AiAgentsAutomationContent from "./AiAgentsAutomationContent";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd, serviceJsonLd } from "@/lib/structuredData";

const title = "AI Agents & Business Automation UAE | ZentexAI";
const description =
  "ZentexAI designs secure, production-ready AI agents and business automation for UAE companies, connecting knowledge, workflows and business systems with controlled human oversight.";
const PATH = "/services/ai-agents-automation-uae";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: PATH },
  openGraph: { title, description, url: PATH, type: "website" },
  twitter: { card: "summary_large_image", title, description },
};

export default function AiAgentsAutomationPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Services", path: "/services" },
          { name: "AI Agents & Automation UAE", path: PATH },
        ])}
      />
      <JsonLd
        data={serviceJsonLd({
          name: "AI Agents & Business Automation",
          description: "Secure, production-ready AI agents that connect approved knowledge, workflows, and business systems for UAE companies, with human oversight where it matters.",
          path: PATH,
        })}
      />
      <AiAgentsAutomationContent />
    </>
  );
}
