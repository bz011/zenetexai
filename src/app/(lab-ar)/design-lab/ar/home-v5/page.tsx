import HomeV5 from "@/design-lab/home-v5/HomeV5";
import { labGate, labMetadata } from "@/design-lab/gate";

export const metadata = labMetadata("Homepage v5 (العربية)");

export default function Page() {
  labGate();
  return <HomeV5 lang="ar" />;
}
