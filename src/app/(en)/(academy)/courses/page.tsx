import type { Metadata } from "next";
import CoursesPageBody from "./CoursesPageBody";
import { alternatesFor } from "@/lib/i18nRoutes";

const title = "PMP Exam Simulator & Courses in Arabic and English | ZentexAI";
const description =
  "Browse ZentexAI Academy's PMP Exam Simulator (محاكي PMP) and PMP Mastery Program: Arabic and English practice questions, filterable Practice Mode, and full-length timed mock exams.";

export const metadata: Metadata = {
  title,
  description,
  alternates: alternatesFor("/courses", "en"),
  openGraph: { title, description, url: "/courses", type: "website" },
  twitter: { card: "summary_large_image", title, description },
};
export const dynamic = "force-dynamic";

export default function CoursesPage() {
  return <CoursesPageBody lang="en" />;
}
