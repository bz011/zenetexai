import type { Metadata } from "next";
import HomeContent from "@/app/(en)/(corporate)/HomeContent";
import { arabicMetadata } from "@/lib/arabicSeo";

export const metadata: Metadata = arabicMetadata("/");

// The latest-posts block is intentionally omitted: blog articles are
// English-only, so showing them here would put English content on an
// Arabic page.
export default function ArabicHomePage() {
  return <HomeContent latestPosts={[]} />;
}
