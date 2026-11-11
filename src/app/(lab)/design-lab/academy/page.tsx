import AcademyPage from "@/design-lab/academy-v5/AcademyPage";
import { labGate, labMetadata } from "@/design-lab/gate";

export const metadata = labMetadata("Academy v5");

export default function Page() {
  labGate();
  return <AcademyPage lang="en" previewLinks />;
}
