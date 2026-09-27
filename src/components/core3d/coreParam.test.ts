import { describe, expect, it } from "vitest";
import { resolveCoreParams } from "./coreParam";

describe("look-dev selector (?core=A|B|C)", () => {
  it("is off unless a variant is named explicitly", () => {
    expect(resolveCoreParams("")).toBeNull();
    expect(resolveCoreParams("?flow3d=1")).toBeNull();
    expect(resolveCoreParams("?core=")).toBeNull();
    expect(resolveCoreParams("?core=D")).toBeNull();
    expect(resolveCoreParams("?core=1")).toBeNull();
  });

  it("selects a variant, case-insensitively", () => {
    expect(resolveCoreParams("?core=A")).toEqual({ variant: "A", view: "hero" });
    expect(resolveCoreParams("?core=b")).toEqual({ variant: "B", view: "hero" });
    expect(resolveCoreParams("?x=1&core=C")).toEqual({ variant: "C", view: "hero" });
  });

  it("supports the closer detail camera", () => {
    expect(resolveCoreParams("?core=A&view=detail")).toEqual({ variant: "A", view: "detail" });
    expect(resolveCoreParams("?core=A&view=other")).toEqual({ variant: "A", view: "hero" });
  });
});
