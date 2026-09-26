import type { Metadata } from "next";
import { mirroredPageMetadata } from "@/lib/seo";
import WhatsappAutomationContent from "./WhatsappAutomationContent";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd, faqJsonLd, serviceJsonLd } from "@/lib/structuredData";
import translations from "@/lib/translations";

const title = "WhatsApp Automation & AI Agents UAE | ZentexAI";
const description =
  "WhatsApp AI automation for UAE businesses: agents that connect customer chats to lead qualification, booking and CRM workflows, with controlled human handoff.";
const PATH = "/services/whatsapp-automation-uae";

export const metadata: Metadata = mirroredPageMetadata(PATH, "en", title, description);

export default function WhatsappAutomationPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Services", path: "/services" },
          { name: "WhatsApp Automation UAE", path: PATH },
        ])}
      />
      <JsonLd
        data={serviceJsonLd({
          name: "WhatsApp Automation & AI Agents",
          description: "Secure WhatsApp automation and AI agents for UAE businesses, connecting customer conversations with approved knowledge, CRM, booking, and controlled human handoff.",
          path: PATH,
          areaServed: ["United Arab Emirates"],
        })}
      />
      <JsonLd data={faqJsonLd(translations.en.whatsappAutomation.faq)} />
      <WhatsappAutomationContent />
    </>
  );
}
