/**
 * Renders one JSON-LD <script> tag. Server component (no "use client") -
 * every page using this stays server-rendered exactly as before.
 *
 * JSON.stringify already escapes control characters; the extra replace
 * guards specifically against a literal "</script>" appearing inside a
 * string value (e.g. an article body excerpt) prematurely closing the
 * script tag - a standard, minimal precaution for JSON-in-HTML embedding,
 * not a general HTML sanitizer (nothing here renders as HTML).
 */
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
