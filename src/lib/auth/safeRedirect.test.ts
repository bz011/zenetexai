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

  it("normalizes a path-traversal segment via the real URL parser before validating - it can only ever collapse to another same-origin path, never off-site", () => {
    // "/dashboard/../../evil" normalizes to "/evil", which isn't a known app
    // path, so it still safely falls back.
    expect(resolveSafeRedirect("/dashboard/../../evil")).toBe("/dashboard");
    // "/checkout/success/../../admin" normalizes to "/admin" - already an
    // allow-listed, same-origin destination in its own right, so landing
    // there is correct (not a bypass): traversal cannot escape the host.
    expect(resolveSafeRedirect("/checkout/success/../../admin")).toBe("/admin");
  });

  // Regression test for a stabilization-sprint bug: the old exact-match
  // allow-list covered only 8 static paths, so a logged-out visitor who
  // followed a link to any dynamic protected route (a lesson, an assessment,
  // the certificate page, a mock-exam/practice attempt, most /admin
  // sub-pages) was silently dumped on /dashboard after logging in instead of
  // back where they started. These must now all be preserved.
  it("preserves the real destination for every dynamic protected route the app actually links to", () => {
    for (const path of [
      "/courses/pmp-mastery-program",
      "/courses/pmp-mastery-program/lessons/lesson-123",
      "/courses/pmp-mastery-program/assessments/assessment-456",
      "/courses/pmp-mastery-program/assessments/assessment-456/history",
      "/certificate",
      "/pmp/mock-exam",
      "/pmp/mock-exam/attempt-789",
      "/pmp/mock-exam/attempt-789/results",
      "/pmp/practice",
      "/pmp/practice/session-321",
      "/pmp/practice/history",
      "/admin/courses",
      "/admin/courses/course-1",
      "/admin/ai-generation/coverage",
    ]) {
      expect(resolveSafeRedirect(path), path).toBe(path);
    }
  });

  it("still rejects an off-site or non-app destination even when it looks like it starts with a known prefix", () => {
    expect(resolveSafeRedirect("/coursesevil.com")).toBe("/dashboard"); // prefix boundary: not "/courses" or "/courses/..."
    expect(resolveSafeRedirect("https://evil.com/courses/x")).toBe("/dashboard");
    expect(resolveSafeRedirect("//evil.com/courses/x")).toBe("/dashboard");
    expect(resolveSafeRedirect("javascript:alert(1)")).toBe("/dashboard");
  });

  it("a query string appended to an allow-listed path can never change where it points - it only ever rides along on our own path", () => {
    expect(resolveSafeRedirect("/dashboard?next=https://evil.com")).toBe("/dashboard?next=https://evil.com");
  });

  it("returns a visitor to the PMP Exam Simulator page they started from, in either language", () => {
    expect(resolveSafeRedirect("/courses/pmp-exam-simulator")).toBe("/courses/pmp-exam-simulator");
    expect(resolveSafeRedirect("/ar/courses/pmp-exam-simulator")).toBe("/ar/courses/pmp-exam-simulator");
  });

  it("allow-lists only those exact product paths - no prefix, sibling, traversal or off-site variants", () => {
    for (const bad of [
      "/ar/courses/pmp-mastery-program",
      "/ar/courses/pmp-exam-simulator/../../admin",
      "/ar/courses/pmp-exam-simulator.evil.com",
      "/ar/courses/pmp-exam-simulator/extra",
      "/ar",
      "/ar/dashboard",
      "//evil.com/ar/courses/pmp-exam-simulator",
      "https://evil.com/ar/courses/pmp-exam-simulator",
    ]) {
      expect(resolveSafeRedirect(bad), bad).toBe("/dashboard");
    }
  });
});
