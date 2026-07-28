import HomeContent from "./HomeContent";
import { fetchPublishedPosts } from "@/lib/posts";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const latestPosts = await fetchPublishedPosts(3);
  return <HomeContent latestPosts={latestPosts} />;
}
