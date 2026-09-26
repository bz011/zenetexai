import type { ReactNode } from "react";

interface SectionProps {
  children: ReactNode;
  /** Use the tighter of the two section rhythms. */
  tight?: boolean;
  /** Hairline above the section (use to separate stacked sections instead of alternating backgrounds). */
  bordered?: boolean;
  /** Slightly raised background band. Use sparingly - hairlines usually separate sections better. */
  raised?: boolean;
  id?: string;
  className?: string;
  "aria-labelledby"?: string;
}

/**
 * The one page-section wrapper: applies the site's two spacing levels and the
 * shared content container so no page hand-rolls `py-* px-*` combinations.
 */
export default function Section({ children, tight = false, bordered = false, raised = false, id, className = "", ...aria }: SectionProps) {
  const classes = [
    tight ? "section-tight" : "section",
    bordered ? "border-t border-line" : "",
    raised ? "bg-surface-1/50" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <section id={id} className={classes} {...aria}>
      <div className="container-page">{children}</div>
    </section>
  );
}
