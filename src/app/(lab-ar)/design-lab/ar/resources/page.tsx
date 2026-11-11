import ResourcesPage from "@/design-lab/resources-v5/ResourcesPage";
import { labGate, labMetadata } from "@/design-lab/gate";

export const metadata = labMetadata("Resources v5 (العربية)");

export default function Page() {
  labGate();
  return <ResourcesPage lang="ar" liveArticleLinks />;
}
