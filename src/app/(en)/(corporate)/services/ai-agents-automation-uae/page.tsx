import type { Metadata } from "next";
import { mirroredPageMetadata } from "@/lib/seo";
import AiAgentsAutomationContent from "./AiAgentsAutomationContent";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd, faqJsonLd, serviceJsonLd } from "@/lib/structuredData";
import translations from "@/lib/translations";

const title = "AI Agents & Business Automation UAE | ZentexAI";
const description =
  "AI agent development and business automation for UAE companies: secure agents that connect approved knowledge, workflows and systems, with human oversight.";
const PATH = "/services/ai-agents-automation-uae";

export const metadata: Metadata = mirroredPageMetadata(PATH, "en", title, description);

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
          areaServed: ["United Arab Emirates"],
        })}
      />
      <JsonLd data={faqJsonLd(translations.en.aiAgentsAutomation.faq)} />
      <AiAgentsAutomationContent />
    </>
  );
}
