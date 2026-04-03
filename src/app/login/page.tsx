import type { Metadata } from "next";
import LoginContent from "./LoginContent";

export const metadata: Metadata = { title: "Login — ZENETEXAI" };

export default function LoginPage() {
  return <LoginContent />;
}
