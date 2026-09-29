/**
 * Selector for the homepage service showcase. On by default (optionally
 * &scene=agents|data|ml|academy to open on a specific one) - the default
 * homepage now is this showcase. ?showcase=0 forces the pre-showcase 2D
 * fallback hero, for debugging/emergency use. ?showcase=1 still works, kept
 * for backward compatibility with any existing links. All four services are
 * built and ready.
 */
export type ShowcaseServiceId = "agents" | "data" | "ml" | "academy";

export interface ShowcaseService {
  id: ShowcaseServiceId;
  label: string;
  /** false = shown in the selector but not built yet */
  ready: boolean;
}

export const SHOWCASE_SERVICES: readonly ShowcaseService[] = [
  { id: "agents", label: "AI Agents", ready: true },
  { id: "data", label: "Data & Analytics", ready: true },
  { id: "ml", label: "Machine Learning", ready: true },
  { id: "academy", label: "Academy", ready: true },
];

export interface ShowcaseParams {
  scene: ShowcaseServiceId;
}

export function resolveShowcaseParams(search: string): ShowcaseParams | null {
  const q = new URLSearchParams(search);
  const flag = q.get("showcase");
  if (flag === "0" || flag === "false") return null;
  const wanted = q.get("scene");
  const found = SHOWCASE_SERVICES.find((s) => s.id === wanted && s.ready);
  return { scene: found ? found.id : "agents" };
}
