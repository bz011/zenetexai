import { getLabContent } from "@/site/content";
import FinalCta from "@/site/home/FinalCta";
import site from "@/site/site.module.css";
import page from "@/site/home/hero.module.css";
import JsonLd from "@/components/JsonLd";
import { articleJsonLd, breadcrumbJsonLd } from "@/lib/structuredData";
import { formatArticleDate } from "@/site/resources/formatDate";
import ArticleBody from "./ArticleBody";
import { Arrow, Entry } from "./BlogIndex";
import { articleHref, type Post } from "./blogData";
import { blogCopy } from "./blogCopy";
import styles from "./blog.module.css";

/**
 * Article reading page (v5), for every post at /blog/<slug>. The page takes
 * the ARTICLE's language (an Arabic article is an Arabic, RTL page). Related
 * articles are in the same language. Structured data is the production
 * article page's (breadcrumb + Article, datePublished = the stored
 * published_at as ISO 8601). In-article links are left as written.
 */
export default function ArticlePage({ post, related }: { post: Post; related: Post[] }) {
  const lang = post.lang;
  const c = getLabContent(lang);
  const k = blogCopy[lang];

  return (
    <div className={`${page.page} ${site.underHeader}`} lang={lang} dir={c.dir}>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }, { name: post.title, path: `/blog/${post.slug}` }])} />
      <JsonLd data={articleJsonLd({ headline: post.title, description: post.description, path: `/blog/${post.slug}`, datePublished: post.publishedAt, inLanguage: post.lang })} />
      <div className={styles.main}>
        <article className={styles.article}>
          <a href="/blog" className={styles.back}>
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

          <ArticleBody markdown={post.body} lang={lang} />
        </article>

        {related.length > 0 && (
          <section className={styles.related} aria-labelledby="ar-related">
            <h2 id="ar-related" className={styles.archiveTitle}>{k.related}</h2>
            <ol className={styles.entries}>
              {related.map((p) => (
                <li key={p.slug}>
                  <Entry post={p} lang={lang} href={articleHref(p)} />
                </li>
              ))}
            </ol>
          </section>
        )}

        <FinalCta lang={lang} copy={k.cta} compact />
      </div>
    </div>
  );
}
