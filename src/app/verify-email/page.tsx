import type { Metadata } from "next";
import VerifyEmailContent from "./VerifyEmailContent";

export const metadata: Metadata = { title: "Verify Your Email — ZENTEXAI" };

export default function VerifyEmailPage() {
  return <VerifyEmailContent />;
}
