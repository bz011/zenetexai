import { describe, it, expect } from "vitest";
import { getCourseProductSlug } from "./productService";

type Row = Record<string, unknown>;
function fake(tables: Record<string, Row[]>) {
  return {
    from(table: string) {
      let rows = [...(tables[table] ?? [])];
      const q = {
        select: () => q,
        eq: (c: string, v: unknown) => ((rows = rows.filter((r) => r[c] === v)), q),
        in: (c: string, v: unknown[]) => ((rows = rows.filter((r) => v.includes(r[c]))), q),
        order: (c: string) => ((rows = rows.sort((a, b) => Number(a[c]) - Number(b[c]))), q),
        limit: (n: number) => ((rows = rows.slice(0, n)), q),
        then: (res: (v: { data: Row[] }) => unknown) => res({ data: rows }),
      };
      return q;
    },
  };
}

const world = {
  product_capabilities: [
    { product_id: "p-mastery", capability: "course:pmp" },
    { product_id: "p-bundle", capability: "course:pmp" },
    { product_id: "p-sim", capability: "practice:pmp" },
  ],
  products: [
    { id: "p-mastery", slug: "pmp-mastery-program", type: "course", is_published: true, order_index: 1 },
    { id: "p-bundle", slug: "pmp-complete-package", type: "bundle", is_published: true, order_index: 0 },
    { id: "p-sim", slug: "pmp-exam-simulator", type: "simulator", is_published: true, order_index: 2 },
  ],
};

describe("getCourseProductSlug (course slug -> its public product page)", () => {
  it("maps the pmp course to the PMP Mastery Program page, never the bundle", async () => {
    expect(await getCourseProductSlug(fake(world) as never, "pmp")).toBe("pmp-mastery-program");
  });

  it("returns null for a slug no published course product grants", async () => {
    expect(await getCourseProductSlug(fake(world) as never, "no-such-course")).toBeNull();
    const unpublished = { ...world, products: world.products.map((p) => ({ ...p, is_published: false })) };
    expect(await getCourseProductSlug(fake(unpublished) as never, "pmp")).toBeNull();
  });
});
