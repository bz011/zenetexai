import { describe, it, expect } from "vitest";
import { resolveBunnyEmbedUrl } from "./bunnyVideo";

describe("resolveBunnyEmbedUrl", () => {
  it("returns null for empty/null/undefined input", () => {
    expect(resolveBunnyEmbedUrl(null, "12345")).toBeNull();
    expect(resolveBunnyEmbedUrl(undefined, "12345")).toBeNull();
    expect(resolveBunnyEmbedUrl("", "12345")).toBeNull();
    expect(resolveBunnyEmbedUrl("   ", "12345")).toBeNull();
  });

  it("uses a full http(s) URL as-is, ignoring library ID entirely", () => {
    const full = "https://iframe.mediadelivery.net/embed/98765/abc-123-guid";
    expect(resolveBunnyEmbedUrl(full, undefined)).toBe(full);
    expect(resolveBunnyEmbedUrl(full, "12345")).toBe(full);
  });

  it("constructs the standard embed URL from a bare GUID + library ID", () => {
    expect(resolveBunnyEmbedUrl("abc-123-guid", "12345")).toBe(
      "https://iframe.mediadelivery.net/embed/12345/abc-123-guid"
    );
  });

  it("returns null for a bare GUID when no library ID is configured (never a broken iframe)", () => {
    expect(resolveBunnyEmbedUrl("abc-123-guid", undefined)).toBeNull();
  });

  it("trims whitespace before checking/using the value", () => {
    expect(resolveBunnyEmbedUrl("  abc-123-guid  ", "12345")).toBe(
      "https://iframe.mediadelivery.net/embed/12345/abc-123-guid"
    );
  });
});
