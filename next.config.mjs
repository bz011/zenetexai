/**
 * CSP built from the app's actual, code-verified external dependencies
 * (checked directly against the source, not assumed) - see the go-live
 * security sprint report for the full inventory:
 *  - connect-src: Supabase (auth + REST) is called directly from the
 *    browser client (src/lib/supabase/client.ts) - no other client-side
 *    network target exists (Ziina is only ever called server-side, from
 *    "use server" checkoutService.ts / ziinaClient.ts; the browser only
 *    performs a plain top-level `window.location.href` navigation to
 *    Ziina's hosted checkout - see BuyNowButton.tsx - which CSP's fetch
 *    directives do not govern, so Ziina needs no connect-src/frame-src
 *    entry at all).
 *  - frame-src: lesson videos embed via <iframe> for all three supported
 *    video_provider values (VideoEmbed.tsx / bunnyVideo.ts) - Bunny
 *    (iframe.mediadelivery.net, the currently-seeded curriculum's
 *    provider), plus youtube/youtube-nocookie and vimeo, which the same
 *    component and the lesson-editing admin UI actively support even
 *    though today's curriculum doesn't use them - omitting them would
 *    silently break that existing admin feature the moment it's used.
 *  - No Google font/analytics origin is needed: the app uses
 *    next/font/google (src/lib/fonts.ts), which self-hosts the font files
 *    at build time - confirmed no runtime request to fonts.googleapis.com
 *    or fonts.gstatic.com exists.
 *  - No remote <img>/next/image origin is configured or used (no
 *    images.remotePatterns in this file, no Supabase Storage image usage
 *    found in the app) - img-src stays 'self' + data:.
 */
const SUPABASE_ORIGIN = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin;
  } catch {
    return "";
  }
})();

const VIDEO_FRAME_ORIGINS = [
  "https://iframe.mediadelivery.net",
  "https://www.youtube.com",
  "https://www.youtube-nocookie.com",
  "https://player.vimeo.com",
];

const CSP_DIRECTIVES = [
  "default-src 'self'",
  // 'unsafe-inline' is required for both, not added speculatively:
  //   script-src - Next.js App Router injects inline <script> tags at
  //     runtime to stream Server Component payloads to the client
  //     (`self.__next_f.push(...)`) on every page; there is no next/script
  //     usage or other custom inline script in this app to remove instead.
  //     Adopting nonce-based CSP to drop this would require threading a
  //     per-request nonce through middleware and the root layout - a
  //     structural change out of scope for this header-only sprint.
  //   style-src - several components use React inline `style={{...}}`
  //     (11 files, confirmed by grep), which renders as an inline `style`
  //     HTML attribute and is governed by style-src the same as a <style>
  //     tag. No 'unsafe-eval' is included in either - a production Next.js
  //     build does not require it.
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  `connect-src 'self'${SUPABASE_ORIGIN ? ` ${SUPABASE_ORIGIN}` : ""}`,
  "media-src 'self'",
  `frame-src ${VIDEO_FRAME_ORIGINS.join(" ")}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(process.env.NODE_ENV === "production" ? ["upgrade-insecure-requests"] : []),
].join("; ");

/**
 * Security headers applied to every route. HSTS is intentionally
 * production-only: applying it under `next dev` (plain http://localhost)
 * would have the browser cache a forced-HTTPS policy for localhost,
 * breaking local development beyond just this app.
 */
async function securityHeaders() {
  const headers = [
    { key: "Content-Security-Policy", value: CSP_DIRECTIVES },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" }, // legacy fallback, consistent with frame-ancestors 'none' above - not a looser policy
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    // Only the sensitive device/browser features this app has no use for
    // are explicitly denied - the video iframes' own `allow` attributes
    // (VideoEmbed.tsx: accelerometer, autoplay, encrypted-media, gyroscope,
    // picture-in-picture, fullscreen, clipboard-write) are left at the
    // browser default rather than enumerated here, so playback/fullscreen
    // for Bunny/YouTube/Vimeo is never at risk of being blocked by this header.
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" }, // safe: no OAuth-popup or window.open() flow exists in this app
    { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  ];
  if (process.env.NODE_ENV === "production") {
    headers.push({ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" });
  }
  return headers;
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      // Retired in Sprint 7.6's brand repositioning - "Tools" is no longer
      // a standalone nav item; AI Solutions on /services covers the same
      // ground (AI agents, automation, custom applications).
      { source: "/tools", destination: "/services", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: await securityHeaders(),
      },
    ];
  },
};

export default nextConfig;
