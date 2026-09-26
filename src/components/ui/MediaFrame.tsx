import type { ReactNode } from "react";

interface MediaFrameProps {
  children: ReactNode;
  /** Describes what the frame shows. Rendered as a real <figcaption>. */
  caption?: ReactNode;
  className?: string;
}

/**
 * Frame for REAL product UI or imagery (never a mock-up): hairline border, the
 * system's single radius, and the only drop shadow in the design system.
 */
export default function MediaFrame({ children, caption, className = "" }: MediaFrameProps) {
  return (
    <figure className={className}>
      <div className="media-frame">{children}</div>
      {caption && <figcaption className="mt-3 text-caption text-ink-3">{caption}</figcaption>}
    </figure>
  );
}
