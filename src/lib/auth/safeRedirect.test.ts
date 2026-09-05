import { describe, it, expect } from "vitest";
import { resolveSafeRedirect } from "./safeRedirect";

describe("resolveSafeRedirect", () => {
  it("defaults to /dashboard when given null, undefined, or an empty string", () => {
    expect(resolveSafeRedirect(null)).toBe("/dashboard");
    expect(resolveSafeRedirect(undefined)).toBe("/dashboard");
    expect(resolveSafeRedirect("")).toBe("/dashboard");
  });

  it("passes through an allow-listed pathname with no query string unchanged", () => {
    expect(resolveSafeRedirect("/admin")).toBe("/admin");
    expect(resolveSafeRedirect("/profile")).toBe("/profile");
    expect(resolveSafeRedirect("/reset-password")).toBe("/reset-password");
  });

  it("preserves the dynamic purchase_id query string on the Ziina return routes (the checkout return-flow fix)", () => {
    expect(resolveSafeRedirect("/checkout/success?purchase_id=abc-123")).toBe("/checkout/success?purchase_id=abc-123");
    expect(resolveSafeRedirect("/checkout/cancel?purchase_id=abc-123")).toBe("/checkout/cancel?purchase_id=abc-123");
  });

  it("preserves a hash fragment the same way it preserves a query string", () => {
    expect(resolveSafeRedirect("/dashboard#section")).toBe("/dashboard#section");
  });

  it("falls back to /dashboard for a pathname that isn't on the allow-list, even with a query string attached", () => {
    expect(resolveSafeRedirect("/some-random-page?x=1")).toBe("/dashboard");
  });

  it("never redirects off-site: a foreign-host value is rejected because its pathname never matches the allow-list", () => {
    expect(resolveSafeRedirect("https://evil.com/dashboard")).toBe("/dashboard");
    expect(resolveSafeRedirect("//evil.com/dashboard")).toBe("/dashboard");
  });

  it("still rejects a path-traversal attempt against an allow-listed path (exact-match only, no prefix matching)", () => {
    expect(resolveSafeRedirect("/dashboard/../../evil")).toBe("/dashboard");
    expect(resolveSafeRedirect("/checkout/success/../../admin")).toBe("/dashboard");
  });

  it("a query string appended to an allow-listed path can never change where it points - it only ever rides along on our own path", () => {
    expect(resolveSafeRedirect("/dashboard?next=https://evil.com")).toBe("/dashboard?next=https://evil.com");
  });
});
