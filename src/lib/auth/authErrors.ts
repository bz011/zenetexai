/**
 * Maps Supabase Auth's raw (always-English) error messages to a translated,
 * user-facing string. Falls back to the raw message for anything
 * unrecognized rather than hiding it.
 */

import type { Translations } from "@/lib/translations";

export function mapAuthError(rawMessage: string | undefined, t: Translations): string {
  if (!rawMessage) return t.auth.errors.generic;
  const msg = rawMessage.toLowerCase();

  if (msg.includes("invalid login credentials")) return t.auth.errors.invalid_credentials;
  if (msg.includes("email not confirmed")) return t.auth.errors.email_not_confirmed;
  if (msg.includes("already registered") || msg.includes("already exists")) {
    return t.auth.errors.email_taken;
  }
  if (msg.includes("password") && (msg.includes("least") || msg.includes("weak"))) {
    return t.auth.errors.weak_password;
  }
  if (msg.includes("rate limit") || msg.includes("too many")) return t.auth.errors.rate_limited;
  if (msg.includes("user not found")) return t.auth.errors.user_not_found;

  return rawMessage;
}

/** Maps a zod issue code (from authValidators.ts) to a translated string. */
export function mapValidationError(code: string | undefined, t: Translations): string | undefined {
  if (!code) return undefined;
  return t.auth.validation[code as keyof Translations["auth"]["validation"]] ?? code;
}
