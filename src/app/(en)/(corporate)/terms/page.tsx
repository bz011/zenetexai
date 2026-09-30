import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { termsCopy } from "@/lib/legalCopy";
import LegalPageContent from "@/components/legal/LegalPageContent";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd } from "@/lib/structuredData";

export const metadata: Metadata = pageMetadata({
  title: "Terms of Service | ZentexAI",
  description: "The terms governing your use of ZentexAI and ZentexAI Academy.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Terms of Service", path: "/terms" }])} />
      <LegalPageContent copy={termsCopy} />
    </>
  );
}
