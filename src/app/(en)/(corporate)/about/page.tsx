import type { Metadata } from "next";
import AboutContent from "./AboutContent";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd } from "@/lib/structuredData";

const title = "About ZentexAI — AI Solutions & Professional Learning Company";
const description =
  "Learn about ZentexAI's mission to help organizations apply AI effectively and help professionals build real project management skills, and meet founder Zaid Al-Badareen.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/about" },
  openGraph: { title, description, url: "/about", type: "website" },
  twitter: { card: "summary_large_image", title, description },
};

export default function AboutPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "About", path: "/about" }])} />
      <AboutContent />
    </>
  );
}
