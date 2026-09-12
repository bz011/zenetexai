import type { Metadata } from "next";
import HomeContent from "./HomeContent";
import { fetchPublishedPosts } from "@/lib/posts";

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

const title = "ZentexAI — AI Solutions & Professional PMP Training";
const description =
  "ZentexAI helps organizations across the UAE and MENA region apply AI automation effectively, and helps professionals master the PMP exam through our Arabic-friendly PMP Mastery Program and exam simulator.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/" },
  openGraph: { title, description, url: "/", type: "website" },
  twitter: { card: "summary_large_image", title, description },
};

export default async function HomePage() {
  const latestPosts = await fetchPublishedPosts(3);
  return <HomeContent latestPosts={latestPosts} />;
}
