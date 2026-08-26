import type { Metadata } from "next";
import ResetPasswordContent from "./ResetPasswordContent";

export const metadata: Metadata = { title: "Set New Password — ZENTEXAI" };

export default function ResetPasswordPage() {
  return <ResetPasswordContent />;
}
