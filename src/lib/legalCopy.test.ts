import { describe, it, expect } from "vitest";
import { privacyCopy, termsCopy, refundCopy, type LegalDoc } from "./legalCopy";

const text = (d: LegalDoc) => [d.title, d.updated, ...d.intro, ...d.sections.flatMap((s) => [s.heading, ...s.body])].join("\n");

describe("legal copy reflects free access to the PMP programs", () => {
  it("no longer describes the PMP programs as paid (EN)", () => {
    for (const doc of [privacyCopy.en, termsCopy.en]) {
      const t = text(doc);
      expect(t).not.toMatch(/paid program \(currently the PMP|paid programs \(the PMP|Purchasing access to the PMP/);
      expect(t).toContain("currently available free of charge");
    }
  });

  it("no longer describes the PMP programs as paid (AR)", () => {
    for (const doc of [privacyCopy.ar, termsCopy.ar]) {
      const t = text(doc);
      expect(t).not.toMatch(/برنامج مدفوع \(حالياً محاكي|البرامج المدفوعة \(محاكي|يمنحك شراء الوصول إلى محاكي/);
      expect(t).toContain("حالياً مجاناً");
    }
  });

  it("keeps the payment terms for any future paid programs", () => {
    expect(text(termsCopy.en)).toContain("The price shown at checkout is the amount you will be charged");
    expect(text(termsCopy.ar)).toContain("السعر المعروض عند الدفع هو المبلغ الذي سيُخصم منك");
  });

  it("dates only the revised documents; the unchanged Refund Policy keeps its date", () => {
    expect(privacyCopy.en.updated).toBe(termsCopy.en.updated);
    expect(refundCopy.en.updated).not.toBe(termsCopy.en.updated);
  });
});
