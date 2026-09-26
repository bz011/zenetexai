import type { ReactNode } from "react";

interface SectionHeaderProps {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "start" | "center";
  /** Heading level. Pages have exactly one h1 (the hero); sections use h2. */
  as?: "h1" | "h2";
  id?: string;
  className?: string;
}

/**
 * eyebrow -> heading -> description. Replaces the hand-copied block that
 * previously appeared ~70 times with slightly different sizes and alignment.
 * Alignment is logical (start/center), so it flips correctly in RTL.
 */
export default function SectionHeader({ eyebrow, title, description, align = "start", as: Tag = "h2", id, className = "" }: SectionHeaderProps) {
  const center = align === "center";
  return (
    <div className={`${center ? "mx-auto text-center" : ""} mb-10 max-w-2xl md:mb-14 ${className}`}>
      {eyebrow && <p className="label">{eyebrow}</p>}
      <Tag id={id} className={`${eyebrow ? "mt-3" : ""} text-h2 text-ink`}>
        {title}
      </Tag>
      {description && <p className="mt-4 text-body text-ink-2">{description}</p>}
    </div>
  );
}
