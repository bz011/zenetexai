import BlogIndex from "@/design-lab/blog-v5/BlogIndex";
import { labGate, labMetadata } from "@/design-lab/gate";

export const metadata = labMetadata("Blog v5 (العربية)");

export default function Page() {
  labGate();
  return <BlogIndex lang="ar" blogBase="/design-lab/ar/blog" />;
}
