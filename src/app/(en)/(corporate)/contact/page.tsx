import type { Metadata } from "next";
import ContactContent from "./ContactContent";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd } from "@/lib/structuredData";

const title = "Contact ZentexAI — AI Consulting & PMP Training Inquiries";
const description =
  "Get in touch with ZentexAI for AI automation consulting, business inquiries, or questions about the PMP Mastery Program. We respond within 24 hours.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/contact" },
  openGraph: { title, description, url: "/contact", type: "website" },
  twitter: { card: "summary_large_image", title, description },
};

export default function ContactPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Contact", path: "/contact" }])} />
      <ContactContent />
    </>
  );
}
