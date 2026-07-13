/**
 * Auth form validation schemas.
 *
 * Zod issue messages are short codes (not user-facing strings) so the UI
 * can look them up in translations.ts and render them in the active
 * language. See lib/auth/authErrors.ts for mapping Supabase's own error
 * strings (which are always English) the same way.
 */

import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .min(1, "required")
  .email("invalid_email");

export const passwordSchema = z
  .string()
  .min(8, "password_too_short")
  .regex(/[A-Z]/, "password_needs_uppercase")
  .regex(/[0-9]/, "password_needs_number");

export const signupSchema = z
  .object({
    firstName: z.string().trim().min(1, "required"),
    lastName: z.string().trim().min(1, "required"),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "passwords_dont_match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "required"),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "passwords_dont_match",
    path: ["confirmPassword"],
  });

export type SignupFormValues = z.infer<typeof signupSchema>;
export type LoginFormValues = z.infer<typeof loginSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

/**
 * Flattens a failed safeParse result into { field: firstErrorCode }.
 */
export function fieldErrorsFrom(
  result: z.SafeParseReturnType<unknown, unknown>
): Record<string, string> {
  if (result.success) return {};
  const flattened = result.error.flatten().fieldErrors as Record<
    string,
    string[] | undefined
  >;
  const errors: Record<string, string> = {};
  for (const key of Object.keys(flattened)) {
    const first = flattened[key]?.[0];
    if (first) errors[key] = first;
  }
  return errors;
}
