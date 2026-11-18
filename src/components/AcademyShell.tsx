"use client";

import { usePathname } from "next/navigation";
import SkipLink from "@/components/nav/SkipLink";
import SiteChrome from "@/site/SiteChrome";
import AcademySubnav from "@/site/academy/AcademySubnav";
import type { AcademyNavState } from "@/features/commerce/services/navAccessService";

// The one deliberate exception within the Academy shell: the active Mock
// Exam runner (/pmp/mock-exam/<attemptId>, not /history, not /results) gets
// NO header/footer at all - a bare "Exam Shell" - so the CBT experience stays
// completely distraction-free. This is the single centralized check for that
// exception (not scattered per-page conditionals); every other Academy route
// always gets the full frame.
const BARE_EXAM_RUNNER_ROUTE = /^\/pmp\/mock-exam\/(?!history$)[^/]+$/;

/**
 * Academy pages use the one site header and footer (SiteChrome), with the
 * Academy's own navigation (Overview, Courses, Practice, Mock Exam and the
 * account actions) directly under the header. <main> keeps `.academy-shell`
 * for the Academy palette, compatibility layer and sticky offsets.
 */
export default function AcademyShell({ children, initialNav }: { children: React.ReactNode; initialNav: AcademyNavState }) {
  const pathname = usePathname();
  const isBareExamRunner = BARE_EXAM_RUNNER_ROUTE.test(pathname ?? "");

  if (isBareExamRunner) {
    return <>{children}</>;
  }

  return (
    <>
      <SkipLink />
      <SiteChrome section="academy" subnav={<AcademySubnav initial={initialNav} />}>
        {children}
      </SiteChrome>
    </>
  );
}
