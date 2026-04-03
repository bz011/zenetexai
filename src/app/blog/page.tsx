import type { Metadata } from "next";
import BlogContent from "./BlogContent";

export const metadata: Metadata = { title: "Blog — ZENETEXAI" };

export default function BlogPage() {
  return <BlogContent />;
}
