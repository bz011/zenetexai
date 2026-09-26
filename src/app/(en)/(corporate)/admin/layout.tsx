import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * Applies noindex to every /admin route that doesn't already set its own
 * metadata (all of them, as of this writing - only the top-level /admin
 * page previously had its own explicit robots block). These are internal,
 * authenticated-admin-only tools with zero public SEO value and no reason
 * to ever appear in search results. This is defense in depth alongside the
 * existing requireAdmin()/requireRole() auth check and robots.txt's
 * /admin disallow rule - metadata-level noindex means even a crawler that
 * somehow reached a URL here (e.g. via a followed link before the auth
 * redirect fires) is told directly not to index it, rather than relying on
 * robots.txt alone. Purely a metadata addition - renders children as-is,
 * no visual or structural change to any admin page.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
