import { notFound } from "next/navigation";
import type { Metadata } from "next";

/**
 * Design-lab prototypes exist for local comparison only. Every build
 * (`next build`, Vercel Preview and Production) runs with NODE_ENV
 * "production": there each lab page resolves to a 404 at build time, so no
 * prototype is ever served. Middleware also keeps /design-lab "unknown"
 * outside `next dev` (src/lib/auth/routeAccess.ts).
 */
export function labGate(): void {
  if (process.env.NODE_ENV === "production") notFound();
}

export function labMetadata(title: string): Metadata {
  return {
    title: `${title} — ZentexAI design lab`,
    robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  };
}
