import type { Metadata } from "next";
import { LoginLive } from "@/site/auth/AuthLive";

export const metadata: Metadata = { title: "Login — ZENTEXAI", robots: { index: false, follow: false } };

export default function LoginPage() {
  return <LoginLive />;
}
