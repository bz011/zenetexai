import { getLabContent, type Lang } from "@/site/content";
import FinalCta from "@/site/home/FinalCta";
import site from "@/site/site.module.css";
import page from "@/site/home/hero.module.css";
import { formatArticleDate } from "@/site/resources/formatDate";
import translations from "@/lib/translations";
import { articleHref, postsIn, type Post } from "./blogData";
import { blogCopy } from "./blogCopy";
import styles from "./blog.module.css";

/**
 * Blog index (v5): the journal's archive, one per language. The English blog
 * lists only English articles and the Arabic blog only Arabic ones (none are
 * translated). A compact editorial hero, the newest article as a typographic
 * lead (no illustration: the Resources page is the visual, topic-led one),
 * then the other articles in a two-column archive divided by hairlines.
 * Server-rendered; dates are deterministic.
 *
 * `blogBase`: where article links point. Production would use "/blog"; the
 * design lab passes its own route so the article template can be previewed.
 */
export default function BlogIndex({ lang, posts: all }: { lang: Lang; posts: Post[] }) {
  const c = getLabContent(lang);
  const k = blogCopy[lang];
  const posts = postsIn(all, lang);
  const [lead, ...rest] = posts;

  return (
    <div className={`${page.page} ${site.underHeader}`} lang={lang} dir={c.dir}>
      <div className={styles.main}>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>{k.eyebrow}</p>
          <h1 className={styles.title}>
            {k.title.lead}
            <span className={styles.accent}>{k.title.highlight}</span>
          </h1>
          <p className={styles.intro}>{k.intro}</p>
          <p className={styles.note}>{k.archiveNote(posts.length)}</p>
        </header>

        {!lead && <p className={styles.empty}>{translations[lang].resources.articles_empty}</p>}

        {lead && (
        <section className={styles.lead} aria-labelledby="bl-lead">
          <Kicker post={lead} lang={lang} first={k.latest} />
          <div className={styles.leadGrid}>
            <h2 id="bl-lead" className={styles.leadTitle}>
              <a href={`${articleHref(lead)}`} lang={lead.lang} dir="auto">{lead.title}</a>
            </h2>
            <div className={styles.leadAside}>
              <p className={styles.leadDek} lang={lead.lang} dir="auto">{lead.description}</p>
              <Meta post={lead} lang={lang} />
              <a href={`${articleHref(lead)}`} className={styles.readMore} aria-describedby="bl-lead">
                {k.read}
                <Arrow />
              </a>
            </div>
          </div>
        </section>
        )}

        {rest.length > 0 && (
        <section className={styles.archive} aria-labelledby="bl-archive">
          <h2 id="bl-archive" className={styles.archiveTitle}>{k.archive}</h2>
          <ol className={styles.entries}>
            {rest.map((p) => (
              <li key={p.slug}>
                <Entry post={p} lang={lang} href={`${articleHref(p)}`} />
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

/** One archive entry; also used for related articles on the article page. */
export function Entry({ post, lang, href }: { post: Post; lang: Lang; href: string }) {
  return (
    <a href={href} className={styles.entry}>
      <Kicker post={post} lang={lang} />
      <h3 className={styles.entryTitle} lang={post.lang} dir="auto">{post.title}</h3>
      <p className={styles.entryDek} lang={post.lang} dir="auto">{post.description}</p>
      <Meta post={post} lang={lang} />
    </a>
  );
}

function Kicker({ post, lang, first }: { post: Post; lang: Lang; first?: string }) {
  const k = blogCopy[lang];
  return (
    <p className={styles.kicker}>
      {first && <span className={styles.kickerFirst}>{first}</span>}
      {post.topic && <span>{k.topics[post.topic]}</span>}
    </p>
  );
}

function Meta({ post, lang }: { post: Post; lang: Lang }) {
  const k = blogCopy[lang];
  return (
    <p className={styles.meta}>
      <time dateTime={post.date}>{formatArticleDate(post.date, lang)}</time>
      <span>{k.minutes(post.minutes)}</span>
    </p>
  );
}

export function Arrow() {
  return (
    <svg className={styles.arrow} viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}
