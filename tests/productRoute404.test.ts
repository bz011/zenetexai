import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const routeDir = path.resolve(__dirname, "../src/app/(en)/(academy)/courses/[courseSlug]");

describe("public product route answers a real HTTP 404 for missing products", () => {
  it("has no loading.tsx on the product route or its parent (a loading boundary streams the shell with status 200 before notFound() can run, producing a soft 404)", () => {
    expect(fs.existsSync(path.join(routeDir, "loading.tsx"))).toBe(false);
    expect(fs.existsSync(path.join(routeDir, "..", "loading.tsx"))).toBe(false);
  });

  it("decides not-found before any UI streams (generateMetadata + page body both call notFound)", () => {
    const page = fs.readFileSync(path.join(routeDir, "page.tsx"), "utf-8");
    const body = fs.readFileSync(path.join(routeDir, "ProductPageBody.tsx"), "utf-8");
    expect(page).toMatch(/if \(!product \|\| !product\.is_published\) notFound\(\)/);
    expect(body).toMatch(/if \(!product \|\| !product\.is_published\) notFound\(\)/);
  });
});
