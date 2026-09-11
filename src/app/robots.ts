import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://zentexai.com";

/**
 * Served natively by Next.js at /robots.txt from this file. Disallows only
 * genuinely private/authenticated/transactional paths - never used as a
 * substitute for real authentication (every path below is already gated
 * server-side; this just keeps crawlers from wasting budget on pages they
 * could never usefully index anyway). CSS/JS/images/fonts and every public
 * marketing/academy/tool/course-landing page remain fully crawlable.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/admin",
        "/admin/",
        "/dashboard",
        "/certificate",
        "/checkout/",
        "/login",
        "/signup",
        "/forgot-password",
        "/reset-password",
        "/verify-email",
        "/courses/*/lessons/",
        "/courses/*/assessments/",
        "/pmp/practice",
        "/pmp/practice/",
        "/pmp/mock-exam",
        "/pmp/mock-exam/",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
