import Link from "next/link";
import Logo from "@/components/brand/Logo";

/**
 * Root not-found boundary - catches any URL that matches no route at all.
 * Rendered inside the root layout only (route-group layouts like
 * (corporate)'s Header/Footer don't apply to an unmatched path), so this
 * stays deliberately self-contained rather than assuming that chrome
 * exists.
 */
export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-24 text-center">
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/[0.1] blur-[130px]" />

      <div className="relative">
        <Link href="/" className="mx-auto mb-10 inline-flex">
          <Logo variant="primary" />
        </Link>

        <p className="label">404</p>
        <h1 className="mt-3 text-3xl font-bold text-white md:text-4xl">Page Not Found</h1>
        <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-slate-400">
          The page you're looking for doesn't exist or may have moved. Here are a few places to go instead.
        </p>

        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn-primary px-6 py-3 text-[14px]">
            Go to Homepage
          </Link>
          <Link href="/services" className="btn-secondary px-6 py-3 text-[14px]">
            AI Solutions
          </Link>
          <Link href="/academy" className="btn-secondary px-6 py-3 text-[14px]">
            PMP Academy
          </Link>
        </div>
      </div>
    </div>
  );
}
