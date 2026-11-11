import { ForgotPasswordScreen } from "@/design-lab/auth-v5/AuthScreens";
import { labGate, labMetadata } from "@/design-lab/gate";

export const metadata = labMetadata("Forgot password v5 (العربية)");

type SearchParams = { [key: string]: string | string[] | undefined };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default function Page({ searchParams }: { searchParams: SearchParams }) {
  labGate();
  return <ForgotPasswordScreen lang="ar" params={{ state: one(searchParams.state), preview: one(searchParams.preview), email: one(searchParams.email) }} />;
}
