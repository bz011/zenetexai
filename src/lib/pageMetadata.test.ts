import { describe, it, expect, vi } from "vitest";
import type { Metadata } from "next";

vi.mock("@/lib/posts", () => ({ fetchPublishedPosts: async () => [] }));
vi.mock("@/lib/supabase/admin", () => ({ supabaseAdmin: {} }));

import { OG_IMAGE, pageMetadata, mirroredPageMetadata } from "./seo";
import { ARABIC_SEO, arabicMetadata } from "./arabicSeo";

/** Every public, indexable English page whose metadata is static. */
const EN_PAGES: [string, () => Promise<{ metadata: Metadata }>][] = [
  ["/", () => import("@/app/(en)/(corporate)/page")],
  ["/services", () => import("@/app/(en)/(corporate)/services/page")],
  ["/services/ai-agents-automation-uae", () => import("@/app/(en)/(corporate)/services/ai-agents-automation-uae/page")],
  ["/services/whatsapp-automation-uae", () => import("@/app/(en)/(corporate)/services/whatsapp-automation-uae/page")],
  ["/services/machine-learning-uae", () => import("@/app/(en)/(corporate)/services/machine-learning-uae/page")],
  ["/services/data-analytics-uae", () => import("@/app/(en)/(corporate)/services/data-analytics-uae/page")],
  ["/services/power-bi-consulting-uae", () => import("@/app/(en)/(corporate)/services/power-bi-consulting-uae/page")],
  ["/academy", () => import("@/app/(en)/(academy)/academy/page")],
  ["/courses", () => import("@/app/(en)/(academy)/courses/page")],
  ["/about", () => import("@/app/(en)/(corporate)/about/page")],
  ["/contact", () => import("@/app/(en)/(corporate)/contact/page")],
];

describe("shared page metadata builder", () => {
  it("always includes the share image, site name and locale (a page-level openGraph would otherwise drop the root image)", () => {
    const m = pageMetadata({ title: "T", description: "D", path: "/x" });
    expect(m.openGraph?.images).toEqual([OG_IMAGE]);
    expect(m.openGraph?.siteName).toBe("ZentexAI");
    expect(m.twitter?.images).toEqual([OG_IMAGE.url]);
    expect(m.alternates).toEqual({ canonical: "/x" });
  });

  it("adds reciprocal hreflang for pages that exist in both languages", () => {
    const en = mirroredPageMetadata("/academy", "en", "T", "D");
    const ar = mirroredPageMetadata("/academy", "ar", "T", "D");
    expect((en.alternates as { canonical: string }).canonical).toBe("/academy");
    expect((ar.alternates as { canonical: string }).canonical).toBe("/ar/academy");
    expect((en.alternates as { languages: object }).languages).toEqual((ar.alternates as { languages: object }).languages);
    expect(ar.openGraph).toMatchObject({ locale: "ar_AE", url: "/ar/academy" });
  });
});

describe("every public English page ships complete, reasonably sized metadata", () => {
  for (const [path, load] of EN_PAGES) {
    it(path, async () => {
      const { metadata } = await load();
      expect(metadata.openGraph?.images, "og:image").toEqual([OG_IMAGE]);
      expect(metadata.twitter?.images, "twitter:image").toEqual([OG_IMAGE.url]);
      expect(metadata.openGraph?.siteName).toBe("ZentexAI");
      expect((metadata.alternates as { canonical: string }).canonical).toBe(path);
      expect(String(metadata.title).length, "title").toBeLessThanOrEqual(62);
      expect(String(metadata.description).length, "description").toBeLessThanOrEqual(165);
    });
  }
});

describe("every Arabic page ships complete metadata", () => {
  for (const enPath of Object.keys(ARABIC_SEO)) {
    it(`/ar${enPath === "/" ? "" : enPath}`, () => {
      const m = arabicMetadata(enPath);
      expect(m.openGraph?.images, "og:image").toEqual([OG_IMAGE]);
      expect(m.twitter?.images, "twitter:image").toEqual([OG_IMAGE.url]);
      expect(m.openGraph).toMatchObject({ locale: "ar_AE" });
      expect(String(m.title).length, "title").toBeLessThanOrEqual(80);
      expect(String(m.description).length, "description").toBeLessThanOrEqual(190);
    });
  }
});
