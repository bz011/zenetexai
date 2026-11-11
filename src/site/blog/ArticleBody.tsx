import ReactMarkdown from "react-markdown";
import type { Lang } from "@/site/content";
import styles from "./blog.module.css";

/**
 * The article's own Markdown, rendered on the server (no client re-render, so
 * nothing to hydrate). The text is untouched.
 *
 * `articleHref` (design lab): where a link to another article (/blog/<slug>)
 * should point; every other link keeps its real path. Without it, links are
 * left exactly as written (production).
 */
export default function ArticleBody({ markdown, lang, articleHref }: { markdown: string; lang: Lang; articleHref?: (slug: string) => string }) {
  return (
    <div className={styles.prose} lang={lang} dir={lang === "ar" ? "rtl" : "ltr"}>
      <ReactMarkdown
        components={{
          a: ({ href = "", children }) => {
            const m = /^\/blog\/([a-z0-9-]+)$/.exec(href);
            return <a href={articleHref && m ? articleHref(m[1]) : href}>{children}</a>;
          },
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
