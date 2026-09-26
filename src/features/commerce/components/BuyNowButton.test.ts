import { describe, it, expect, vi } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";

vi.mock("next/navigation", () => ({ usePathname: () => "/courses/pmp-exam-simulator", useRouter: () => ({ push: vi.fn() }) }));

const { LanguageProvider } = await import("@/lib/LanguageContext");
const { default: BuyNowButton } = await import("./BuyNowButton");
const { default: translations } = await import("@/lib/translations");

const en = translations.en;

function render() {
  return renderToString(createElement(LanguageProvider, null, createElement(BuyNowButton, { productSlug: "pmp-exam-simulator" })));
}

describe("BuyNowButton — stay-on-payment-page notice", () => {
  it("shows the bilingual 'don't close the payment page' notice before the customer ever clicks Buy Now (EN default)", () => {
    const html = render();
    // renderToString HTML-escapes apostrophes (&#x27;) - assert on an
    // apostrophe-free substring rather than the raw translation string.
    expect(html).toContain("until your payment is complete");
    expect(html).toContain("returned to ZentexAI with your access confirmed");
  });

  it("never renders an alarming word ('warning', 'danger', 'error', 'urgent') in the notice copy", () => {
    const notice = en.commerce.card.payment_stay_on_page_notice.toLowerCase();
    expect(notice).not.toMatch(/warning|danger|urgent|do not leave|error/);
  });
});
