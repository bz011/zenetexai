import { manrope } from "@/lib/fonts";
import LogoIcon from "@/components/brand/LogoIcon";

interface LogoProps {
  /** primary: icon + wordmark + tagline (footer, hero, large placements). horizontal: icon + wordmark only, no tagline (navbar/compact). icon: mark alone. */
  variant?: "primary" | "horizontal" | "icon";
  className?: string;
}

const WHITE = "#FFFFFF";
const BLUE = "#2563EB";
const TEAL = "#06B6D4";
const ICON_SCALE_STYLE = { transform: "scale(1.05)", transformOrigin: "center" } as const;

function Wordmark({ sizeClassName }: { sizeClassName: string }) {
  return (
    <span className={`${sizeClassName} ${manrope.className} font-extrabold tracking-tight`}>
      <span style={{ color: WHITE }}>Zentex</span>
      <span style={{ color: BLUE }}>AI</span>
    </span>
  );
}

/**
 * Single source of truth for rendering the ZentexAI mark anywhere in the
 * app. Renders as inline SVG (icon) + real text (wordmark/tagline, using
 * next/font's self-hosted Manrope) rather than a flat raster image - this
 * is what makes the arrow's shimmer animation possible (a raster PNG can't
 * animate just one internal element) and keeps the wordmark crisp/
 * accessible at any DPI. Colors are fixed to this site's dark theme (no
 * light-mode toggle exists) - see public/brand/ for light-background
 * exports of the same mark, kept in sync as static brand-kit files.
 *
 * Icon is rendered at 1.05x (5% larger than its natural alongside-text
 * proportion) per explicit design feedback - transform-origin center so
 * it grows in place without shifting alignment.
 */
export default function Logo({ variant = "horizontal", className = "" }: LogoProps) {
  if (variant === "icon") {
    return (
      <LogoIcon
        inkColor={WHITE}
        gradientId="zentex-icon"
        className={`h-8 w-auto ${className}`}
        style={ICON_SCALE_STYLE}
      />
    );
  }

  if (variant === "primary") {
    return (
      <span className={`inline-flex flex-col ${className}`}>
        <span className="inline-flex items-center gap-3">
          <LogoIcon
            inkColor={WHITE}
            gradientId="zentex-primary"
            className="h-10 w-auto shrink-0 md:h-12"
            style={ICON_SCALE_STYLE}
          />
          <Wordmark sizeClassName="text-2xl md:text-3xl" />
        </span>
        <span className={`ms-[52px] mt-1 text-xs md:ms-[60px] md:text-sm ${manrope.className} font-semibold`}>
          <span style={{ color: "#F8FAFC" }}>Intelligence. </span>
          <span style={{ color: BLUE }}>Execution. </span>
          <span style={{ color: TEAL }}>Impact.</span>
        </span>
      </span>
    );
  }

  // horizontal (default): navbar/compact - icon + wordmark, no tagline.
  // Outer height (h-9/md:h-10) is unchanged from before - the enlargement
  // and extra spacing happen inside this fixed footprint, not by growing
  // the navbar itself.
  return (
    <span className={`inline-flex h-9 items-center gap-3 md:h-10 ${className}`}>
      <LogoIcon
        inkColor={WHITE}
        gradientId="zentex-horizontal"
        className="h-full w-auto shrink-0"
        style={ICON_SCALE_STYLE}
      />
      <Wordmark sizeClassName="text-[19px] md:text-[21px]" />
    </span>
  );
}
