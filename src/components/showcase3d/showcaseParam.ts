/**
 * Look-dev selector for the homepage service showcase (art-direction phase).
 * Off unless the URL asks: /?showcase=1 (optionally &scene=agents|data|ml|academy). The
 * default homepage never sees this. All four services exist at this checkpoint.
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
  if (flag !== "1" && flag !== "true") return null;
  const wanted = q.get("scene");
  const found = SHOWCASE_SERVICES.find((s) => s.id === wanted && s.ready);
  return { scene: found ? found.id : "agents" };
}
