import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import ResourcesContent from "./ResourcesContent";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd } from "@/lib/structuredData";
import { fetchPublishedPosts } from "@/lib/posts";

export const dynamic = "force-dynamic";

const title = "Resources & Insights | ZentexAI";
const description =
  "Practical articles from ZentexAI on AI automation for UAE businesses and PMP exam preparation, including Critical Path, Lead and Lag, and PMP practice questions.";

export const metadata: Metadata = pageMetadata({ title, description, path: "/resources" });

export default async function ResourcesPage() {
  const latestPosts = await fetchPublishedPosts(6);
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Resources", path: "/resources" }])} />
      <ResourcesContent latestPosts={latestPosts} />
    </>
  );
}
