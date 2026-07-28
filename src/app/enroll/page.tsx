import type { Metadata } from "next";
import EnrollContent from "./EnrollContent";

export const metadata: Metadata = { title: "Enroll — ZENTEXAI Academy" };

export default function EnrollPage() {
  return <EnrollContent />;
}
