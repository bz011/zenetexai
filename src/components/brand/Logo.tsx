import BrandLogo from "@/site/brand/BrandLogo";

interface LogoProps {
  /** primary: larger placements (404 pages, hero). horizontal: navbar/compact. icon: kept for API compatibility (no current call sites); renders the compact lockup. */
  variant?: "primary" | "horizontal" | "icon";
  /** dark (default): for dark surfaces (ivory wordmark). light: for light surfaces (navy wordmark). */
  tone?: "dark" | "light";
  className?: string;
}

/**
 * Legacy entry point for the ZentexAI mark, kept so existing call sites (the
 * Academy header and footer, 404 pages) need no changes. It now renders the
 * approved Ribbon Z lockup through BrandLogo, the one logo implementation
 * shared with the site header and footer - the earlier icon + Manrope
 * wordmark + tagline mark is retired. Sizes keep each placement's previous
 * footprint (navbar h-9/md:h-10).
 */
export default function Logo({ variant = "horizontal", tone = "dark", className = "" }: LogoProps) {
  const surface = tone === "light" ? "light" : "dark";
  const height = variant === "primary" ? 40 : 30;
  return (
    <span dir="ltr" className={`inline-flex items-center ${className}`}>
      <BrandLogo surface={surface} height={height} />
    </span>
  );
}
