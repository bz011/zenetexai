import Image from "next/image";
import { BRAND, BRAND_ASSETS, HAS_LOGO_ASSETS } from "@/lib/branding";

interface LogoProps {
  /** primary: icon + wordmark + tagline (footer, hero, large placements). horizontal: icon + wordmark only, no tagline (navbar/compact). icon: mark alone (smallest spaces). */
  variant?: "primary" | "horizontal" | "icon";
  className?: string;
}

// Intrinsic pixel dimensions of each rendered asset - used as the aspect
// ratio reference for next/image (actual display size is controlled by the
// height utility in `className`; width scales automatically via w-auto).
const DIMENSIONS = {
  primary: { width: 800, height: 210, src: BRAND_ASSETS.logoPrimary },
  horizontal: { width: 760, height: 170, src: BRAND_ASSETS.logoHorizontal },
  icon: { width: 512, height: 512, src: BRAND_ASSETS.icon },
} as const;

/**
 * Single source of truth for rendering the ZentexAI mark anywhere in the
 * app. Renders the approved logo assets (see branding.ts). The text
 * wordmark fallback below only activates if HAS_LOGO_ASSETS is ever
 * flipped back off (e.g. assets temporarily missing) - no call site needs
 * to change either way.
 */
export default function Logo({ variant = "horizontal", className = "" }: LogoProps) {
  if (HAS_LOGO_ASSETS) {
    const { width, height, src } = DIMENSIONS[variant];
    return (
      <Image
        src={src}
        alt={BRAND.name}
        width={width}
        height={height}
        className={`h-9 w-auto md:h-10 ${className}`}
        style={{ overflow: "visible" }}
        priority
      />
    );
  }

  if (variant === "icon") {
    return (
      <span
        className={`inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-[14px] font-bold text-white ${className}`}
        aria-label={BRAND.name}
      >
        Z
      </span>
    );
  }

  return (
    <span className={`text-[15px] font-bold tracking-tight text-white ${className}`}>
      {BRAND.shortName.toUpperCase()}
      <span className="text-indigo-400">AI</span>
    </span>
  );
}
