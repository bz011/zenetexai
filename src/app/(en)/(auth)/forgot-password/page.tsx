import type { Metadata } from "next";
import { ForgotPasswordLive } from "@/site/auth/AuthLive";

export const metadata: Metadata = { title: "Reset Password — ZENTEXAI", robots: { index: false, follow: false } };

export default function ForgotPasswordPage() {
  return <ForgotPasswordLive />;
}
