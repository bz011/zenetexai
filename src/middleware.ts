/**
 * Next.js Middleware - Route Protection & Session Management
 *
 * Convention: DEFAULT-DENY. Route classification (public / private / unknown)
 * lives in src/lib/auth/routeAccess.ts so it is unit-tested and scanned
 * against the real app router in CI:
 *   - public  -> served to everyone
 *   - private -> anonymous visitors are redirected to /login (destination kept)
 *   - unknown -> anonymous visitors get a real 404; they never reach a page
 *
 * Role/authorization checks (e.g. "is this user an admin") are NOT done here -
 * that requires a DB round trip and is handled per-page via
 * lib/auth/requireRole.ts, the single source of truth for that logic. This
 * middleware only answers "is anyone logged in".
 *
 * Session check: uses getSession() (local JWT verification from the cookie, no
 * network call) rather than getUser() (revalidates against Supabase Auth on
 * every request), which was a measured bottleneck. Safe here because
 * middleware is only a routing gate, not the authorization boundary - every
 * protected page/action still calls requireUser/requireRole/requireApiRole,
 * which call the real, server-revalidated getUser() before trusting identity.
 */

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { classifyRoute, notFoundRewriteFor } from "@/lib/auth/routeAccess";

// Permanently removed content (Master Audit Wave 0-B/final pass, 2026-09-30):
// two blog posts containing unsupported fabricated case studies/statistics.
// 410, not 404 - this tells crawlers the removal is deliberate and permanent
// (Google de-indexes a 410 faster than an ambiguous 404), and there is no
// redirect target since neither post has a genuine replacement. Checked
// before anything else in this file - cheapest possible reject, and applies
// regardless of session state (this is public content either way).
//
// Deliberately NOT imported from src/lib/posts.ts's own REMOVED_SLUGS
// (the single source of truth for every other exclusion - blog index, Home,
// Resources, sitemap, the [slug] page itself): that module imports
// src/lib/db.ts, which imports "pg" at module scope. Middleware runs on
// Vercel's Edge Runtime, not Node.js, and "pg" depends on raw TCP/Node
// built-ins Edge doesn't provide. A local `next build` bundled it without
// erroring, but that doesn't prove it executes safely in the real Edge
// sandbox - and middleware's matcher covers nearly every route on the site,
// so a bad import here risks breaking the entire site, not just these two
// URLs. Duplicating the two slugs as plain strings here is a small, safe
// trade against that risk. If these two slugs are ever entirely deleted
// from website_posts, both this list and REMOVED_SLUGS should be cleaned up
// together.
const REMOVED_BLOG_PATHS = new Set([
  "/blog/transforming-learning-how-ai-is-enhancing-education-in-mena-businesses",
  "/blog/transforming-learning-how-ai-is-enhancing-employee-development-in-mena-businesses",
]);

export async function middleware(request: NextRequest) {
  if (REMOVED_BLOG_PATHS.has(request.nextUrl.pathname)) {
    return new NextResponse("Gone", { status: 410 });
  }

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

  if (!session?.user) {
    const access = classifyRoute(request.nextUrl.pathname);

    if (access === "private") {
      const redirectUrl = new URL("/login", request.url);
      // Preserve the query string, not just the path - a redirect target can
      // carry state a plain pathname can't (e.g. /checkout/success?purchase_id=...).
      redirectUrl.searchParams.set("redirectTo", request.nextUrl.pathname + request.nextUrl.search);
      return NextResponse.redirect(redirectUrl);
    }

    if (access === "unknown") {
      // Nothing lives here for anyone: answer with a real 404 (a rewrite to
      // the catch-all not-found page, URL preserved) instead of bouncing to
      // /login, which made mistyped and crawled URLs look like a login wall.
      // Still default-deny: an anonymous request never reaches a page route.
      return NextResponse.rewrite(new URL(notFoundRewriteFor(request.nextUrl.pathname), request.url), { status: 404 });
    }
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
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|glb)$).*)",
  ],
};
