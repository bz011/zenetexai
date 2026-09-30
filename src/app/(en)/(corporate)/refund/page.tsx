import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { refundCopy } from "@/lib/legalCopy";
import LegalPageContent from "@/components/legal/LegalPageContent";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd } from "@/lib/structuredData";

export const metadata: Metadata = pageMetadata({
  title: "Refund Policy | ZentexAI",
  description: "The refund terms for ZentexAI Academy's paid programs.",
  path: "/refund",
});

export default function RefundPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Refund Policy", path: "/refund" }])} />
      <LegalPageContent copy={refundCopy} />
    </>
  );
}
