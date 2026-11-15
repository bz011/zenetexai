import { describe, it, expect, vi } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";

let mockPathname = "/";
let authed = false;
vi.mock("next/navigation", () => ({ usePathname: () => mockPathname, useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: unknown }) => createElement("a", { href, ...rest }, children as never),
}));
vi.mock("next/image", () => ({ default: ({ alt }: { alt?: string }) => createElement("img", { alt: alt ?? "" }) }));
vi.mock("@/lib/fonts", () => ({ manrope: { className: "", variable: "" }, arabicFont: { variable: "" } }));
vi.mock("@/features/auth/hooks/useAuth", () => ({ useAuth: () => ({ isAuthenticated: authed, isLoading: false, logout: vi.fn() }) }));

const { LanguageProvider } = await import("@/lib/LanguageContext");
const { default: SiteHeader } = await import("./SiteHeader");
const { default: AcademyHeader } = await import("@/components/academy/AcademyHeader");

function render(path: string, el: unknown, signedIn = false) {
  mockPathname = path;
  authed = signedIn;
  return renderToString(createElement(LanguageProvider, null, createElement(el as never)));
}

/** hrefs of the links inside the first element matching `open` (the desktop <nav> or the mobile <ul>). */
function linksIn(html: string, open: RegExp, close: string) {
  const start = html.search(open);
  const block = html.slice(start, html.indexOf(close, start));
  return [...block.matchAll(/<a [^>]*href="([^"]+)"[^>]*>([^<]*)</g)].map((m) => ({ href: m[1], label: m[2], tag: m[0] }));
}

describe("public site header (v5)", () => {
  it("orders the desktop nav Home | Services | Academy | Blog | About, with Contact as the closing action", () => {
    const html = render("/services", SiteHeader);
    expect(linksIn(html, /<nav /, "</nav>").map((l) => l.label)).toEqual(["Home", "Services", "Academy", "Blog", "About"]);
    const contact = html.indexOf(">Contact<");
    expect(contact).toBeGreaterThan(html.indexOf("</nav>"));
  });

  it("uses the same order in the mobile menu, Contact last before the language switch", () => {
    const html = render("/services", SiteHeader);
    const menu = linksIn(html, /<ul/, "</ul>").map((l) => l.href);
    // ...then the language switch, pointing at this page's Arabic version.
    expect(menu).toEqual(["/", "/services", "/academy", "/blog", "/about", "/contact", "/ar/services"]);
  });

  it("keeps the logo linked to the homepage and marks Home current only on the homepage", () => {
    const home = render("/", SiteHeader);
    expect(home).toMatch(/<a href="\/"[^>]*><span/); // logo
    const homeLink = linksIn(home, /<nav /, "</nav>")[0];
    expect(homeLink.tag).toContain('aria-current="page"');
    const about = render("/about", SiteHeader);
    expect(linksIn(about, /<nav /, "</nav>")[0].tag).not.toContain("aria-current");
    expect(linksIn(about, /<nav /, "</nav>").find((l) => l.href === "/about")?.tag).toContain('aria-current="page"');
  });

  it("follows the Arabic routes with Arabic labels", () => {
    const html = render("/ar/services", SiteHeader);
    const nav = linksIn(html, /<nav /, "</nav>");
    expect(nav[0].label).toBe("الرئيسية");
    expect(nav.map((l) => l.label)).toEqual(["الرئيسية", "الخدمات", "الأكاديمية", "المدونة", "من نحن"]);
    // Blog and About have no /ar route: they keep their URL and follow the stored language.
    expect(nav.map((l) => l.href)).toEqual(["/ar", "/ar/services", "/ar/academy", "/blog", "/about"]);
    expect(nav[1].tag).toContain('aria-current="page"');
    expect(nav[0].tag).not.toContain("aria-current");
  });

  it("shows no Login, Dashboard or Log out on public pages, signed in or not", () => {
    for (const signedIn of [false, true]) {
      for (const path of ["/", "/services", "/about", "/contact", "/blog", "/ar"]) {
        const html = render(path, SiteHeader, signedIn);
        expect(html).not.toMatch(/href="\/login"|href="\/dashboard"|>Log out<|>Login<|تسجيل الدخول|لوحة/);
      }
    }
  });

  it("gives Academy its own subtle style on desktop and in the menu, and drops Resources from the header", () => {
    const html = render("/", SiteHeader);
    const academy = linksIn(html, /<nav /, "</nav>").find((l) => l.href === "/academy");
    expect(academy?.tag).toMatch(/class="[^"]*navAcademy/);
    expect(linksIn(html, /<ul/, "</ul>").find((l) => l.href === "/academy")?.tag).toMatch(/navAcademy/);
    expect(html).not.toContain('href="/resources"');
  });
});

describe("Academy header keeps account navigation", () => {
  it("shows Login to a signed-out learner", () => {
    const html = render("/courses/pmp-mastery-program", AcademyHeader, false);
    expect(html).toContain('href="/login"');
    expect(html).not.toContain('href="/dashboard"');
  });

  it("shows Dashboard and Log out to a signed-in learner on course, lesson, practice and mock exam pages", () => {
    for (const path of ["/courses/pmp-mastery-program", "/courses/pmp/lessons/l1", "/pmp/practice", "/pmp/mock-exam", "/ar/academy"]) {
      const html = render(path, AcademyHeader, true);
      expect(html).toContain('href="/dashboard"');
      expect(html).not.toContain('href="/login"');
    }
  });
});

describe("Resources stays reachable", () => {
  it("is linked from the footer in both languages once it leaves the header", async () => {
    const { footerCopy } = await import("./footerCopy");
    for (const lang of ["en", "ar"] as const) {
      const links = JSON.stringify(footerCopy[lang]);
      expect(links).toContain('"href":"/resources"');
    }
  });
});
