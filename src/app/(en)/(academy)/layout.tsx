import type { ReactNode } from "react";
import AcademyShell from "@/components/AcademyShell";

/** Academy Shell - light, dedicated learning-platform environment, distinct from the Corporate Shell. Works for both authenticated and unauthenticated visitors. */
export default function AcademyLayout({ children }: { children: ReactNode }) {
  return <AcademyShell>{children}</AcademyShell>;
}
