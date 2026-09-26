"use client";

import { usePathname } from "next/navigation";
import AcademyHeader from "@/components/academy/AcademyHeader";
import AcademyFooter from "@/components/academy/AcademyFooter";
import SkipLink from "@/components/nav/SkipLink";

// The one deliberate exception within the Academy shell: the active Mock
// Exam runner (/pmp/mock-exam/<attemptId>, not /history, not /results) gets
// NO Academy header/footer at all - a bare "Exam Shell" - so the CBT
// experience stays completely distraction-free. This is the single
// centralized check for that exception (not scattered per-page
// conditionals); every other Academy route always gets the full shell.
const BARE_EXAM_RUNNER_ROUTE = /^\/pmp\/mock-exam\/(?!history$)[^/]+$/;

export default function AcademyShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isBareExamRunner = BARE_EXAM_RUNNER_ROUTE.test(pathname ?? "");

  if (isBareExamRunner) {
    return <>{children}</>;
  }

  return (
    <div className="academy-shell flex min-h-screen flex-col bg-surface-0">
      <SkipLink />
      <AcademyHeader />
      <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">{children}</main>
      <AcademyFooter />
    </div>
  );
}
