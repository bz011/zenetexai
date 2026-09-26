import fs from "node:fs";
import path from "node:path";

export const APP_DIR = path.resolve(__dirname, "../../src/app");

/** Every URL the app router can serve, derived from the real folder tree (route groups dropped, [param] -> "sample", catch-alls skipped). */
export function collectRoutes(dir: string = APP_DIR, segments: string[] = [], out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory() && (entry.name === "page.tsx" || entry.name === "route.ts")) {
      out.push("/" + segments.join("/"));
      continue;
    }
    if (!entry.isDirectory()) continue;
    const name = entry.name;
    if (name.startsWith("_") || name.startsWith("[...")) continue;
    const isGroup = name.startsWith("(") && name.endsWith(")");
    const isParam = name.startsWith("[") && name.endsWith("]");
    collectRoutes(path.join(dir, name), isGroup ? segments : [...segments, isParam ? "sample" : name], out);
  }
  return out;
}

export function allRoutes(): string[] {
  return [...new Set(collectRoutes())].map((r) => (r === "/" ? "/" : r.replace(/\/$/, "")));
}
