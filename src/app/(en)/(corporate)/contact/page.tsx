import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import ContactContent from "./ContactContent";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd } from "@/lib/structuredData";

const title = "Contact ZentexAI | AI Consulting & PMP Training";
const description =
  "Contact ZentexAI about AI automation consulting, business inquiries or the PMP Mastery Program. We respond within 24 hours.";

export const metadata: Metadata = pageMetadata({ title, description, path: "/contact" });

export default function ContactPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Contact", path: "/contact" }])} />
      <ContactContent />
    </>
  );
}
