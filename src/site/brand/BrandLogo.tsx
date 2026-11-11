import Image from "next/image";
import ribbonLogo from "../../../public/images/branding/zentexai-ribbon-logo-nav.png";
import ribbonLogoLight from "../../../public/images/branding/zentexai-ribbon-logo-nav-light.png";

/**
 * The one ZentexAI logo implementation: the approved Ribbon Z lockup.
 *
 *  - "light" surfaces (ivory header, pages): the official artwork as is.
 *  - "dark" surfaces (navy footer): the same artwork with the navy ZENTEX
 *    wordmark set in ivory and the teal "AI" lightened for contrast; the Z
 *    mark itself is untouched. Generated from the official file, so
 *    geometry and proportions are identical.
 *
 * Both files share one aspect ratio (1788 × 324), so `height` alone fixes the
 * size everywhere. The header's intro animation layers this same artwork
 * (see SiteHeader); nothing else draws a logo.
 */
export const LOGO_ASSET = { light: ribbonLogo, dark: ribbonLogoLight } as const;

export default function BrandLogo({
  surface = "light",
  height,
  className,
  priority = false,
  decorative = false,
}: {
  surface?: "light" | "dark";
  height: number;
  className?: string;
  priority?: boolean;
  /** True when a surrounding link already names the destination. */
  decorative?: boolean;
}) {
  const src = LOGO_ASSET[surface];
  return (
    <Image
      src={src}
      alt={decorative ? "" : "ZentexAI"}
      aria-hidden={decorative || undefined}
      className={className}
      style={{ height, width: "auto" }}
      sizes={`${Math.ceil((height * src.width) / src.height)}px`}
      quality={90}
      priority={priority}
    />
  );
}
