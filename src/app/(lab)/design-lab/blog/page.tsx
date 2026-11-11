import BlogIndex from "@/design-lab/blog-v5/BlogIndex";
import { labGate, labMetadata } from "@/design-lab/gate";

export const metadata = labMetadata("Blog v5");

export default function Page() {
  labGate();
  return <BlogIndex lang="en" blogBase="/design-lab/blog" />;
}
