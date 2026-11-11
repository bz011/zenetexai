import ContactPage from "@/design-lab/contact-v5/ContactPage";
import { labGate, labMetadata } from "@/design-lab/gate";

export const metadata = labMetadata("Contact v5");

export default function Page() {
  labGate();
  return <ContactPage lang="en" />;
}
