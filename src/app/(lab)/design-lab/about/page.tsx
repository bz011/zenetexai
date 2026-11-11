import AboutPage from "@/design-lab/about-v5/AboutPage";
import { labGate, labMetadata } from "@/design-lab/gate";

export const metadata = labMetadata("About v5");

export default function Page() {
  labGate();
  return <AboutPage lang="en" />;
}
