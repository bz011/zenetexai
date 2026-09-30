import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { privacyCopy } from "@/lib/legalCopy";
import LegalPageContent from "@/components/legal/LegalPageContent";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd } from "@/lib/structuredData";

export const metadata: Metadata = pageMetadata({
  title: "Privacy Policy | ZentexAI",
  description: "How ZentexAI collects, uses, and protects your information.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Privacy Policy", path: "/privacy" }])} />
      <LegalPageContent copy={privacyCopy} />
    </>
  );
}
