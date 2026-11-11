import { BLOG_POSTS } from "../../../scripts/seo/blogPostsData";
import { ARTICLES, type Lang } from "@/design-lab/content";
import { topicOf, type Topic } from "@/design-lab/resources-v5/resourcesCopy";

/**
 * Blog / article data for the design lab.
 *
 * Content: the real articles, read from the existing seed file that
 * populates website_posts (scripts/seo/blogPostsData.ts). Checked against
 * zentexai.com on 2026-11-11: titles, meta titles, meta descriptions and
 * body text are identical to the live pages. Nothing is copied or edited
 * here. (The local preview has no posts database, so production's own
 * query cannot run.)
 *
 * Added fields, none invented:
 *  - date: the publication date shown on the live blog (website_posts
 *    published_at; all eight read 11 September 2026), via ARTICLES.
 *  - lang: from the title's script, exactly as production's article page
 *    decides it (website_posts has no language column).
 *  - topic: derived from the slug by the Resources rules (no category
 *    column exists); null means "no reliable topic".
 *  - minutes: reading time from the body's word count (200 words a minute).
 *  - order: the live blog's listing order (newest first).
 */
export type Post = {
  slug: string;
  title: string;
  metaTitle: string;
  description: string;
  body: string;
  lang: Lang;
  date: string;
  topic: Topic | null;
  minutes: number;
};

const LIVE_ORDER = [
  "is-your-business-ready-for-ai-automation",
  "ai-automation-clinics-service-businesses",
  "whatsapp-automation-uae-businesses",
  "ai-agents-for-business-uae",
  "pmp-exam-simulator-how-to-use",
  "pmp-exam-questions-thinking-approach",
  "lead-and-lag-project-scheduling-pmp",
  "critical-path-project-management-pmp",
];

const dates = new Map<string, string>(ARTICLES.map((a) => [a.slug, a.date]));
const isArabic = (text: string) => /[؀-ۿ]/.test(text);
const words = (md: string) => (md.replace(/\]\([^)]*\)/g, "]").match(/[\p{L}\p{N}]+/gu) ?? []).length;

export const POSTS: Post[] = LIVE_ORDER.flatMap((slug) => {
  const p = BLOG_POSTS.find((x) => x.slug === slug);
  const date = dates.get(slug);
  if (!p || !date) return [];
  return [
    {
      slug: p.slug,
      title: p.title,
      metaTitle: p.meta_title,
      description: p.meta_description,
      body: p.body,
      lang: isArabic(p.title) ? "ar" : "en",
      date,
      topic: topicOf(p.slug),
      minutes: Math.max(1, Math.round(words(p.body) / 200)),
    },
  ];
});

export const getPost = (slug: string) => POSTS.find((p) => p.slug === slug) ?? null;

/** Each blog lists only the articles written in its own language (none are translated). */
export const postsIn = (lang: Lang) => POSTS.filter((p) => p.lang === lang);

/** Design-lab route of an article: the blog of the article's own language. */
export const labBlogBase = (lang: Lang) => (lang === "ar" ? "/design-lab/ar/blog" : "/design-lab/blog");
export const labArticleHref = (post: Post) => `${labBlogBase(post.lang)}/${post.slug}`;

/** Up to three other articles in the SAME language: same topic first, then the rest, in listing order. */
export function relatedTo(post: Post, count = 3): Post[] {
  const others = postsIn(post.lang).filter((p) => p.slug !== post.slug);
  return [...others.filter((p) => post.topic && p.topic === post.topic), ...others.filter((p) => !post.topic || p.topic !== post.topic)].slice(0, count);
}
