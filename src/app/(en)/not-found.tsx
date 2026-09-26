import Link from "next/link";
import Logo from "@/components/brand/Logo";

/**
 * Root not-found boundary - catches any URL that matches no route at all
 * (and is where the middleware's 404 rewrite for anonymous visitors lands).
 * Rendered inside the root layout only (route-group layouts like
 * (corporate)'s Header/Footer don't apply to an unmatched path), so this
 * stays deliberately self-contained rather than assuming that chrome exists.
 */
export default function NotFound() {
  return (
    <main id="main-content" className="flex min-h-screen flex-col items-center justify-center px-6 py-24 text-center">
      <Link href="/" className="mb-10 inline-flex" aria-label="ZentexAI home">
        <Logo variant="primary" />
      </Link>

      <p className="label">404</p>
      <h1 className="mt-3 text-h1 text-ink">Page not found</h1>
      <p className="mx-auto mt-4 max-w-md text-body text-ink-2">
        The page you&apos;re looking for doesn&apos;t exist or may have moved. Try one of these instead.
      </p>

      <div className="mt-9 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn-primary">
          Go to homepage
        </Link>
        <Link href="/services" className="btn-secondary">
          AI solutions
        </Link>
        <Link href="/academy" className="btn-secondary">
          PMP Academy
        </Link>
      </div>
    </main>
  );
}
