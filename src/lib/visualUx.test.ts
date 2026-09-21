import { describe, it, expect, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToString } from "react-dom/server";

let mockPathname = "/";
vi.mock("next/navigation", () => ({ usePathname: () => mockPathname, useRouter: () => ({ push: vi.fn() }) }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: unknown }) => createElement("a", { href, ...rest }, children as never),
}));

import { LanguageProvider } from "./LanguageContext";
import { visualCopy } from "./visualCopy";
import { AgentContextDiagram, DashboardSketch, FlowVisual, SimulatorLoopVisual } from "@/components/visuals/Visuals";
import ServiceLandingContent from "@/components/ServiceLandingContent";

const ROOT = path.resolve(__dirname, "../..");
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), "utf8");

function render(pathname: string, el: () => React.ReactElement) {
  mockPathname = pathname;
  return renderToString(createElement(LanguageProvider, null, el()));
}

/** The public pages this sprint's typography and spacing scale applies to. */
const SCOPED_FILES = [
  "src/app/(en)/(corporate)/HomeContent.tsx",
  "src/components/HeroSection.tsx",
  "src/components/CTASection.tsx",
  "src/app/(en)/(corporate)/services/ServicesContent.tsx",
  "src/app/(en)/(corporate)/services/ai-agents-automation-uae/AiAgentsAutomationContent.tsx",
  "src/app/(en)/(corporate)/services/whatsapp-automation-uae/WhatsappAutomationContent.tsx",
  "src/app/(en)/(corporate)/services/machine-learning-uae/MachineLearningContent.tsx",
  "src/components/ServiceLandingContent.tsx",
  "src/app/(en)/(academy)/academy/AcademyContent.tsx",
  "src/components/seo/PmpDiscoverabilitySection.tsx",
  "src/features/commerce/components/SimulatorSalesSections.tsx",
  "src/components/RelatedLinkRow.tsx",
  "src/components/visuals/Visuals.tsx",
];

describe("responsive type scale and spacing on the public pages", () => {
  it("defines the four-step responsive scale, with a larger scale factor for Arabic", () => {
    const tw = read("tailwind.config.ts");
    for (const k of ["caption", "small", "body", "lead"]) expect(tw).toContain(`${k}: [`);
    const css = read("src/app/globals.css");
    expect(css).toMatch(/\[dir="rtl"\][\s\S]*--type-scale: 1\.06/);
  });

  it("no in-scope file uses a hard-coded body size below 14px, or low-contrast slate-500/600 text", () => {
    for (const f of SCOPED_FILES) {
      const src = read(f);
      expect(src, f).not.toMatch(/text-\[(1[0-3](\.\d+)?)px\]/);
      expect(src, f).not.toMatch(/text-slate-(500|600)\b/);
    }
  });

  it("uses responsive section spacing (no bare 96px+ paddings on mobile)", () => {
    for (const f of SCOPED_FILES) {
      const src = read(f);
      for (const m of src.matchAll(/(?<![\w:-])(py-(?:24|28|32|36)|pt-36|pb-24)(?![\w-])/g)) {
        const around = src.slice(Math.max(0, m.index! - 30), m.index!);
        expect(around, `${f}: ${m[1]}`).toMatch(/(md|lg):$/);
      }
    }
  });

  it("wires the Arabic web font into both root layouts and the RTL font stack", () => {
    expect(read("src/lib/fonts.ts")).toContain("Noto_Sans_Arabic");
    expect(read("src/app/(ar)/layout.tsx")).toContain("arabicFont.variable");
    expect(read("src/app/(en)/layout.tsx")).toContain("arabicFont.variable");
    expect(read("src/app/globals.css")).toContain("var(--font-arabic)");
  });

  it("keeps the exam runner and other app screens out of the opt-in marketing scope", () => {
    for (const f of ["src/features/mock-exam/components/ExamRunner.tsx", "src/features/practice/components/PracticeRunner.tsx"]) {
      expect(read(f), f).not.toContain("ux-page");
    }
  });
});

describe("diagram copy", () => {
  const { en, ar } = visualCopy;

  it("has English and Arabic with identical structure and no empty strings", () => {
    const shape = (v: typeof en) => ({
      agentSteps: v.agent.steps.length, agentIn: v.agent.inputs.length, agentSys: v.agent.systems.length,
      ml: v.mlFlow.steps.length, an: v.analyticsFlow.steps.length, sim: v.simulatorLoop.steps.length,
    });
    expect(shape(ar)).toEqual(shape(en));
    expect(JSON.stringify(ar)).not.toMatch(/:\s*""/);
    expect(JSON.stringify(en)).not.toMatch(/:\s*""/);
  });

  it("makes no result, scale, client, testimonial or guarantee claims", () => {
    const text = JSON.stringify(en);
    for (const re of [/\d+\s*%/, /\bROI\b/i, /guarantee/i, /testimonial/i, /case stud/i, /trusted by/i, /award/i, /certified|partner\b/i, /\b\d+x\b/i]) {
      expect(text, String(re)).not.toMatch(re);
    }
  });

  it("labels the dashboard as a layout sketch with no real data or client work", () => {
    expect(en.dashboardSketch.chip).toMatch(/no real data/i);
    expect(en.dashboardSketch.sub).toMatch(/no client work/i);
    expect(ar.dashboardSketch.chip).toContain("دون بيانات حقيقية");
    expect(ar.dashboardSketch.sub).toContain("دون أي عمل لعميل");
  });

  it("the agent diagram restates only behaviour the AI Agents page already describes", () => {
    const page = read("src/lib/translations.ts");
    for (const term of ["Understand", "Decide", "Act", "Verify", "Escalate", "CRM", "approved"]) expect(page).toContain(term);
    expect(en.agent.steps.map((s) => s.title)).toEqual(["Understand", "Decide", "Act", "Verify"]);
  });
});

describe("rendered diagrams (server HTML)", () => {
  it("English URL renders English; Arabic URL renders the Arabic diagram in the initial HTML", () => {
    const enHtml = render("/services/ai-agents-automation-uae", () => createElement(AgentContextDiagram));
    expect(enHtml).toContain(visualCopy.en.agent.heading);
    const arHtml = render("/ar/services/ai-agents-automation-uae", () => createElement(AgentContextDiagram));
    expect(arHtml).toContain(visualCopy.ar.agent.heading);
    expect(arHtml).not.toContain(visualCopy.en.agent.heading);
  });

  it("diagrams are text-only HTML/SVG: accessible group labels, no raster images, no unresolved placeholders", () => {
    for (const [p, el] of [
      ["/services/machine-learning-uae", () => createElement(FlowVisual, { kind: "mlFlow" })],
      ["/ar/services/data-analytics-uae", () => createElement(FlowVisual, { kind: "analyticsFlow" })],
      ["/services/power-bi-consulting-uae", () => createElement(DashboardSketch)],
      ["/ar/courses/pmp-exam-simulator", () => createElement(SimulatorLoopVisual)],
    ] as const) {
      const html = render(p, el);
      expect(html, p).toContain('role="group"');
      expect(html, p).toContain("aria-label=");
      expect(html, p).not.toMatch(/<img|<picture|url\(/);
      expect(html, p).not.toMatch(/\{\w+\}/);
    }
  });

  it("the simulator loop shows the exam structure from the blueprint, in both languages", () => {
    const en = render("/courses/pmp-exam-simulator", () => createElement(SimulatorLoopVisual));
    expect(en).toContain("180 questions in 4 hours");
    const ar = render("/ar/courses/pmp-exam-simulator", () => createElement(SimulatorLoopVisual));
    expect(ar).toContain("180 سؤالاً في 4 ساعات");
  });

  it("the shared landing template shows the analytics flow / dashboard sketch only when asked, in both languages", () => {
    const withSketch = render("/ar/services/power-bi-consulting-uae", () => createElement(ServiceLandingContent, { copyKey: "powerBi", visual: "dashboardSketch" }));
    expect(withSketch).toContain(visualCopy.ar.dashboardSketch.chip);
    const withFlow = render("/services/data-analytics-uae", () => createElement(ServiceLandingContent, { copyKey: "dataAnalytics", visual: "analyticsFlow" }));
    expect(withFlow).toContain(visualCopy.en.analyticsFlow.heading);
    const bare = render("/services/data-analytics-uae", () => createElement(ServiceLandingContent, { copyKey: "dataAnalytics" }));
    expect(bare).not.toContain(visualCopy.en.analyticsFlow.heading);
  });

  it("passes the visual choice on the real English and Arabic pages", () => {
    for (const base of ["src/app/(en)/(corporate)/services", "src/app/(ar)/ar/(corporate)/services"]) {
      expect(read(`${base}/data-analytics-uae/page.tsx`)).toContain('visual="analyticsFlow"');
      expect(read(`${base}/power-bi-consulting-uae/page.tsx`)).toContain('visual="dashboardSketch"');
    }
    expect(read("src/app/(en)/(corporate)/services/ai-agents-automation-uae/AiAgentsAutomationContent.tsx")).toContain("<AgentContextDiagram />");
    expect(read("src/app/(en)/(corporate)/services/machine-learning-uae/MachineLearningContent.tsx")).toContain('<FlowVisual kind="mlFlow" />');
  });
});
