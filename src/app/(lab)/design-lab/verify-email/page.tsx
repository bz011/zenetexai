import { VerifyEmailScreen } from "@/design-lab/auth-v5/AuthScreens";
import { labGate, labMetadata } from "@/design-lab/gate";

export const metadata = labMetadata("Verify email v5");

type SearchParams = { [key: string]: string | string[] | undefined };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default function Page({ searchParams }: { searchParams: SearchParams }) {
  labGate();
  return <VerifyEmailScreen lang="en" params={{ state: one(searchParams.state), preview: one(searchParams.preview), email: one(searchParams.email) }} />;
}
