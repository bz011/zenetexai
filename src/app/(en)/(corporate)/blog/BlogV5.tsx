"use client";

import { useLang } from "@/lib/LanguageContext";
import BlogIndex from "@/site/blog/BlogIndex";
import type { Post } from "@/site/blog/blogData";

/**
 * /blog has no /ar twin: it follows the visitor's stored language
 * preference, listing that language's articles (approved design: English
 * and Arabic articles are never mixed). Posts come from the server.
 */
export default function BlogV5({ posts }: { posts: Post[] }) {
  const { lang } = useLang();
  return <BlogIndex lang={lang} posts={posts} />;
}
