import type { Metadata } from "next";
import { VerifyEmailLive } from "@/site/auth/AuthLive";

export const metadata: Metadata = { title: "Verify Your Email — ZENTEXAI", robots: { index: false, follow: false } };

export default function VerifyEmailPage() {
  return <VerifyEmailLive />;
}
