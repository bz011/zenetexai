import type { Metadata } from "next";
import ForgotPasswordContent from "./ForgotPasswordContent";

export const metadata: Metadata = { title: "Reset Password — ZENTEXAI" };

export default function ForgotPasswordPage() {
  return <ForgotPasswordContent />;
}
