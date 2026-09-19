import type { Metadata } from "next";
import ForgotPasswordContent from "./ForgotPasswordContent";

export const metadata: Metadata = { title: "Reset Password — ZENTEXAI", robots: { index: false, follow: false } };

export default function ForgotPasswordPage() {
  return <ForgotPasswordContent />;
}
