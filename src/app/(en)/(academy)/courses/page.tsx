import type { Metadata } from "next";
import { Suspense } from "react";
import PageLoading from "@/components/PageLoading";
import { mirroredPageMetadata } from "@/lib/seo";
import CoursesPageBody from "./CoursesPageBody";

const title = "PMP Exam Simulator & Courses (Arabic & English) | ZentexAI";
const description =
  "ZentexAI Academy's PMP Exam Simulator (محاكي PMP) and PMP Mastery Program: Arabic and English practice questions, timed mock exams and filterable Practice Mode.";

export const metadata: Metadata = mirroredPageMetadata("/courses", "en", title, description);
export const dynamic = "force-dynamic";

// The storefront keeps its loading state as a LOCAL Suspense boundary. A
// loading.tsx here would also wrap /courses/[courseSlug] (the product page),
// stream its shell with status 200 and turn a missing product into a soft 404.
export default function CoursesPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <CoursesPageBody lang="en" />
    </Suspense>
  );
}
