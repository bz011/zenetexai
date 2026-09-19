import type { Metadata } from "next";
import SignupContent from "./SignupContent";

export const metadata: Metadata = { title: "Create Account — ZENTEXAI", robots: { index: false, follow: false } };

export default function SignupPage() {
  return <SignupContent />;
}
