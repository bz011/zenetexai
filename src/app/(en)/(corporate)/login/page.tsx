import type { Metadata } from "next";
import LoginContent from "./LoginContent";

export const metadata: Metadata = { title: "Login — ZENTEXAI", robots: { index: false, follow: false } };

export default function LoginPage() {
  return <LoginContent />;
}
