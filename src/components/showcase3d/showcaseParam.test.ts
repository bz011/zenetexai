import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import ShowcaseGate from "./ShowcaseGate";
import { resolveShowcaseParams, SHOWCASE_SERVICES } from "./showcaseParam";

describe("showcase look-dev selector (?showcase=1)", () => {
  it("is off unless asked for explicitly", () => {
    expect(resolveShowcaseParams("")).toBeNull();
    expect(resolveShowcaseParams("?core=A")).toBeNull();
    expect(resolveShowcaseParams("?showcase=0")).toBeNull();
    expect(resolveShowcaseParams("?showcase=")).toBeNull();
  });

  it("opens on AI Agents by default, allows every built scene, and ignores unknown ones", () => {
    expect(resolveShowcaseParams("?showcase=1")).toEqual({ scene: "agents" });
    expect(resolveShowcaseParams("?showcase=1&scene=agents")).toEqual({ scene: "agents" });
    expect(resolveShowcaseParams("?showcase=1&scene=data")).toEqual({ scene: "data" });
    expect(resolveShowcaseParams("?showcase=1&scene=ml")).toEqual({ scene: "ml" });
    expect(resolveShowcaseParams("?showcase=1&scene=academy")).toEqual({ scene: "academy" });
    expect(resolveShowcaseParams("?showcase=1&scene=nonsense")).toEqual({ scene: "agents" });
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
