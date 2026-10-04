import { describe, it, expect, vi } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";

let mockPathname = "/contact";
vi.mock("next/navigation", () => ({ usePathname: () => mockPathname, useRouter: () => ({ push: vi.fn() }) }));

import { LanguageProvider } from "@/lib/LanguageContext";
import ContactContent from "./ContactContent";

function render(pathname: string) {
  mockPathname = pathname;
  return renderToString(createElement(LanguageProvider, null, createElement(ContactContent)));
}

describe("ContactContent: phone number bidi isolation", () => {
  // /contact has no Arabic URL (see i18nRoutes.ts): LanguageContext's "ar"
  // state there only ever comes from a client-side localStorage read in a
  // useEffect (LanguageContext.tsx), which renderToString does not run - so
  // this SSR test can only ever observe the English render and cannot
  // reproduce the Arabic-rendered page directly. It instead asserts the
  // markup-level invariant that fixes the bug regardless of language: live
  // browser verification (not this test) showed that without dir="ltr" on
  // the phone link, "+971 56 622 7824" rendered inside that RTL page as
  // "7824 622 56 971+" (the space-separated groups reordered by the bidi
  // algorithm - not reversed digits, but still wrong and confusing).
  it("marks the WhatsApp phone link dir=\"ltr\" so its digit groups can't be bidi-reordered if the page is ever rendered RTL", () => {
    const html = render("/contact");
    const linkMatch = html.match(/<a[^>]*href="https:\/\/wa\.me\/971566227824"[^>]*>/);
    expect(linkMatch, "whatsapp link").not.toBeNull();
    expect(linkMatch![0]).toContain('dir="ltr"');
    expect(html).toContain(">+971 56 622 7824<");
  });
});
