import { describe, it, expect, vi, beforeEach } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { NextRequest } from "next/server";

let mockPathname = "/";
const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: pushMock }),
}));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: unknown }) => createElement("a", { href, ...rest }, children as never),
}));

import { LanguageProvider } from "./LanguageContext";
import translations from "./translations";
import ServiceLandingContent from "@/components/ServiceLandingContent";
import MachineLearningContent from "@/app/(en)/(corporate)/services/machine-learning-uae/MachineLearningContent";

function render(pathname: string, el: () => React.ReactElement) {
  mockPathname = pathname;
  return renderToString(createElement(LanguageProvider, null, el()));
}

describe("language is fixed by the URL and rendered on the server", () => {
  beforeEach(() => pushMock.mockClear());

  it("renders Arabic content in the initial HTML for /ar/... with no client-side toggle", () => {
    const html = render("/ar/services/machine-learning-uae", () => createElement(MachineLearningContent));
    expect(html).toContain(translations.ar.machineLearning.hero_h1);
    expect(html).not.toContain(translations.en.machineLearning.hero_h1);
    // Internal links point Arabic readers at Arabic URLs where they exist.
    expect(html).toContain('href="/ar/services/data-analytics-uae"');
    expect(html).toContain('href="/ar/services/power-bi-consulting-uae"');
    // English-only blog links are not shown on the Arabic page.
    expect(html).not.toContain("/blog");
  });

  it("renders English content at the English URL, even for a visitor whose stored preference is Arabic", () => {
    const html = render("/services/machine-learning-uae", () => createElement(MachineLearningContent));
    expect(html).toContain(translations.en.machineLearning.hero_h1);
    expect(html).not.toContain(translations.ar.machineLearning.hero_h1);
    expect(html).toContain('href="/services/data-analytics-uae"');
  });

  it("renders the shared landing template in Arabic for the new analytics and Power BI pages", () => {
    for (const [path, key] of [["/ar/services/data-analytics-uae", "dataAnalytics"], ["/ar/services/power-bi-consulting-uae", "powerBi"]] as const) {
      const html = render(path, () => createElement(ServiceLandingContent, { copyKey: key }));
      expect(html).toContain(translations.ar[key].hero_h1);
      expect(html).toContain(translations.ar[key].faq[0].q);
      expect(html).not.toContain(translations.en[key].hero_h1);
    }
  });

  it("keeps the original client-side behaviour on pages with no Arabic version", () => {
    const html = render("/about", () => createElement(MachineLearningContent));
    expect(html).toContain(translations.en.machineLearning.hero_h1);
  });
});

describe("middleware access to Arabic routes", () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://placeholder.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "placeholder-anon-key";

  async function status(pathname: string) {
    const { middleware } = await import("@/middleware");
    const res = await middleware(new NextRequest(`https://zentexai.com${pathname}`));
    return { status: res.status, location: res.headers.get("location") };
  }

  it("lets logged-out visitors reach every Arabic marketing route without a redirect", async () => {
    for (const p of ["/ar", "/ar/academy", "/ar/courses", "/ar/services", "/ar/services/ai-agents-automation-uae", "/ar/services/whatsapp-automation-uae", "/ar/services/machine-learning-uae", "/ar/services/data-analytics-uae", "/ar/services/power-bi-consulting-uae"]) {
      const r = await status(p);
      expect(r.location, p).toBeNull();
      expect(r.status, p).toBe(200);
    }
  });

  it("does not expose protected or unlisted routes under /ar, and creates no redirect loop", async () => {
    for (const p of ["/ar/dashboard", "/ar/admin", "/ar/pmp/mock-exam", "/ar/about", "/ar/login-x", "/ar/checkout/success"]) {
      const r = await status(p);
      expect(r.status, p).toBe(307);
      expect(new URL(r.location!, "https://zentexai.com").pathname, p).toBe("/login");
    }
    for (const p of ["/dashboard", "/pmp/practice", "/admin"]) {
      expect((await status(p)).status, p).toBe(307);
    }
    // The login page itself is public, so /login never redirects to itself.
    expect((await status("/login")).status).toBe(200);
  });

  it("leaves the existing English public routes unchanged", async () => {
    for (const p of ["/", "/academy", "/courses", "/services", "/services/power-bi-consulting-uae", "/about", "/blog", "/sitemap.xml"]) {
      expect((await status(p)).status, p).toBe(200);
    }
  });
});
