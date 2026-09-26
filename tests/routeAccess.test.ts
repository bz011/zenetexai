import { describe, it, expect } from "vitest";
import { allRoutes } from "./helpers/appRoutes";
import { classifyRoute, notFoundRewriteFor, PUBLIC_ROUTES, PRIVATE_PREFIXES } from "../src/lib/auth/routeAccess";

describe("route access classification", () => {
  it("never leaves a real route unclassified (a forgotten entry would silently 404 for anonymous users)", () => {
    const routes = allRoutes();
    expect(routes.length).toBeGreaterThan(30);
    const unclassified = routes.filter((r) => classifyRoute(r) === "unknown");
    expect(unclassified).toEqual([]);
  });

  it("keeps every authenticated application area private", () => {
    for (const p of ["/dashboard", "/certificate", "/pmp/practice", "/pmp/practice/abc/results", "/pmp/mock-exam/xyz", "/admin", "/admin/ai-generation/review/q1"]) {
      expect(classifyRoute(p), p).toBe("private");
    }
    expect(PRIVATE_PREFIXES.length).toBeGreaterThan(0);
  });

  it("keeps public marketing, auth, product and Arabic pages public", () => {
    for (const p of ["/", "/about", "/services", "/services/ai-agents-automation-uae", "/academy", "/contact", "/login", "/signup", "/courses", "/courses/pmp-exam-simulator", "/blog/some-post", "/checkout/success", "/verify/ABC", "/api/assessments/1/submit", "/auth/callback", "/robots.txt", "/sitemap.xml", "/ar", "/ar/academy", "/ar/services", "/ar/courses/pmp-exam-simulator"]) {
      expect(classifyRoute(p), p).toBe("public");
    }
  });

  it("treats unknown URLs as unknown (404), including look-alikes of real prefixes", () => {
    for (const p of ["/totally-unknown", "/ar/nope", "/ar/about", "/ar/blog", "/dashboardx", "/blogger", "/apiary", "/llms.txt", "/pmpx", "/administrator"]) {
      expect(classifyRoute(p), p).toBe("unknown");
    }
  });

  it("ignores a trailing slash", () => {
    expect(classifyRoute("/dashboard/")).toBe("private");
    expect(classifyRoute("/services/")).toBe("public");
    expect(classifyRoute("/nope/")).toBe("unknown");
  });

  it("does not let an Arabic look-alike path become public unless it is a real Arabic page", () => {
    expect(PUBLIC_ROUTES.has("/ar/dashboard")).toBe(false);
    expect(classifyRoute("/ar/dashboard")).toBe("unknown");
    expect(classifyRoute("/ar/admin")).toBe("unknown");
  });

  it("rewrites unknown URLs to the catch-all 404 of the matching language", () => {
    expect(notFoundRewriteFor("/totally-unknown")).toBe("/__not_found__");
    expect(notFoundRewriteFor("/ar/nope")).toBe("/ar/__not_found__");
    expect(notFoundRewriteFor("/ar")).toBe("/ar/__not_found__");
    expect(notFoundRewriteFor("/arabic-course")).toBe("/__not_found__");
  });
});
