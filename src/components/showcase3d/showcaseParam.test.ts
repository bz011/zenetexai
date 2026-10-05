import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import ShowcaseGate from "./ShowcaseGate";
import { resolveShowcaseParams, shouldLoadShowcase, SHOWCASE_MIN_WIDTH, SHOWCASE_SERVICES } from "./showcaseParam";

describe("showcase selector (on by default; ?showcase=0 opts out)", () => {
  it("is on unless explicitly turned off", () => {
    expect(resolveShowcaseParams("")).toEqual({ scene: "agents" });
    expect(resolveShowcaseParams("?core=A")).toEqual({ scene: "agents" });
    expect(resolveShowcaseParams("?showcase=0")).toBeNull();
    expect(resolveShowcaseParams("?showcase=false")).toBeNull();
  });

  it("stays on with the old explicit ?showcase=1 link, for backward compatibility", () => {
    expect(resolveShowcaseParams("?showcase=1")).toEqual({ scene: "agents" });
    expect(resolveShowcaseParams("?showcase=1&scene=data")).toEqual({ scene: "data" });
  });

  it("allows every built scene by default and ignores unknown ones", () => {
    expect(resolveShowcaseParams("?scene=agents")).toEqual({ scene: "agents" });
    expect(resolveShowcaseParams("?scene=data")).toEqual({ scene: "data" });
    expect(resolveShowcaseParams("?scene=ml")).toEqual({ scene: "ml" });
    expect(resolveShowcaseParams("?scene=academy")).toEqual({ scene: "academy" });
    expect(resolveShowcaseParams("?scene=nonsense")).toEqual({ scene: "agents" });
  });

  it("has exactly the four hero services, all ready", () => {
    expect(SHOWCASE_SERVICES.map((s) => s.label)).toEqual(["AI Agents", "Data & Analytics", "Machine Learning", "Academy"]);
    expect(SHOWCASE_SERVICES.filter((s) => s.ready).map((s) => s.id)).toEqual(["agents", "data", "ml", "academy"]);
  });
});

describe("shouldLoadShowcase (ShowcaseGate's load condition)", () => {
  it("requires WebGL", () => {
    expect(shouldLoadShowcase({ webgl: false, saveData: false, width: 1440 })).toBe(false);
  });

  it("respects the browser's Data Saver preference even when WebGL is available", () => {
    expect(shouldLoadShowcase({ webgl: true, saveData: true, width: 1440 })).toBe(false);
  });

  it("loads when WebGL is available, Data Saver is off, and the viewport is at least SHOWCASE_MIN_WIDTH", () => {
    expect(shouldLoadShowcase({ webgl: true, saveData: false, width: 1440 })).toBe(true);
  });

  it("does not load below SHOWCASE_MIN_WIDTH (mobile portrait gets the static MobileShowcase instead)", () => {
    for (const width of [360, 375, 390, 430, SHOWCASE_MIN_WIDTH - 1]) {
      expect(shouldLoadShowcase({ webgl: true, saveData: false, width }), `width ${width}`).toBe(false);
    }
  });

  it("loads at exactly SHOWCASE_MIN_WIDTH and above (tablet/desktop)", () => {
    for (const width of [SHOWCASE_MIN_WIDTH, 1024, 1440]) {
      expect(shouldLoadShowcase({ webgl: true, saveData: false, width }), `width ${width}`).toBe(true);
    }
  });
});

describe("ShowcaseGate", () => {
  it("server-renders the default hero (its children) unchanged", () => {
    const html = renderToString(createElement(ShowcaseGate, { enabled: true, children: createElement("p", null, "default hero") }));
    expect(html).toContain("default hero");
    const off = renderToString(createElement(ShowcaseGate, { enabled: false, children: createElement("p", null, "default hero") }));
    expect(off).toContain("default hero");
  });
});
