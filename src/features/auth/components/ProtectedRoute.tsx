/**
 * Protected Route Wrapper
 *
 * Wraps components/pages that require authentication.
 * Redirects to /login if user is not authenticated.
 *
 * Usage (in app router):
 * import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute'
 *
 * export default function MyPage() {
 *   return (
 *     <ProtectedRoute>
 *       <MyContent />
 *     </ProtectedRoute>
 *   )
 * }
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "student" | "instructor" | "admin";
}

export function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {
  const router = useRouter();
  const { user, profile, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      // Not authenticated
      if (!user) {
        router.push("/login");
        return;
      }

      // Role check (if specified)
      if (requiredRole && profile?.role !== requiredRole) {
        router.push("/");
        return;
      }
    }
  }, [user, profile, isLoading, requiredRole, router]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500/20 border-t-indigo-500 mx-auto mb-4" />
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect handled above
  if (!user) {
    return null;
  }

  // Role mismatch - redirect handled above
  if (requiredRole && profile?.role !== requiredRole) {
    return null;
  }

  // User is authenticated and has correct role
  return <>{children}</>;
}
