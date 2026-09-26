import type { Config } from "tailwindcss";

/** Colours come from src/styles/tokens.css as "R G B" triples so opacity modifiers work (bg-surface-1/60). */
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const SYSTEM_SANS = [
  "ui-sans-serif",
  "system-ui",
  "-apple-system",
  "Segoe UI",
  "Roboto",
  "Helvetica Neue",
  "Arial",
  "sans-serif",
  "Apple Color Emoji",
  "Segoe UI Emoji",
];

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Semantic tokens (use these in all new and migrated code) ──
        surface: { 0: token("surface-0"), 1: token("surface-1"), 2: token("surface-2") },
        line: { DEFAULT: token("line"), strong: token("line-strong") },
        ink: { DEFAULT: token("ink"), 2: token("ink-2"), 3: token("ink-3") },
        accent: {
          DEFAULT: token("accent"),
          hover: token("accent-hover"),
          fg: token("accent-fg"),
          on: token("on-accent"),
          2: token("accent-2"),
          "2-fg": token("accent-2-fg"),
        },
        positive: token("positive"),
        caution: token("caution"),
        danger: token("danger"),
        background: "var(--bg)",
        foreground: token("ink"),

        // ── Legacy aliases ──
        // Screens that still use raw Tailwind colours (the authenticated
        // Academy app, auth pages, admin) predate the token system. Rather
        // than rewrite ~60 files in one pass, the generic palettes they use
        // are re-pointed at the ZentexAI logo family so the whole product
        // shows one brand colour: `indigo` -> logo blue, `violet` -> logo
        // cyan. New code must NOT use `indigo-*` / `violet-*`; use the
        // semantic tokens above. Remove these aliases once no file uses them.
        indigo: {
          50: "#eff6ff", 100: "#dbeafe", 200: "#bfdbfe", 300: "#93c5fd", 400: "#60a5fa",
          500: "#3b82f6", 600: "#2563eb", 700: "#1d4ed8", 800: "#1e40af", 900: "#1e3a8a", 950: "#172554",
        },
        violet: {
          50: "#ecfeff", 100: "#cffafe", 200: "#a5f3fc", 300: "#67e8f9", 400: "#22d3ee",
          500: "#06b6d4", 600: "#0891b2", 700: "#0e7490", 800: "#155e75", 900: "#164e63", 950: "#083344",
        },
        // Dark-theme text greys that previously failed WCAG AA on the navy
        // page (slate-500 was 4.1:1, slate-600 was 2.6:1). The Academy light
        // theme remaps these classes itself (see globals.css), so this only
        // changes how they read on dark surfaces.
        slate: { 500: "#8b9ab3", 600: "#7d8ca6" },
      },
      fontFamily: {
        sans: SYSTEM_SANS,
        // Manrope (Latin) with Noto Sans Arabic as the per-glyph fallback, so
        // Arabic headings keep the Arabic face and Latin brand words keep Manrope.
        heading: ["var(--font-heading)", "var(--font-arabic)", ...SYSTEM_SANS],
      },
      // Responsive type scale. --type-scale is 1 for Latin and slightly larger
      // for Arabic (see globals.css), which needs more size/leading to read
      // comfortably. Body sizes are for reading text; display/h1-h4 are the one
      // heading scale for the whole site - use these, not ad-hoc text-4xl/[76px].
      fontSize: {
        caption: ["calc(clamp(0.75rem, 0.73rem + 0.1vw, 0.8125rem) * var(--type-scale, 1))", { lineHeight: "1.5" }],
        small: ["calc(clamp(0.875rem, 0.85rem + 0.15vw, 0.9375rem) * var(--type-scale, 1))", { lineHeight: "1.6" }],
        body: ["calc(clamp(0.9375rem, 0.91rem + 0.2vw, 1.0625rem) * var(--type-scale, 1))", { lineHeight: "1.7" }],
        lead: ["calc(clamp(1.0625rem, 1rem + 0.35vw, 1.25rem) * var(--type-scale, 1))", { lineHeight: "1.65" }],
        display: ["calc(clamp(2.5rem, 1.7rem + 3.4vw, 4.25rem) * var(--type-scale, 1))", { lineHeight: "1.05", letterSpacing: "-0.03em", fontWeight: "800" }],
        h1: ["calc(clamp(2.125rem, 1.6rem + 2.2vw, 3.25rem) * var(--type-scale, 1))", { lineHeight: "1.1", letterSpacing: "-0.025em", fontWeight: "800" }],
        h2: ["calc(clamp(1.625rem, 1.35rem + 1.3vw, 2.375rem) * var(--type-scale, 1))", { lineHeight: "1.18", letterSpacing: "-0.02em", fontWeight: "700" }],
        h3: ["calc(clamp(1.125rem, 1.05rem + 0.45vw, 1.375rem) * var(--type-scale, 1))", { lineHeight: "1.3", letterSpacing: "-0.01em", fontWeight: "700" }],
        h4: ["calc(1rem * var(--type-scale, 1))", { lineHeight: "1.4", fontWeight: "700" }],
      },
      borderRadius: {
        card: "var(--radius-card)",
        inner: "var(--radius-inner)",
      },
      boxShadow: {
        elev: "var(--shadow-elev)",
      },
      maxWidth: {
        content: "var(--content-max)",
      },
    },
  },
  plugins: [],
};
export default config;
