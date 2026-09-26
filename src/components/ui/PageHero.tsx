import type { ReactNode } from "react";

interface PageHeroProps {
  eyebrow: string;
  title: ReactNode;
  sub?: ReactNode;
  /** Buttons / links. */
  actions?: ReactNode;
}

/**
 * Hero for every content page: start-aligned copy (logical, so it flips in RTL),
 * no decorative glow, no entrance animation - the text is on screen at first
 * paint so the headline is the LCP element. Pages that have a product visual
 * (homepage, Academy) compose their own hero; this is the plain, honest one.
 */
export default function PageHero({ eyebrow, title, sub, actions }: PageHeroProps) {
  return (
    <section className="border-b border-line">
      <div className="container-page pb-12 pt-10 md:pb-16 md:pt-16">
        <p className="label">{eyebrow}</p>
        <h1 className="mt-4 max-w-3xl text-h1 text-ink">{title}</h1>
        {sub && <p className="mt-5 max-w-2xl text-lead text-ink-2">{sub}</p>}
        {actions && <div className="mt-8 flex flex-wrap gap-3">{actions}</div>}
      </div>
    </section>
  );
}
