import type { Metadata } from "next";
import { BRAND } from "@/lib/branding";
import { alternatesFor, toArabicPath } from "@/lib/i18nRoutes";

/**
 * The social-share image. The file lives at src/app/opengraph-image.png and Next
 * serves it at /opengraph-image.png.
 *
 * WHY THIS EXISTS: Next.js file-based OG images attach only to the segment that
 * owns the file (the root). Any page that sets its own `openGraph` object then
 * REPLACES the root's openGraph wholesale - dropping the image and site name -
 * which is why every real page shipped without og:image / twitter:image while
 * only the 404 page (which sets no openGraph) had one. Every page therefore
 * builds its metadata through pageMetadata() below, so the image, site name and
 * locale are always present and there is one place to change them.
 */
export const OG_IMAGE = {
  url: "/opengraph-image.png",
  width: 1200,
  height: 630,
  alt: `${BRAND.name} - Intelligence. Execution. Impact.`,
} as const;

interface PageMetadataInput {
  title: string;
  description: string;
  /** Canonical path of THIS page (for an Arabic page, the /ar path). */
  path: string;
  /** English path when the page exists in both languages; enables reciprocal hreflang. */
  mirroredEnPath?: string;
  lang?: "en" | "ar";
  type?: "website" | "article";
  /** ISO date; only meaningful for type "article". */
  publishedTime?: string;
}

/** Complete, consistent page metadata: title/description, canonical (+hreflang), Open Graph and Twitter with image. */
export function pageMetadata({ title, description, path, mirroredEnPath, lang = "en", type = "website", publishedTime }: PageMetadataInput): Metadata {
  const alternates = mirroredEnPath ? alternatesFor(mirroredEnPath, lang) : { canonical: path };
  return {
    title,
    description,
    alternates,
    openGraph: {
      title,
      description,
      url: path,
      siteName: BRAND.name,
      type,
      ...(type === "article" && publishedTime ? { publishedTime } : {}),
      locale: lang === "ar" ? "ar_AE" : "en_US",
      images: [OG_IMAGE],
    },
    twitter: { card: "summary_large_image", title, description, images: [OG_IMAGE.url] },
  };
}

/** Metadata for a page that exists in both languages, given its English path. */
export function mirroredPageMetadata(enPath: string, lang: "en" | "ar", title: string, description: string): Metadata {
  return pageMetadata({ title, description, path: lang === "ar" ? toArabicPath(enPath) : enPath, mirroredEnPath: enPath, lang });
}
