import type { Metadata } from "next";
import VerifyEmailContent from "./VerifyEmailContent";

export const metadata: Metadata = { title: "Verify Your Email — ZENTEXAI", robots: { index: false, follow: false } };

export default function VerifyEmailPage() {
  return <VerifyEmailContent />;
}
