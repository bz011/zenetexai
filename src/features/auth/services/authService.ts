/**
 * Authentication Service
 *
 * Handles:
 * - Signup (create auth user + create profile)
 * - Login
 * - Logout
 * - Password reset
 * - Session management
 */

import { supabase } from "@/lib/supabase/client";
import { type User } from "@supabase/supabase-js";

export interface SignupInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface SignupResponse {
  success: boolean;
  user?: User;
  error?: string;
}

export interface LoginResponse {
  success: boolean;
  user?: User;
  error?: string;
}

/**
 * Sign up a new user
 * Creates auth user in Supabase Auth
 * Trigger will create profile in public.users table
 */
export async function signUp(input: SignupInput): Promise<SignupResponse> {
  try {
    // Validate input
    if (!input.email || !input.password || !input.firstName || !input.lastName) {
      return {
        success: false,
        error: "Missing required fields",
      };
    }

    // Sign up user
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          first_name: input.firstName,
          last_name: input.lastName,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/dashboard`,
      },
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      user: data.user!,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: (err as Error).message,
    };
  }
}

/**
 * Log in existing user
 */
export async function login(input: LoginInput): Promise<LoginResponse> {
  try {
    if (!input.email || !input.password) {
      return {
        success: false,
        error: "Email and password required",
      };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      user: data.user!,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: (err as Error).message,
    };
  }
}

/**
 * Log out current user
 */
export async function logout(): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: (err as Error).message,
    };
  }
}

/**
 * Get current session
 */
export async function getSession() {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      throw error;
    }

    return session;
  } catch (err: unknown) {
    console.error("Error getting session:", err);
    return null;
  }
}

/**
 * Get current user
 */
export async function getCurrentUser() {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      throw error;
    }

    return user;
  } catch (err: unknown) {
    console.error("Error getting user:", err);
    return null;
  }
}

/**
 * Send password reset email
 */
export async function resetPassword(
  email: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!email) {
      return {
        success: false,
        error: "Email required",
      };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/reset-password`,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: (err as Error).message,
    };
  }
}

/**
 * Set a new password for the current session.
 * Used on /reset-password after the recovery link has established a
 * session via /auth/callback.
 */
export async function updatePassword(
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: (err as Error).message,
    };
  }
}

/**
 * Resend the signup confirmation email.
 * Used on /verify-email if the original email didn't arrive.
 */
export async function resendVerificationEmail(
  email: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!email) {
      return {
        success: false,
        error: "Email required",
      };
    }

    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/dashboard`,
      },
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: (err as Error).message,
    };
  }
}
