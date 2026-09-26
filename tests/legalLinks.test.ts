import { describe, it, expect } from "vitest";
import { LEGAL_LINKS } from "../src/lib/legalLinks";
import { classifyRoute } from "../src/lib/auth/routeAccess";
import { allRoutes } from "./helpers/appRoutes";

describe("legal links", () => {
  it("never links to a page that does not exist (no placeholders, no dead links)", () => {
    const routes = new Set(allRoutes());
    for (const link of LEGAL_LINKS) {
      const p = link.href.split(/[?#]/)[0];
      expect(routes.has(p), `${link.id} -> ${link.href} has no page`).toBe(true);
      expect(classifyRoute(p), `${link.id} must be public`).toBe("public");
      expect(link.label.en.length).toBeGreaterThan(0);
      expect(link.label.ar.length).toBeGreaterThan(0);
    }
  });
});
