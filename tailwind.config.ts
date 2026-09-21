import type { Config } from "tailwindcss";

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
      // Responsive type scale for the public marketing pages. --type-scale is
      // 1 for Latin and slightly larger for Arabic (see globals.css), which
      // needs more size and line height than Latin to read comfortably.
      fontSize: {
        caption: ["calc(clamp(0.75rem, 0.73rem + 0.1vw, 0.8125rem) * var(--type-scale, 1))", { lineHeight: "1.5" }],
        small: ["calc(clamp(0.875rem, 0.85rem + 0.15vw, 0.9375rem) * var(--type-scale, 1))", { lineHeight: "1.6" }],
        body: ["calc(clamp(0.9375rem, 0.91rem + 0.2vw, 1.0625rem) * var(--type-scale, 1))", { lineHeight: "1.7" }],
        lead: ["calc(clamp(1.0625rem, 1rem + 0.35vw, 1.25rem) * var(--type-scale, 1))", { lineHeight: "1.65" }],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [],
};
export default config;
