import { describe, it, expect } from "vitest";
import {
  ARABIC_EQUIVALENT_PATHS,
  alternatesFor,
  hasArabicVersion,
  isArabicPath,
  localizeHref,
  pathForLang,
  resolveRouteLocale,
  toArabicPath,
  toEnglishPath,
} from "./i18nRoutes";

describe("i18nRoutes", () => {
  it("maps English paths to /ar and back, including the homepage", () => {
    expect(toArabicPath("/")).toBe("/ar");
    expect(toArabicPath("/academy")).toBe("/ar/academy");
    expect(toArabicPath("/services/machine-learning-uae")).toBe("/ar/services/machine-learning-uae");
    expect(toEnglishPath("/ar")).toBe("/");
    expect(toEnglishPath("/ar/academy")).toBe("/ar/academy".slice(3));
    expect(toEnglishPath("/academy")).toBe("/academy");
  });

  it("recognises Arabic URLs without confusing look-alike English paths", () => {
    expect(isArabicPath("/ar")).toBe(true);
    expect(isArabicPath("/ar/academy")).toBe(true);
    expect(isArabicPath("/arabic-course")).toBe(false);
    expect(isArabicPath("/about")).toBe(false);
  });

  it("round-trips every Arabic-equivalent path", () => {
    for (const p of ARABIC_EQUIVALENT_PATHS) {
      expect(toEnglishPath(toArabicPath(p))).toBe(p);
      expect(hasArabicVersion(p)).toBe(true);
    }
  });

  it("only treats mirrored pages as language-fixed by URL", () => {
    expect(resolveRouteLocale("/ar/academy")).toEqual({ mirrored: true, locale: "ar", enPath: "/academy" });
    expect(resolveRouteLocale("/academy")).toEqual({ mirrored: true, locale: "en", enPath: "/academy" });
    expect(resolveRouteLocale("/ar")).toEqual({ mirrored: true, locale: "ar", enPath: "/" });
    // Pages with no Arabic version keep the legacy client-side toggle behaviour.
    expect(resolveRouteLocale("/about").mirrored).toBe(false);
    expect(resolveRouteLocale("/pmp/mock-exam/abc").mirrored).toBe(false);
    expect(resolveRouteLocale("/courses/pmp-mastery-program").mirrored).toBe(false);
    expect(resolveRouteLocale("/ar/about").mirrored).toBe(false);
  });

  it("switches to the corresponding URL only where a translated equivalent exists", () => {
    expect(pathForLang("/academy", "ar")).toBe("/ar/academy");
    expect(pathForLang("/academy", "en")).toBe("/academy");
    expect(pathForLang("/about", "ar")).toBe("/about");
  });

  it("localizes internal links for Arabic readers, preserving hash/query, and leaves everything else alone", () => {
    expect(localizeHref("/services", "ar")).toBe("/ar/services");
    expect(localizeHref("/services/power-bi-consulting-uae#deliverables", "ar")).toBe("/ar/services/power-bi-consulting-uae#deliverables");
    expect(localizeHref("/courses?x=1", "ar")).toBe("/ar/courses?x=1");
    expect(localizeHref("/contact", "ar")).toBe("/contact");
    expect(localizeHref("/blog/some-post", "ar")).toBe("/blog/some-post");
    expect(localizeHref("#programs", "ar")).toBe("#programs");
    expect(localizeHref("https://example.com/services", "ar")).toBe("https://example.com/services");
    expect(localizeHref("/services", "en")).toBe("/services");
  });

  it("emits self-referencing canonicals with a reciprocal en/ar/x-default set", () => {
    const en = alternatesFor("/academy", "en");
    const ar = alternatesFor("/academy", "ar");
    expect(en.canonical).toBe("/academy");
    expect(ar.canonical).toBe("/ar/academy");
    expect(en.languages).toEqual(ar.languages);
    expect(en.languages).toEqual({ en: "/academy", ar: "/ar/academy", "x-default": "/academy" });
  });
});
