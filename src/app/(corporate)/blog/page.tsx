import type { Metadata } from "next";
import BlogContent from "./BlogContent";
import { fetchPublishedPosts, type PublishedPost } from "@/lib/posts";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Blog — ZentexAI" };

export type { PublishedPost };

export default async function BlogPage() {
  const publishedPosts = await fetchPublishedPosts();
  return <BlogContent publishedPosts={publishedPosts} />;
}
