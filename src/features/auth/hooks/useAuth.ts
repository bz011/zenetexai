/**
 * Re-exports the AuthContext hook.
 *
 * Kept as a separate module so existing imports of
 * `@/features/auth/hooks/useAuth` keep working unchanged; the actual
 * session/profile fetching lives in `../context/AuthContext` and is shared
 * across the whole app via <AuthProvider>, not re-fetched per component.
 */

export { useAuth, AuthProvider } from "../context/AuthContext";
export type { Profile, UserRole, UserStatus } from "../context/AuthContext";
