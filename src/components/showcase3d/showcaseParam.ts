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

/**
 * Below this viewport width, the interactive 3D showcase is not loaded at
 * all - MobileShowcase (a static, lightweight presentation of the same four
 * categories) is shown instead. This was a deliberate product decision after
 * reviewing the real mobile-portrait result on device: the camera framing
 * was technically correct (see fitDistance/contentBounds in
 * mountShowcase.ts/kit.ts) but still didn't meet the bar at narrow widths.
 * 768 matches Tailwind's `md` breakpoint, already used throughout the site
 * for the same "phone vs tablet-and-up" split (e.g. the nav collapses to a
 * hamburger below it), and matches where the 3D composition was separately
 * confirmed to already look complete (tablet width, 768px).
 */
export const SHOWCASE_MIN_WIDTH = 768;

/**
 * Whether ShowcaseGate may attempt to load the 3D showcase, given the
 * environment signals it checks. reducedMotion is handled inside the
 * showcase itself (disables parallax/auto-swipe, keeps static+keyboard/click
 * interaction) rather than here, so it is not part of this gate.
 */
export function shouldLoadShowcase(env: { webgl: boolean; saveData: boolean; width: number }): boolean {
  return env.webgl && !env.saveData && env.width >= SHOWCASE_MIN_WIDTH;
}

/** Where each service's call to action goes: each of these is an existing, public page. Shared by the 3D showcase (ShowcaseHero) and its mobile static replacement (MobileShowcase). */
export const SHOWCASE_CTA_HREF: Record<ShowcaseServiceId, string> = {
  agents: "/services/ai-agents-automation-uae",
  data: "/services/data-analytics-uae",
  ml: "/services/machine-learning-uae",
  academy: "/academy",
};
