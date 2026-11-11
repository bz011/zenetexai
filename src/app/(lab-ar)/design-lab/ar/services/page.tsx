import ServicesPage from "@/design-lab/services-v5/ServicesPage";
import { labGate, labMetadata } from "@/design-lab/gate";

export const metadata = labMetadata("Services v5 (العربية)");

export default function Page() {
  labGate();
  return <ServicesPage lang="ar" />;
}
