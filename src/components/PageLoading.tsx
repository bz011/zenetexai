/**
 * Shared route-level loading fallback (Next.js loading.tsx convention —
 * automatically wraps the sibling page.tsx in a Suspense boundary, so this
 * renders immediately while the page's server-side data fetching runs,
 * instead of a blank screen).
 */
export default function PageLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500/20 border-t-indigo-500" />
    </div>
  );
}
