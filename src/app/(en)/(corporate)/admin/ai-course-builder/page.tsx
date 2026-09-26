import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/requireRole";
import AICourseBuilderContent from "./AICourseBuilderContent";

export const metadata: Metadata = { title: "Admin — AI Course Builder" };
export const maxDuration = 60;

export default async function AICourseBuilderPage() {
  await requireAdmin({ loginRedirectTo: "/admin/ai-course-builder" });

  return <AICourseBuilderContent />;
}
