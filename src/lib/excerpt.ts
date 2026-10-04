import { unified } from "unified";
import remarkParse from "remark-parse";

/**
 * Block-level node types after which a word-boundary space is inserted.
 * mdast text nodes concatenate with no separator otherwise, which glues
 * adjacent headings/paragraphs/list items together (e.g. a "## Heading"
 * followed by a paragraph becomes "HeadingFirst word of paragraph").
 */
const BLOCK_BOUNDARY_TYPES = new Set([
  "paragraph",
  "heading",
  "listItem",
  "blockquote",
  "tableRow",
  "tableCell",
  "code",
]);

interface MdNode {
  type: string;
  value?: string;
  children?: MdNode[];
}

function collectText(node: MdNode, parts: string[]): void {
  if (node.type === "text" || node.type === "inlineCode") {
    if (node.value) parts.push(node.value);
    return;
  }
  node.children?.forEach((child) => collectText(child, parts));
  if (BLOCK_BOUNDARY_TYPES.has(node.type)) parts.push(" ");
}

/**
 * Plain-text rendering of a Markdown string, via the same parser the real
 * article body renders with (react-markdown, see MarkdownBody.tsx) rather
 * than a regex strip - so "##", "**", "_", "[text](url)" and list markers
 * disappear cleanly instead of leaking into card excerpts and descriptions.
 * Works unchanged for Arabic text (it isn't script-aware, just structural).
 */
export function markdownToPlainText(markdown: string): string {
  const tree = unified().use(remarkParse).parse(markdown) as unknown as MdNode;
  const parts: string[] = [];
  collectText(tree, parts);
  return parts.join("").replace(/\s+/g, " ").trim();
}

/** Shared excerpt builder for article cards (Home, Resources, Blog) and any Article description built from a post body. */
export function markdownExcerpt(markdown: string, maxLen = 120): string {
  const text = markdownToPlainText(markdown);
  return text.length > maxLen ? text.slice(0, maxLen).trimEnd() + "…" : text;
}
