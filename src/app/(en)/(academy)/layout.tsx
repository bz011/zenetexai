import type { ReactNode } from "react";
import AcademyShell from "@/components/AcademyShell";
import { getAcademyNavState } from "@/features/commerce/services/navAccessService";

/**
 * Academy Shell - the one site header and footer with the Academy's own
 * navigation. Works for both authenticated and unauthenticated visitors.
 *
 * The visitor's session and Simulator access are resolved HERE, on the
 * server, so the Academy navigation is rendered correctly in the first HTML
 * (audit F3: it used to show the signed-out state, then change once the
 * browser had loaded the session). Reading the session makes Academy pages
 * render per request; all of them already did except /academy.
 */
export default async function AcademyLayout({ children }: { children: ReactNode }) {
  const initialNav = await getAcademyNavState();
  return <AcademyShell initialNav={initialNav}>{children}</AcademyShell>;
}
