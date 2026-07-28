import Image from "next/image";
import { BRAND, BRAND_ASSETS, HAS_LOGO_ASSETS } from "@/lib/branding";

interface LogoProps {
  /** primary: square/stacked mark for tight spaces. horizontal: wordmark + icon side by side (nav/footer). icon: mark alone (compact/mobile). */
  variant?: "primary" | "horizontal" | "icon";
  className?: string;
}

/**
 * Single source of truth for rendering the ZentexAI mark anywhere in the
 * app. Renders the approved logo assets (see branding.ts). The text
 * wordmark fallback below only activates if HAS_LOGO_ASSETS is ever
 * flipped back off (e.g. assets temporarily missing) - no call site needs
 * to change either way.
 */
export default function Logo({ variant = "horizontal", className = "" }: LogoProps) {
  if (HAS_LOGO_ASSETS) {
    const isSquare = variant === "icon" || variant === "primary";
    const src = isSquare ? BRAND_ASSETS.icon : BRAND_ASSETS.logoHorizontal;
    // Intrinsic sizes match the actual asset aspect ratio (icon 1:1,
    // horizontal 3.5:1) - className below sets the display height and lets
    // width scale automatically, so callers only ever need to pass a
    // height utility (e.g. "h-9") to resize it consistently.
    return (
      <Image
        src={src}
        alt={BRAND.name}
        width={isSquare ? 400 : 1120}
        height={isSquare ? 400 : 320}
        className={`h-8 w-auto ${className}`}
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
