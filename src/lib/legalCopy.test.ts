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

  it("dates the Terms and Refund Policy together; the unchanged Privacy Policy keeps its date", () => {
    expect(refundCopy.en.updated).toBe(termsCopy.en.updated);
    expect(refundCopy.ar.updated).toBe(termsCopy.ar.updated);
    expect(privacyCopy.en.updated).not.toBe(termsCopy.en.updated);
  });

  it("Terms distinguish the free Mastery Program from the Simulator's limited launch offer and promise advance notice (EN/AR)", () => {
    const en = text(termsCopy.en), ar = text(termsCopy.ar);
    expect(en).toContain("with no planned end date");
    expect(en).toContain("free as a launch offer for a limited period");
    expect(en).toContain("announce it in advance");
    expect(ar).toContain("دون تاريخ انتهاء مخطط له");
    expect(ar).toContain("كعرض إطلاق لفترة محدودة");
    expect(ar).toContain("سنعلن ذلك مسبقاً");
    expect(en + ar).not.toMatch(/60[- ]day|60 يوم/);
  });

  it("Refund Policy no longer describes the PMP programs as paid, and keeps refund rules for paid purchases (EN/AR)", () => {
    const en = text(refundCopy.en), ar = text(refundCopy.ar);
    expect(en).not.toContain("purchased through ZentexAI Academy: the PMP");
    expect(en).toContain("are currently free, so no payment is taken");
    expect(en).toContain("Refund Eligibility");
    expect(ar).not.toContain("المُشترى عبر أكاديمية ZentexAI: محاكي");
    expect(ar).toContain("حالياً مجاناً");
    expect(ar).toContain("أهلية الاسترداد");
  });
});
