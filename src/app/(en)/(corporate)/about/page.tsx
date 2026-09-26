import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import AboutContent from "./AboutContent";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd } from "@/lib/structuredData";

const title = "About ZentexAI | AI Solutions & Professional Learning";
const description =
  "ZentexAI's mission to help organizations apply AI effectively and help professionals build project management skills. Meet founder Zaid Al-Badareen.";

export const metadata: Metadata = pageMetadata({ title, description, path: "/about" });

export default function AboutPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "About", path: "/about" }])} />
      <AboutContent />
    </>
  );
}
