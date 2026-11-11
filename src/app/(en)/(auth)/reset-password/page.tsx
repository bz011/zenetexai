import type { Metadata } from "next";
import { ResetPasswordLive } from "@/site/auth/AuthLive";

export const metadata: Metadata = { title: "Set New Password — ZENTEXAI", robots: { index: false, follow: false } };

export default function ResetPasswordPage() {
  return <ResetPasswordLive />;
}
