import { notFound } from "next/navigation";
import ProgramPreview from "@/design-lab/academy-v5/ProgramPreview";
import { academyCopy } from "@/design-lab/academy-v5/academyCopy";
import { labGate, labMetadata } from "@/design-lab/gate";

export const metadata = labMetadata("Academy program preview");

// Design-lab only: where the Academy program buttons land in the local preview.
export default function Page({ params }: { params: { id: string } }) {
  labGate();
  const program = academyCopy.en.programs.find((p) => p.id === params.id);
  if (!program) notFound();
  return <ProgramPreview lang="en" program={program} />;
}
