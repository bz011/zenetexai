import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

/**
 * Static, CI-enforced backstop for the admin authorization pattern this app
 * relies on (Pre-Implementation Master Audit, 2026-09-30, Wave 0-D).
 *
 * admin/layout.tsx deliberately does not itself call requireAdmin()/
 * requireRole() (see its own header comment) - authorization is enforced
 * per-page instead, because two sub-routes (ai-generation/**) intentionally
 * allow "instructor" in addition to "admin", so a single blanket layout-level
 * check would either be too strict (blocking instructors from pages they're
 * meant to reach) or too loose (not actually role-checking at all). That
 * per-page pattern is correct today - verified by reading all 15 admin
 * page.tsx files - but nothing before this test made "forgetting the guard
 * on a new admin page" fail the build. This test is that backstop: it scans
 * the real file tree (not a hardcoded list, so a newly added admin page is
 * automatically covered) and fails if any admin page.tsx lacks a call to
 * requireAdmin(/requireRole(.
 *
 * Deliberately narrow scope for the two API routes checked below: this
 * project's privileged API routes use several different, legitimately
 * different authorization mechanisms (requireApiRole for the two admin blog
 * mutations, a bearer secret for the reconciliation cron, an HMAC signature
 * for the Ziina webhook, direct getUser()+RLS for assessment submission and
 * certificate download). A single blanket "must call requireApiRole" rule
 * across every route.ts would incorrectly flag the webhook/cron/RLS-based
 * routes as unguarded even though they are correctly guarded a different
 * way - exactly the "false security" a static check must not create. This
 * test therefore only asserts the two routes that share one real, uniform
 * pattern (admin-only content mutation via requireApiRole) keep using it.
 */

const ADMIN_DIR = path.resolve(__dirname, "../src/app/(en)/(corporate)/admin");

function findAdminPages(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findAdminPages(full, out);
    } else if (entry.name === "page.tsx") {
      out.push(full);
    }
  }
  return out;
}

const GUARD_CALL = /requireAdmin\(|requireRole\(/;

describe("admin page authorization guard (static, CI-enforced)", () => {
  const pages = findAdminPages(ADMIN_DIR);

  it("finds admin pages to check (a suspiciously empty result would hide every case below)", () => {
    expect(pages.length).toBeGreaterThanOrEqual(15);
  });

  it.each(findAdminPages(ADMIN_DIR).map((p) => [path.relative(ADMIN_DIR, p), p] as const))(
    "admin/%s calls requireAdmin() or requireRole() before rendering anything",
    (_relPath, fullPath) => {
      const source = fs.readFileSync(fullPath, "utf8");
      expect(GUARD_CALL.test(source), `${fullPath} has no requireAdmin()/requireRole() call`).toBe(true);
    }
  );
});

describe("admin-only blog mutation API routes keep their requireApiRole() guard (static, CI-enforced)", () => {
  const API_DIR = path.resolve(__dirname, "../src/app/api");

  it.each(["delete-post/route.ts", "publish-post/route.ts"])("%s calls requireApiRole()", (relPath) => {
    const source = fs.readFileSync(path.join(API_DIR, relPath), "utf8");
    expect(source.includes("requireApiRole("), `${relPath} has no requireApiRole() call`).toBe(true);
  });
});
