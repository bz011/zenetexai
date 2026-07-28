import Image from "next/image";
import { BRAND, BRAND_ASSETS, HAS_LOGO_ASSETS } from "@/lib/branding";

interface LogoProps {
  /** primary: square/stacked mark for tight spaces. horizontal: wordmark + icon side by side (nav/footer). icon: mark alone (compact/mobile). */
  variant?: "primary" | "horizontal" | "icon";
  className?: string;
}

/**
 * Single source of truth for rendering the ZentexAI mark anywhere in the
 * app. Today this always renders the text wordmark (no approved asset
 * files exist yet) - once HAS_LOGO_ASSETS is flipped on in branding.ts,
 * every call site here starts rendering the real image automatically.
 */
export default function Logo({ variant = "horizontal", className = "" }: LogoProps) {
  if (HAS_LOGO_ASSETS) {
    const src = variant === "icon" ? BRAND_ASSETS.icon : variant === "primary" ? BRAND_ASSETS.logoPrimary : BRAND_ASSETS.logoHorizontal;
    return <Image src={src} alt={BRAND.name} width={variant === "icon" ? 32 : 140} height={32} className={className} priority />;
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
