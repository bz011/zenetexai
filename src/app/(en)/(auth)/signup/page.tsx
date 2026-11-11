import type { Metadata } from "next";
import { SignupLive } from "@/site/auth/AuthLive";

export const metadata: Metadata = { title: "Create Account — ZENTEXAI", robots: { index: false, follow: false } };

export default function SignupPage() {
  return <SignupLive />;
}
