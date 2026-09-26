import type { Metadata } from "next";
import CoursesPageBody from "@/app/(en)/(academy)/courses/CoursesPageBody";
import { arabicMetadata } from "@/lib/arabicSeo";

export const metadata: Metadata = arabicMetadata("/courses");
export const dynamic = "force-dynamic";

export default function ArabicCoursesPage() {
  return <CoursesPageBody lang="ar" />;
}
