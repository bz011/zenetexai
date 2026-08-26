import type { Metadata } from "next";
import ResourcesContent from "./ResourcesContent";
import { fetchPublishedPosts } from "@/lib/posts";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Resources — ZentexAI" };

export default async function ResourcesPage() {
  const latestPosts = await fetchPublishedPosts(6);
  return <ResourcesContent latestPosts={latestPosts} />;
}
