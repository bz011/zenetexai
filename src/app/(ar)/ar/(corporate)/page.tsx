import type { Metadata } from "next";
import HomeV5 from "@/site/home/HomeV5";
import { arabicMetadata } from "@/lib/arabicSeo";

export const metadata: Metadata = arabicMetadata("/");

// The latest-posts block is intentionally omitted: blog articles are
// English-only, so showing them here would put English content on an
// Arabic page.
export default function ArabicHomePage() {
  return <HomeV5 lang="ar" />;
}
