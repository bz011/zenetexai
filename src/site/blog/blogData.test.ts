import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { BLOG_POSTS } from "../../../scripts/seo/blogPostsData";
import { articleHref, postsIn, relatedTo, toIso, toPost, type PostRow } from "./blogData";
import BlogIndex from "./BlogIndex";
import ArticlePage from "./ArticlePage";

// Rows shaped like website_posts (the pg driver returns published_at as a Date).
const STORED = new Date("2026-09-11T16:24:32.005Z");
const rows: PostRow[] = BLOG_POSTS.map((p, i) => ({
  slug: p.slug,
  title: p.title,
  body: p.body,
  meta_title: p.meta_title,
  meta_description: p.meta_description,
  published_at: new Date(STORED.getTime() + i * 100),
}));
const posts = rows.map(toPost);

describe("v5 blog adapter (website_posts rows)", () => {
  it("keeps the stored publication timestamp exactly (no invented dates)", () => {
    expect(posts[0].publishedAt).toBe("2026-09-11T16:24:32.005Z");
    expect(posts[0].date).toBe("2026-09-11");
    expect(toIso("2026-09-11T16:24:33.348Z")).toBe("2026-09-11T16:24:33.348Z");
  });

  it("detects language from the title script, like the production article page", () => {
    expect(postsIn(posts, "en").length + postsIn(posts, "ar").length).toBe(posts.length);
    for (const p of postsIn(posts, "ar")) expect(/[؀-ۿ]/.test(p.title)).toBe(true);
    for (const p of postsIn(posts, "en")) expect(/[؀-ۿ]/.test(p.title)).toBe(false);
  });

  it("links every article at its production URL", () => {
    for (const p of posts) expect(articleHref(p)).toBe(`/blog/${p.slug}`);
  });

  it("keeps related articles in the article's own language", () => {
    for (const p of posts) for (const r of relatedTo(p, posts)) expect(r.lang).toBe(p.lang);
  });
});

describe("v5 blog pages render real rows", () => {
  it("blog index lists only the visitor's language, with production links", () => {
    for (const lang of ["en", "ar"] as const) {
      const html = renderToStaticMarkup(createElement(BlogIndex, { lang, posts }));
      for (const p of posts) expect(html.includes(`href="/blog/${p.slug}"`)).toBe(p.lang === lang);
    }
  });

  it("blog index shows the production empty state with no posts", () => {
    expect(renderToStaticMarkup(createElement(BlogIndex, { lang: "en", posts: [] }))).toContain("No articles published yet");
  });

  it("article page keeps production structured data with the stored timestamp", () => {
    const post = posts[0];
    const html = renderToStaticMarkup(createElement(ArticlePage, { post, related: relatedTo(post, posts) }));
    expect(html).toContain('"datePublished":"2026-09-11T16:24:32.005Z"');
    expect(html).toContain(`/blog/${post.slug}"`);
    expect(html).toContain(`<h1`);
    expect(html).not.toContain("/design-lab");
  });
});
