import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import BlogContent from "./BlogContent";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd } from "@/lib/structuredData";
import { fetchPublishedPosts, type PublishedPost } from "@/lib/posts";

export const dynamic = "force-dynamic";

const title = "Blog | ZentexAI Insights on AI & PMP";
const description =
  "Articles from ZentexAI on business AI automation and PMP exam preparation, written to help you apply AI and pass the PMP exam with real understanding.";

export const metadata: Metadata = pageMetadata({ title, description, path: "/blog" });

export type { PublishedPost };

export default async function BlogPage() {
  const publishedPosts = await fetchPublishedPosts();
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }])} />
      <BlogContent publishedPosts={publishedPosts} />
    </>
  );
}
