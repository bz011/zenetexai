import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import ArticlePage from "@/design-lab/blog-v5/ArticlePage";
import { getPost, labArticleHref } from "@/design-lab/blog-v5/blogData";
import { labGate, labMetadata } from "@/design-lab/gate";

type Props = { params: { slug: string } };

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://zentexai.com";

// Lab preview: the article's own meta title and description, still noindex
// (labMetadata). The canonical is the production URL (/blog/<slug>, where
// production serves every article), never this lab route.
export function generateMetadata({ params }: Props): Metadata {
  const post = getPost(params.slug);
  if (!post) return labMetadata("Article not found");
  return {
    ...labMetadata(post.metaTitle),
    title: `${post.metaTitle} — ZentexAI design lab`,
    description: post.description,
    alternates: { canonical: new URL(`/blog/${post.slug}`, SITE_URL).toString() },
  };
}

export default function Page({ params }: Props) {
  labGate();
  const post = getPost(params.slug);
  if (!post) notFound();
  // Articles are not translated: each lives only under its own language's blog.
  if (post.lang !== "en") redirect(labArticleHref(post));
  return <ArticlePage post={post} />;
}
