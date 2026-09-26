"use client";

import { useLang } from "@/lib/LanguageContext";
import { chromeCopy } from "@/lib/chromeCopy";

interface MenuToggleProps {
  open: boolean;
  onToggle: () => void;
  /** id of the panel this button controls (aria-controls). */
  controls: string;
  /** Tailwind class that hides the button once the desktop navigation is shown. */
  hideFrom: string;
}

export default function MenuToggle({ open, onToggle, controls, hideFrom }: MenuToggleProps) {
  const { lang } = useLang();
  const c = chromeCopy[lang];
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex h-11 w-11 items-center justify-center rounded-inner border border-line-strong text-ink-2 transition-colors hover:border-ink-3 hover:bg-surface-2 ${hideFrom}`}
      aria-label={open ? c.closeMenu : c.openMenu}
      aria-expanded={open}
      aria-controls={controls}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        {open ? <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" /> : <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />}
      </svg>
    </button>
  );
}
