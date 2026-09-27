/**
 * Look-dev selector for the Intelligence Core (art-direction approval gate).
 * Nothing renders unless the URL asks for it explicitly:
 *   /?core=A   Precision Stack
 *   /?core=B   Aperture Stack
 *   /?core=C   Modular Core
 * Optional: &view=detail for a closer camera. Normal `/` is unaffected.
 */
export type CoreVariant = "A" | "B" | "C";
export type CoreView = "hero" | "detail";

export interface CoreParams {
  variant: CoreVariant;
  view: CoreView;
}

export function resolveCoreParams(search: string): CoreParams | null {
  const q = new URLSearchParams(search);
  const v = (q.get("core") ?? "").toUpperCase();
  if (v !== "A" && v !== "B" && v !== "C") return null;
  return { variant: v, view: q.get("view") === "detail" ? "detail" : "hero" };
}

export const CORE_INPUTS = ["Messages", "Documents", "Project data", "Business data"] as const;
export const CORE_OUTPUTS = ["Actions", "Insights", "Automation", "Decisions"] as const;
