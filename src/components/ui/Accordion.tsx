import type { ReactNode } from "react";

export interface AccordionItem {
  id: string;
  question: ReactNode;
  answer: ReactNode;
}

/**
 * Native <details>/<summary> accordion: keyboard and screen-reader accessible
 * by default, works without JavaScript, and keeps every answer in the DOM so
 * crawlers and AI retrieval read the full text (this is why it is preferred
 * over a client-state accordion or a dependency for FAQ content).
 * Server-component safe. The chevron is CSS-only and flips in RTL.
 */
export default function Accordion({ items, className = "" }: { items: AccordionItem[]; className?: string }) {
  return (
    <div className={`divide-y divide-line rounded-card border border-line bg-surface-1 ${className}`}>
      {items.map((item) => (
        <details key={item.id} className="group">
          <summary className="flex min-h-[3rem] cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-body font-semibold text-ink [&::-webkit-details-marker]:hidden">
            <span>{item.question}</span>
            <svg
              aria-hidden="true"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className="shrink-0 text-ink-3 transition-transform duration-150 group-open:rotate-180"
            >
              <path d="M3 6l5 5 5-5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </summary>
          <div className="px-5 pb-5 text-body text-ink-2">{item.answer}</div>
        </details>
      ))}
    </div>
  );
}
