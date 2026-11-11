import ResourcesPage from "@/design-lab/resources-v5/ResourcesPage";
import { labGate, labMetadata } from "@/design-lab/gate";

export const metadata = labMetadata("Resources v5");

export default function Page() {
  labGate();
  return <ResourcesPage lang="en" liveArticleLinks />;
}
