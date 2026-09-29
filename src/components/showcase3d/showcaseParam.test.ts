import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import ShowcaseGate from "./ShowcaseGate";
import { resolveShowcaseParams, SHOWCASE_SERVICES } from "./showcaseParam";

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

describe("ShowcaseGate", () => {
  it("server-renders the default hero (its children) unchanged", () => {
    const html = renderToString(createElement(ShowcaseGate, { enabled: true, children: createElement("p", null, "default hero") }));
    expect(html).toContain("default hero");
    const off = renderToString(createElement(ShowcaseGate, { enabled: false, children: createElement("p", null, "default hero") }));
    expect(off).toContain("default hero");
  });
});
