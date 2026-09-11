/**
 * JSON-LD builders - centralized so every page constructs the same
 * Organization identity and absolute-URL shape consistently, and so no
 * page invents a schema property that isn't backed by real, visible page
 * content (see each function's own restrictions).
 */
import { BRAND, BRAND_ASSETS } from "@/lib/branding";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://zentexai.com";

function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}

/** Site-wide identity - rendered once, in the root layout only. */
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: BRAND.name,
    url: SITE_URL,
    logo: absoluteUrl(BRAND_ASSETS.logoPrimary),
  };
}

/** Site-wide search-engine identity - rendered once, alongside Organization. No SearchAction: this site has no working site search to point one at. */
export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: BRAND.name,
    url: SITE_URL,
  };
}

export interface BreadcrumbItem {
  name: string;
  path: string; // relative, e.g. "/services"
}

/** One per page, only for pages genuinely nested under Home (2+ levels) - a bare top-level page doesn't need one. */
export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

/**
 * The real PMP Mastery Program product page only. Deliberately omits
 * price/offers/rating/instructor-credential properties the task's rules
 * exclude - only name/description/url/provider, which the page's own
 * visible content actually supports.
 */
export function courseJsonLd(params: { name: string; description: string; path: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: params.name,
    description: params.description,
    url: absoluteUrl(params.path),
    provider: {
      "@type": "Organization",
      name: BRAND.name,
      url: SITE_URL,
    },
  };
}

/** One real, published website_posts article. */
export function articleJsonLd(params: { headline: string; description: string; path: string; datePublished: string; inLanguage: "en" | "ar" }) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: params.headline,
    description: params.description,
    url: absoluteUrl(params.path),
    datePublished: params.datePublished,
    inLanguage: params.inLanguage,
    author: { "@type": "Organization", name: BRAND.name },
    publisher: {
      "@type": "Organization",
      name: BRAND.name,
      logo: { "@type": "ImageObject", url: absoluteUrl(BRAND_ASSETS.logoPrimary) },
    },
  };
}

/** One real service category on the Services page - name/description only, matching what the page visibly says. */
export function serviceJsonLd(params: { name: string; description: string; path: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: params.name,
    description: params.description,
    url: absoluteUrl(params.path),
    provider: { "@type": "Organization", name: BRAND.name, url: SITE_URL },
  };
}
