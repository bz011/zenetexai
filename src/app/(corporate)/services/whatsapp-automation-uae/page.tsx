import type { Metadata } from "next";
import WhatsappAutomationContent from "./WhatsappAutomationContent";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd, serviceJsonLd } from "@/lib/structuredData";

const title = "WhatsApp Automation & AI Agents UAE | ZentexAI";
const description =
  "ZentexAI builds secure WhatsApp automation and AI agents for UAE businesses, connecting customer conversations with lead qualification, booking, CRM workflows and controlled human handoff.";
const PATH = "/services/whatsapp-automation-uae";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: PATH },
  openGraph: { title, description, url: PATH, type: "website" },
  twitter: { card: "summary_large_image", title, description },
};

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
        })}
      />
      <WhatsappAutomationContent />
    </>
  );
}
