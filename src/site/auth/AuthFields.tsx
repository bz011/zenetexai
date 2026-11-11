"use client";

import { useState, type ReactNode } from "react";
import type { AuthStrings } from "./authCopy";
import styles from "./auth.module.css";

/**
 * Field primitives of the approved auth design (labels, inputs, the
 * show/hide password control, the submit button). Presentation only: the
 * live flows in AuthLive.tsx own all state, validation and service calls.
 */

export function Field({
  id,
  label,
  error,
  hint,
  aside,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={styles.field}>
      <div className={styles.labelRow}>
        <label htmlFor={id} className={styles.label}>{label}</label>
        {aside}
      </div>
      {children}
      {error ? (
        <p id={`${id}-error`} className={styles.fieldError}>{error}</p>
      ) : hint ? (
        <p id={`${id}-hint`} className={styles.hint}>{hint}</p>
      ) : null}
    </div>
  );
}

const describedBy = (id: string, error?: string, hint?: string) => (error ? `${id}-error` : hint ? `${id}-hint` : undefined);

export function TextInput({
  id,
  name,
  value,
  onChange,
  error,
  hint,
  ltr,
  ...rest
}: {
  id: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  hint?: string;
  ltr?: boolean;
  type?: string;
  autoComplete?: string;
  inputMode?: "email" | "text";
  placeholder?: string;
}) {
  return (
    <input
      id={id}
      name={name}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy(id, error, hint)}
      dir={ltr ? "ltr" : undefined}
      className={`${styles.input} ${ltr ? styles.ltrInput : ""}`}
      type={rest.type ?? "text"}
      {...rest}
    />
  );
}

export function PasswordInput({
  id,
  name,
  value,
  onChange,
  error,
  hint,
  autoComplete,
  s,
}: {
  id: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  hint?: string;
  autoComplete: "current-password" | "new-password";
  s: AuthStrings;
}) {
  const [shown, setShown] = useState(false);
  return (
    <div className={styles.passwordWrap}>
      <input
        id={id}
        name={name}
        type={shown ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        spellCheck={false}
        autoCapitalize="none"
        dir="ltr"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={`${styles.input} ${styles.ltrInput} ${styles.passwordInput}`}
      />
      <button
        type="button"
        className={styles.reveal}
        onClick={() => setShown((v) => !v)}
        aria-label={shown ? s.ui.hide : s.ui.show}
        aria-pressed={shown}
        aria-controls={id}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12z" />
          <circle cx="12" cy="12" r="2.8" />
          {shown && <path d="M4 20L20 4" />}
        </svg>
      </button>
    </div>
  );
}

export function Submit({ sending, label, sendingLabel }: { sending: boolean; label: string; sendingLabel: string }) {
  return (
    <button type="submit" className={styles.submit} disabled={sending}>
      {sending && <span className={styles.spinner} aria-hidden="true" />}
      <span>{sending ? sendingLabel : label}</span>
    </button>
  );
}
