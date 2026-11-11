import AcademyPage from "@/design-lab/academy-v5/AcademyPage";
import { labGate, labMetadata } from "@/design-lab/gate";

export const metadata = labMetadata("Academy v5 (العربية)");

export default function Page() {
  labGate();
  return <AcademyPage lang="ar" previewLinks />;
}
