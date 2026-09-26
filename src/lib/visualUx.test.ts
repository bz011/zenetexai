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
import { SimulatorLoopVisual } from "@/components/visuals/Visuals";
import AgentFlowSection from "@/components/flow/AgentFlowSection";
import MechanismFlow from "@/components/flow/MechanismFlow";
import { mechanismCopy } from "./mechanismCopy";
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
  "src/components/flow/GovernedFlow.tsx",
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
  "src/app/(en)/(academy)/courses/[courseSlug]/ProductDetailContent.tsx",
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
    expect(read("src/app/globals.css")).toContain("var(--font-arabic)");
    // The RTL font-family rule matches <html dir="rtl">, so the font variable
    // must be defined on <html> itself. On <body> it is undefined where the
    // rule applies, the declaration is invalid, and Arabic falls back to Times.
    expect(read("src/app/(ar)/layout.tsx")).toMatch(/<html lang="ar" dir="rtl" className=\{`\$\{arabicFont\.variable\} \$\{manrope\.variable\}`\}>/);
    expect(read("src/app/(en)/layout.tsx")).toMatch(/<html lang="en" dir="ltr" className=\{`\$\{arabicFont\.variable\} \$\{manrope\.variable\}`\}>/);
    expect(read("src/app/(ar)/layout.tsx")).not.toMatch(/<body[^>]*arabicFont/);
    expect(read("src/app/(en)/layout.tsx")).not.toMatch(/<body[^>]*arabicFont/);
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
      agentSteps: v.agent.steps.length, agentIn: v.agent.inputs.length, agentSys: v.agent.systems.length, sim: v.simulatorLoop.steps.length,
    });
    expect(shape(ar)).toEqual(shape(en));
    expect(JSON.stringify(ar)).not.toMatch(/:\s*""/);
    expect(JSON.stringify(en)).not.toMatch(/:\s*""/);
    for (const kind of Object.keys(mechanismCopy.en) as (keyof typeof mechanismCopy.en)[]) {
      const e = mechanismCopy.en[kind];
      const a = mechanismCopy.ar[kind];
      expect(a.stages.length, kind).toBe(e.stages.length);
      expect(a.gates.length, kind).toBe(e.stages.length - 1);
      expect(e.gates.length, kind).toBe(e.stages.length - 1);
      expect(JSON.stringify(a), kind).not.toMatch(/:\s*""/);
    }
  });

  it("makes no result, scale, client, testimonial or guarantee claims", () => {
    const text = JSON.stringify(en) + JSON.stringify(mechanismCopy.en);
    for (const re of [/\d+\s*%/, /\bROI\b/i, /guarantee/i, /testimonial/i, /case stud/i, /trusted by/i, /award/i, /certified|partner\b/i, /\b\d+x\b/i]) {
      expect(text, String(re)).not.toMatch(re);
    }
  });

  it("shows no fabricated dashboard or chart: the Power BI mechanism describes a process, not UI", () => {
    const pb = JSON.stringify(mechanismCopy.en.powerBi);
    expect(pb).not.toMatch(/sketch|mock-?up|sample data|placeholder/i);
    expect(mechanismCopy.en.powerBi.stages.map((s) => s.title)).toEqual(["Sources", "Semantic model", "Measures", "Report", "Refresh and governance"]);
  });

  it("the mechanisms follow the approved flows", () => {
    expect(mechanismCopy.en.analytics.stages.map((s) => s.title)).toEqual(["Sources", "Validation and transformation", "Analysis and model", "Insight", "Decision"]);
    expect(mechanismCopy.en.ml.stages.map((s) => s.title)).toEqual(["Data", "Baseline", "Candidate models", "Evaluation", "Decision and monitoring"]);
  });

  it("each mechanism restates wording the service page already publishes", () => {
    const pages = read("src/lib/translations.ts") + read("src/lib/serviceLandingCopy.ts");
    for (const phrase of [
      "We establish a simple baseline first", // ML: baseline first
      "metrics tied to the business outcome", // ML: evaluation
      "We agree on written definitions for each KPI", // analytics: definitions
      "reconcile the figures against source systems", // analytics/Power BI: reconciliation
      "documented measures", // Power BI: measures
      "row-level security", // Power BI: governance
    ]) expect(pages, phrase).toContain(phrase);
  });

  it("the agent diagram restates only behaviour the AI Agents page already describes", () => {
    const page = read("src/lib/translations.ts");
    for (const term of ["Understand", "Decide", "Act", "Verify", "Escalate", "CRM", "approved"]) expect(page).toContain(term);
    expect(en.agent.steps.map((s) => s.title)).toEqual(["Understand", "Decide", "Act", "Verify"]);
  });
});

describe("rendered diagrams (server HTML)", () => {
  it("English URL renders English; Arabic URL renders the Arabic diagram in the initial HTML", () => {
    const enHtml = render("/services/ai-agents-automation-uae", () => createElement(AgentFlowSection));
    expect(enHtml).toContain(visualCopy.en.agent.heading);
    const arHtml = render("/ar/services/ai-agents-automation-uae", () => createElement(AgentFlowSection));
    expect(arHtml).toContain(visualCopy.ar.agent.heading);
    expect(arHtml).not.toContain(visualCopy.en.agent.heading);
  });

  it("diagrams are text-only HTML/SVG: accessible group labels, no raster images, no unresolved placeholders", () => {
    for (const [p, el] of [
      ["/services/machine-learning-uae", () => createElement(MechanismFlow, { kind: "ml" })],
      ["/ar/services/data-analytics-uae", () => createElement(MechanismFlow, { kind: "analytics" })],
      ["/services/power-bi-consulting-uae", () => createElement(MechanismFlow, { kind: "powerBi" })],
      ["/services/ai-agents-automation-uae", () => createElement(AgentFlowSection)],
      ["/ar/courses/pmp-exam-simulator", () => createElement(SimulatorLoopVisual)],
    ] as const) {
      const html = render(p, el);
      expect(html, p).toContain('role="group"');
      expect(html, p).toContain("aria-label=");
      expect(html, p).not.toMatch(/<img|<picture|url\(/);
      expect(html, p).not.toMatch(/\{\w+\}/);
    }
  });

  it("every mechanism renders all its stages and gates as readable HTML text, in both languages", () => {
    for (const [lang, path] of [["en", "/services/machine-learning-uae"], ["ar", "/ar/services/machine-learning-uae"]] as const) {
      for (const kind of ["analytics", "powerBi", "ml"] as const) {
        const html = render(path, () => createElement(MechanismFlow, { kind }));
        const c = mechanismCopy[lang][kind];
        for (const st of c.stages) expect(html, `${lang}/${kind}/${st.title}`).toContain(st.title);
        for (const g of c.gates) expect(html, `${lang}/${kind}/${g}`).toContain(g);
        expect(html).toContain("<ol");
      }
    }
  });

  it("the simulator loop shows the exam structure from the blueprint, in both languages", () => {
    const en = render("/courses/pmp-exam-simulator", () => createElement(SimulatorLoopVisual));
    expect(en).toContain("180 questions in 4 hours");
    const ar = render("/ar/courses/pmp-exam-simulator", () => createElement(SimulatorLoopVisual));
    expect(ar).toContain("180 سؤالاً في 4 ساعات");
  });

  it("the shared landing template shows a mechanism only when asked, in both languages", () => {
    const withMech = render("/ar/services/power-bi-consulting-uae", () => createElement(ServiceLandingContent, { copyKey: "powerBi", mechanism: "powerBi" }));
    expect(withMech).toContain(mechanismCopy.ar.powerBi.heading);
    const withFlow = render("/services/data-analytics-uae", () => createElement(ServiceLandingContent, { copyKey: "dataAnalytics", mechanism: "analytics" }));
    expect(withFlow).toContain(mechanismCopy.en.analytics.heading);
    const bare = render("/services/data-analytics-uae", () => createElement(ServiceLandingContent, { copyKey: "dataAnalytics" }));
    expect(bare).not.toContain(mechanismCopy.en.analytics.heading);
  });

  it("passes the mechanism choice on the real English and Arabic pages", () => {
    for (const base of ["src/app/(en)/(corporate)/services", "src/app/(ar)/ar/(corporate)/services"]) {
      expect(read(`${base}/data-analytics-uae/page.tsx`)).toContain('mechanism="analytics"');
      expect(read(`${base}/power-bi-consulting-uae/page.tsx`)).toContain('mechanism="powerBi"');
    }
    expect(read("src/app/(en)/(corporate)/services/ai-agents-automation-uae/AiAgentsAutomationContent.tsx")).toContain("<AgentFlowSection />");
    expect(read("src/app/(en)/(corporate)/services/machine-learning-uae/MachineLearningContent.tsx")).toContain('<MechanismSection kind="ml" />');
  });
});
