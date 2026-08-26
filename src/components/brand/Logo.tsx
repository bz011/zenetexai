import { manrope } from "@/lib/fonts";
import LogoIcon from "@/components/brand/LogoIcon";

interface LogoProps {
  /** primary: icon + wordmark + tagline (footer, hero, large placements). horizontal: icon + wordmark only, no tagline (navbar/compact). icon: mark alone. */
  variant?: "primary" | "horizontal" | "icon";
  /** dark (default): white ink, for this site's dark surfaces. light: navy ink, for white/light surfaces (Academy shell) - same geometry/typography/accent colors, just the ink swap LogoIcon's inkColor prop was always built to support (see its own doc comment). Not a redesign. */
  tone?: "dark" | "light";
  className?: string;
}

const WHITE = "#FFFFFF";
const NAVY = "#0F172A";
const BLUE = "#2563EB";
const TEAL = "#06B6D4";
const ICON_SCALE_STYLE = { transform: "scale(1.05)", transformOrigin: "center" } as const;

function Wordmark({ sizeClassName, ink }: { sizeClassName: string; ink: string }) {
  return (
    <span className={`${sizeClassName} ${manrope.className} font-extrabold tracking-tight`}>
      <span style={{ color: ink }}>Zentex</span>
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
 * accessible at any DPI. `tone` swaps only the ink color (white for dark
 * surfaces, navy for light ones) - the icon/wordmark geometry, proportions,
 * and blue/teal accent colors are identical either way. See public/brand/
 * for light-background exports of the same mark, kept in sync as static
 * brand-kit files.
 *
 * Icon is rendered at 1.05x (5% larger than its natural alongside-text
 * proportion) per explicit design feedback - transform-origin center so
 * it grows in place without shifting alignment.
 */
export default function Logo({ variant = "horizontal", tone = "dark", className = "" }: LogoProps) {
  const ink = tone === "light" ? NAVY : WHITE;

  if (variant === "icon") {
    return (
      <LogoIcon
        inkColor={ink}
        gradientId={`zentex-icon-${tone}`}
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
            inkColor={ink}
            gradientId={`zentex-primary-${tone}`}
            className="h-10 w-auto shrink-0 md:h-12"
            style={ICON_SCALE_STYLE}
          />
          <Wordmark sizeClassName="text-2xl md:text-3xl" ink={ink} />
        </span>
        <span className={`ms-[52px] mt-1 text-xs md:ms-[60px] md:text-sm ${manrope.className} font-semibold`}>
          <span style={{ color: tone === "light" ? "#334155" : "#F8FAFC" }}>Intelligence. </span>
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
        inkColor={ink}
        gradientId={`zentex-horizontal-${tone}`}
        className="h-full w-auto shrink-0"
        style={ICON_SCALE_STYLE}
      />
      <Wordmark sizeClassName="text-[19px] md:text-[21px]" ink={ink} />
    </span>
  );
}
