import { getLabContent } from "@/design-lab/content";
import { hanken, plexArabicA3 } from "@/design-lab/a3/fonts";
import SiteHeader from "@/design-lab/home-v5/SiteHeader";
import FinalCta from "@/design-lab/home-v5/FinalCta";
import Footer from "@/design-lab/home-v5/Footer";
import page from "@/design-lab/home-v5/hero.module.css";
import JsonLd from "@/components/JsonLd";
import { articleJsonLd, breadcrumbJsonLd } from "@/lib/structuredData";
import { formatArticleDate } from "@/design-lab/resources-v5/formatDate";
import ArticleBody from "./ArticleBody";
import { Arrow, Entry } from "./BlogIndex";
import { getPost, labArticleHref, labBlogBase, relatedTo, type Post } from "./blogData";
import { blogCopy } from "./blogCopy";
import styles from "./blog.module.css";

/**
 * Article reading page (v5), reusable for every post. The whole page takes
 * the ARTICLE's language: an English article is an English page, an Arabic
 * article an Arabic (RTL) page. Related articles are in the same language.
 * No article has a translation, so the language switch goes to the other
 * language's blog index rather than to a translated article.
 *
 * Structured data is the production article page's (breadcrumb + Article)
 * with the production path /blog/<slug>: production serves every article
 * there, so the lab's /ar/blog routes are never presented as canonical.
 */
export default function ArticlePage({ post }: { post: Post }) {
  const lang = post.lang;
  const c = getLabContent(lang);
  const k = blogCopy[lang];
  const otherBlog = labBlogBase(lang === "en" ? "ar" : "en");
  const related = relatedTo(post);
  // In-article links to other posts go to that post's own language route.
  const articleHref = (slug: string) => {
    const target = getPost(slug);
    return target ? labArticleHref(target) : `${labBlogBase(lang)}/${slug}`;
  };

  return (
    <div className={`${page.page} ${hanken.variable} ${plexArabicA3.variable}`} lang={lang} dir={c.dir}>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }, { name: post.title, path: `/blog/${post.slug}` }])} />
      <JsonLd data={articleJsonLd({ headline: post.title, description: post.description, path: `/blog/${post.slug}`, datePublished: post.date, inLanguage: post.lang })} />

      <SiteHeader lang={lang} languageHref={otherBlog} current="/blog" logoIntro={false} />

      <main className={styles.main}>
        <article className={styles.article}>
          <a href={labBlogBase(lang)} className={styles.back}>
            <Arrow />
            {k.back}
          </a>

          <header className={styles.articleHead}>
            <p className={styles.kicker}>
              <span className={styles.kickerFirst}>{k.eyebrow}</span>
              {post.topic && <span>{k.topics[post.topic]}</span>}
            </p>
            <h1 className={styles.articleTitle}>{post.title}</h1>
            <p className={styles.articleDek}>{post.description}</p>
            <p className={styles.meta}>
              <span>
                {k.published} <time dateTime={post.date}>{formatArticleDate(post.date, lang, "long")}</time>
              </span>
              <span>{k.minutes(post.minutes)}</span>
            </p>
          </header>

          <ArticleBody markdown={post.body} lang={lang} articleHref={articleHref} />
        </article>

        {related.length > 0 && (
          <section className={styles.related} aria-labelledby="ar-related">
            <h2 id="ar-related" className={styles.archiveTitle}>{k.related}</h2>
            <ol className={styles.entries}>
              {related.map((p) => (
                <li key={p.slug}>
                  <Entry post={p} lang={lang} href={labArticleHref(p)} />
                </li>
              ))}
            </ol>
          </section>
        )}

        <FinalCta lang={lang} copy={k.cta} compact />
      </main>

      <Footer lang={lang} onHome={false} />
    </div>
  );
}
