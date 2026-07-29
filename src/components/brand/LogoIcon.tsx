import type { CSSProperties } from "react";

const BLUE = "#2563EB";
const TEAL = "#06B6D4";

// Exact approved geometry (Sprint 7.6.3) - a 512x512 open ring (two gaps:
// upper-right where the arrow exits, lower-left for balance) + two Z bars
// + one diagonal stroke that IS the rising arrow, ending past the ring in
// a large arrowhead. Unchanged here - only display size/animation added.
const RING_ARC_1 = "M 444.01,220.79 A 197,197 0 0 1 166.74,433.54";
const RING_ARC_2 = "M 59.71,305.99 A 197,197 0 0 1 317.38,69.88";
const TOP_BAR = "M 168,172 L 300,172";
const BOTTOM_BAR = "M 168,343 L 315,343";
const SHAFT = "M 168,343 L 300,172 L 456,55";
const ARROWHEAD = "470.00,35.00 429.73,128.46 370.12,54.49";

interface LogoIconProps {
  /** ring + Z bar color - navy for light backgrounds, white for dark (this site). */
  inkColor: string;
  /** false for logo-black.svg-style strict monochrome (no gradient, arrow matches inkColor). */
  gradient?: boolean;
  gradientId: string;
  className?: string;
  style?: CSSProperties;
  /** Disables the shimmer - used for the tiny favicon-scale "icon" variant where detail already collapses. */
  animated?: boolean;
}

export default function LogoIcon({ inkColor, gradient = true, gradientId, className = "", style, animated = true }: LogoIconProps) {
  const arrowPaint = gradient ? `url(#${gradientId})` : inkColor;
  const maskId = `${gradientId}-arrowMask`;

  return (
    <svg viewBox="0 0 512 512" className={className} style={style} aria-hidden="true">
      {gradient && (
        <linearGradient id={gradientId} x1="20%" y1="80%" x2="85%" y2="15%">
          <stop offset="0%" stopColor={BLUE} />
          <stop offset="100%" stopColor={TEAL} />
        </linearGradient>
      )}

      <path d={RING_ARC_1} fill="none" stroke={inkColor} strokeWidth="32" strokeLinecap="round" />
      <path d={RING_ARC_2} fill="none" stroke={inkColor} strokeWidth="32" strokeLinecap="round" />
      <path d={TOP_BAR} fill="none" stroke={inkColor} strokeWidth="40" strokeLinecap="round" />
      <path d={BOTTOM_BAR} fill="none" stroke={inkColor} strokeWidth="40" strokeLinecap="round" />
      <path d={SHAFT} fill="none" stroke={arrowPaint} strokeWidth="36" strokeLinecap="round" strokeLinejoin="round" />
      <polygon points={ARROWHEAD} fill={arrowPaint} />

      {/* Subtle shimmer, masked to the arrow's exact silhouette so only the
          arrow ever appears to move - ring/Z remain fully static. Opt-in via
          the `no-preference` media query so prefers-reduced-motion users
          never receive the animation at all (see globals.css). */}
      {animated && gradient && (
        <>
          <mask id={maskId}>
            <rect width="512" height="512" fill="black" />
            <path d={SHAFT} fill="none" stroke="white" strokeWidth="36" strokeLinecap="round" strokeLinejoin="round" />
            <polygon points={ARROWHEAD} fill="white" />
          </mask>
          <g mask={`url(#${maskId})`}>
            <rect className="zentex-logo-shimmer" x="-160" y="0" width="130" height="512" fill={`url(#${gradientId}-shimmerGrad)`} />
          </g>
          <linearGradient id={`${gradientId}-shimmerGrad`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
        </>
      )}
    </svg>
  );
}
