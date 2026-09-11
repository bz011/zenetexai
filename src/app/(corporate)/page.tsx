import type { Metadata } from "next";
import HomeContent from "./HomeContent";
import { fetchPublishedPosts } from "@/lib/posts";

export const dynamic = "force-dynamic";

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
