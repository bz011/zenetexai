import { describe, it, expect, vi } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";

let mockPathname = "/services";
vi.mock("next/navigation", () => ({ usePathname: () => mockPathname, useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: unknown }) => createElement("a", { href, ...rest }, children as never),
}));
vi.mock("@/lib/fonts", () => ({ manrope: { className: "font-manrope", variable: "" }, arabicFont: { variable: "" } }));
vi.mock("@/features/auth/hooks/useAuth", () => ({ useAuth: () => ({ isAuthenticated: false, isLoading: false, logout: vi.fn() }) }));

const { LanguageProvider } = await import("@/lib/LanguageContext");
const { default: Header } = await import("@/components/Header");
const { default: AcademyHeader } = await import("@/components/academy/AcademyHeader");
const { default: SkipLink } = await import("./SkipLink");
const { default: Footer } = await import("@/components/Footer");

function render(path: string, el: () => React.ReactElement) {
  mockPathname = path;
  return renderToString(createElement(LanguageProvider, null, el()));
}

describe("site header", () => {
  it("keeps the corporate inline navigation off until lg (it does not fit at 768px) and shows the menu button below it", () => {
    const html = render("/", () => createElement(Header));
    expect(html).toContain("hidden lg:flex");
    expect(html).not.toContain("hidden md:flex");
    expect(html).toContain("lg:hidden"); // menu button hides once the nav shows
  });

  it("wires the menu button to its panel (aria-expanded + aria-controls) and uses a 44px target", () => {
    const html = render("/", () => createElement(Header));
    expect(html).toMatch(/aria-expanded="false"/);
    expect(html).toContain('aria-controls="mobile-nav"');
    expect(html).toContain("h-11 w-11");
  });

  it("names the language switch so the label contains its visible text (WCAG 2.5.3) and localizes the action", () => {
    const en = render("/", () => createElement(Header));
    expect(en).toContain('aria-label="EN / AR - Switch language"');
    const ar = render("/ar", () => createElement(Header));
    expect(ar).toContain('aria-label="EN / AR - تبديل اللغة"');
  });

  it("marks the current page and localizes nav links for Arabic readers", () => {
    const html = render("/ar/services", () => createElement(Header));
    expect(html).toContain('href="/ar/services"');
    expect(html).toMatch(/href="\/ar\/services"[^>]*aria-current="page"|aria-current="page"[^>]*href="\/ar\/services"/);
  });

  it("uses the same component for the Academy header (nav from md, Enroll action)", () => {
    const html = render("/academy", () => createElement(AcademyHeader));
    expect(html).toContain("hidden md:flex");
    expect(html).toContain('aria-controls="mobile-nav"');
  });
});

describe("skip link and footer", () => {
  it("renders a skip link targeting #main-content, localized", () => {
    expect(render("/", () => createElement(SkipLink))).toContain('href="#main-content"');
    expect(render("/ar", () => createElement(SkipLink))).toContain("تخطَّ إلى المحتوى الرئيسي");
  });

  it("links every service page from the footer (internal linking) and links the three draft legal pages now that they exist (Master Audit Wave 0-C)", () => {
    const html = render("/", () => createElement(Footer));
    for (const p of ["ai-agents-automation-uae", "whatsapp-automation-uae", "machine-learning-uae", "data-analytics-uae", "power-bi-consulting-uae"]) {
      expect(html).toContain(`/services/${p}`);
    }
    expect(html).toContain('href="/privacy"');
    expect(html).toContain('href="/terms"');
    expect(html).toContain('href="/refund"');
  });

  it("points Arabic footer service links at Arabic pages", () => {
    const html = render("/ar", () => createElement(Footer));
    expect(html).toContain("/ar/services/data-analytics-uae");
    expect(html).toContain("/ar/services/power-bi-consulting-uae");
  });
});
