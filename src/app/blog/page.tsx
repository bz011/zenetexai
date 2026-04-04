import type { Metadata } from "next";
import BlogContent from "./BlogContent";

export const metadata: Metadata = { title: "Blog — ZENTEXAI" };

export default function BlogPage() {
  return <BlogContent />;
}
