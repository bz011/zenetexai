import { describe, it, expect } from "vitest";
import { fitDistance } from "./mountShowcase";

/**
 * Regression coverage for the mobile portrait 3D showcase camera framing fix:
 * a single hand-tuned portrait distance (tuned for one guessed phone aspect)
 * either cropped the meaningful composition on narrower phones or, for wide
 * landscape-composed scenes, needed to pull back so far the hero device
 * itself shrank to a sliver. fitDistance() derives the distance from the
 * scene's real measured content bounds and the device's actual aspect ratio,
 * continuously, instead of a per-breakpoint guess.
 */
describe("fitDistance", () => {
  it("returns a larger distance for a narrower (more portrait) aspect ratio, given the same content", () => {
    const wide = fitDistance(5, 5, 24, 1.6, 1);
    const narrow = fitDistance(5, 5, 24, 0.46, 1);
    expect(narrow).toBeGreaterThan(wide);
  });

  it("is driven by whichever axis (horizontal or vertical) needs more room to fit the content", () => {
    // Wide content on a narrow aspect: horizontal FOV is the tight constraint.
    const wideContent = fitDistance(20, 2, 24, 0.46, 1);
    // Tall content on the same narrow aspect: vertical FOV is the tight constraint.
    const tallContent = fitDistance(2, 20, 24, 0.46, 1);
    expect(wideContent).toBeGreaterThan(tallContent);
  });

  it("scales linearly with the margin factor", () => {
    const base = fitDistance(5, 5, 24, 0.46, 1);
    const withMargin = fitDistance(5, 5, 24, 0.46, 1.12);
    expect(withMargin).toBeCloseTo(base * 1.12, 5);
  });

  it("matches a hand-computed example (phone-only bounds at a real 390x844 aspect)", () => {
    // Half-width 2.44 / half-height 5.3 - roughly the AI Agents scene's phone alone.
    const d = fitDistance(2.44, 5.3, 24, 390 / 844, 1.12);
    expect(d).toBeGreaterThan(24);
    expect(d).toBeLessThan(32);
  });

  it("the real AI Agents scene's full card spread needs a distance far beyond any reasonable pullback cap (why PORTRAIT_MAX_PULLBACK exists)", () => {
    // Half-width ~9.64 / half-height ~5.42 - the full left+right card spread, measured from the agents scene.
    const d = fitDistance(9.64, 5.42, 24, 390 / 844, 1.12);
    const heroOnly = fitDistance(2.44, 5.3, 24, 390 / 844, 1.12);
    // Fitting every card would pull back more than 3x further than the hero alone needs -
    // confirms a cap relative to the hero's own distance is necessary, not optional.
    expect(d).toBeGreaterThan(heroOnly * 3);
  });
});
