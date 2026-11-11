import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import ResourcesV5 from "./ResourcesV5";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd } from "@/lib/structuredData";
import { fetchPublishedPosts } from "@/lib/posts";
import { toPost } from "@/site/blog/blogData";

export const dynamic = "force-dynamic";

const title = "Resources & Insights | ZentexAI";
const description =
  "Practical articles from ZentexAI on AI automation and PMP exam preparation, including Critical Path, Lead and Lag, and PMP practice questions.";

export const metadata: Metadata = pageMetadata({ title, description, path: "/resources" });

export default async function ResourcesPage() {
  const posts = await fetchPublishedPosts();
  const articles = posts.map(toPost).map(({ slug, lang, title, date, topic }) => ({ slug, lang, title, date, topic }));
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Resources", path: "/resources" }])} />
      <ResourcesV5 articles={articles} />
    </>
  );
}
