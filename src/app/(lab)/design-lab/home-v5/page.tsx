import HomeV5 from "@/design-lab/home-v5/HomeV5";
import { labGate, labMetadata } from "@/design-lab/gate";

export const metadata = labMetadata("Homepage v5");

export default function Page() {
  labGate();
  return <HomeV5 lang="en" />;
}
