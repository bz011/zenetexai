import type { Metadata } from "next";
import { mirroredPageMetadata } from "@/lib/seo";
import HomeContent from "./HomeContent";
import { fetchPublishedPosts } from "@/lib/posts";
import { markdownExcerpt } from "@/lib/excerpt";

// ISR instead of force-dynamic: nothing rendered on this page depends on
// the visitor's session (Header/Footer read auth state client-side,
// independently of this page's rendering mode - see (corporate)/layout.tsx),
// so a shared, periodically-refreshed page is safe here. This also means a
// transient database hiccup only ever affects one background regeneration
// per hour rather than every single visitor's request - and even then,
// Next.js keeps serving the last successfully generated page instead of a
// suddenly-empty one, unlike force-dynamic where a failed query is exposed
// to that request's visitor immediately with nothing to fall back on.
export const revalidate = 3600;

const title = "ZentexAI — AI Agents, Data & Analytics, Machine Learning";
const description =
  "AI agents, automation, data & analytics, and machine learning built for real business operations, plus project management consulting and PMP exam training.";

export const metadata: Metadata = mirroredPageMetadata("/", "en", title, description);

export default async function HomePage() {
  const posts = await fetchPublishedPosts(3);
  const latestPosts = posts.map((post) => ({ ...post, excerpt: markdownExcerpt(post.body, 110) }));
  return <HomeContent latestPosts={latestPosts} />;
}
