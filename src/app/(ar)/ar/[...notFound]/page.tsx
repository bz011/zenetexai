import { notFound } from "next/navigation";

/**
 * Any /ar/... URL with no real Arabic page lands here and renders the Arabic
 * 404 (src/app/(ar)/not-found.tsx) with a real 404 status - including the
 * middleware's rewrite for anonymous visitors (see lib/auth/routeAccess.ts).
 */
export default function ArabicCatchAllNotFound() {
  notFound();
}
