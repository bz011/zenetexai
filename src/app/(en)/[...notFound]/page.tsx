import { notFound } from "next/navigation";

/**
 * With separate root layouts for English and Arabic (see (ar)/layout.tsx),
 * there is no app-root layout for Next's root not-found boundary to render
 * inside. This catch-all sends any unmatched URL to (en)/not-found.tsx so
 * unknown paths still get the branded 404 with a real 404 status.
 */
export default function CatchAllNotFound() {
  notFound();
}
