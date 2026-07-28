/**
 * Next.js Middleware - Route Protection & Session Management
 *
 * Convention: DEFAULT-DENY. Every route requires a logged-in user UNLESS
 * it's explicitly listed in PUBLIC_ROUTES/PUBLIC_PREFIXES below.
 *
 * This is the inverse of a "protected routes" list on purpose: forgetting
 * to list a new authenticated page (e.g. /dashboard/settings, /admin/users)
 * fails closed — it's simply protected automatically. Forgetting to list a
 * new public marketing page fails loudly and safely too — visitors get
 * bounced to /login, which is an obvious, immediately-visible bug during
 * testing. The old model (a manual PROTECTED_PREFIXES allow-list) failed
 * open: a forgotten entry silently exposed a page with no auth at all,
 * which is the worse failure mode and much harder to notice.
 *
 * Role/authorization checks (e.g. "is this user an admin") are NOT done
 * here — that requires a DB round trip and is handled per-page via
 * lib/auth/requireRole.ts, which is also the single source of truth for
 * that logic. This middleware only answers "is anyone logged in".
 *
 * Session check: this uses getSession() (local JWT verification from the
 * cookie, no network call) rather than getUser() (revalidates against
 * Supabase Auth over the network on every request). That network round
 * trip on every single navigation was a measured performance bottleneck.
 * This is safe here specifically because middleware is only a routing
 * gate, not the authorization boundary — every protected page/action
 * still calls requireUser/requireRole/requireApiRole (lib/auth/requireRole.ts),
 * which call the real, server-revalidated getUser() before trusting
 * identity for any data access or mutation. A forged/expired JWT fails
 * signature verification here too; the only thing getSession() doesn't
 * catch that getUser() would is a token revoked mid-lifetime, and that
 * gap is closed by the authoritative getUser() call at the page level.
 */

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

const PUBLIC_ROUTES = new Set<string>([
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/about",
  "/services",
  "/academy",
  "/tools",
  "/contact",
  "/enroll",
]);

// Prefixes for public routes that have dynamic sub-paths, or that must
// remain reachable without a session by definition (the auth callback is
// what *creates* the session; API routes authorize themselves internally).
const PUBLIC_PREFIXES = ["/blog", "/auth", "/api"];

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.has(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Local JWT verification from the cookie - no network round trip.
  // See file header comment for why this is safe here.
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user && !isPublicRoute(request.nextUrl.pathname)) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
