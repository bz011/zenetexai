import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

// getSession() is the only Supabase call middleware makes; stub it to "no
// session" so tests exercise the same anonymous-visitor path already
// covered by routeAccess.test.ts, without needing real Supabase credentials.
vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: { getSession: async () => ({ data: { session: null } }) },
  }),
}));

const { middleware } = await import("../src/middleware");

function requestFor(pathname: string): NextRequest {
  return new NextRequest(new URL(pathname, "https://zentexai.com"));
}

describe("middleware - removed blog posts (Master Audit Wave 0-B/final pass)", () => {
  it.each([
    "/blog/transforming-learning-how-ai-is-enhancing-education-in-mena-businesses",
    "/blog/transforming-learning-how-ai-is-enhancing-employee-development-in-mena-businesses",
  ])("returns 410 Gone for %s, before any Supabase/session check", async (pathname) => {
    const response = await middleware(requestFor(pathname));
    expect(response.status).toBe(410);
  });

  it("does not 410 a real, unrelated blog post", async () => {
    const response = await middleware(requestFor("/blog/ai-agents-for-business-uae"));
    expect(response.status).not.toBe(410);
  });

  it("does not 410 the blog index itself", async () => {
    const response = await middleware(requestFor("/blog"));
    expect(response.status).not.toBe(410);
  });
});
