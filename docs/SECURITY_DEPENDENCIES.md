# Dependency security

State of dependency-vulnerability handling for ZentexAI, what is monitored
automatically, and what is knowingly deferred. Last reviewed: 2026-09-26.

Stack constraints that shape everything below: **Next.js 14.2.35, React 18.3.1,
@react-three/fiber 8, @react-three/drei 9**. None of these are upgraded by the
routine dependency-patch process.

## Automated monitoring

| Mechanism | What it does |
|---|---|
| `.github/dependabot.yml` | Weekly (Mon 06:00 Dubai) grouped PRs for npm minor/patch updates and GitHub Actions. Majors are ignored for routine updates; Next/React minors and `three` minors (0.x = breaking) are held back. Nothing auto-merges. |
| `.github/workflows/dependency-security.yml` | Runs `npm ci --ignore-scripts` then `npm run audit:ci` on PRs/pushes touching the lockfile, on pushes to `main`/`alpha-platform`, weekly, and on demand. |
| `scripts/security/auditCheck.ts` + `security/accepted-advisories.json` | Compares `npm audit` to the accepted list. **Fails only on NEW high/critical advisories.** New moderate/low become warnings. Every finding is listed in the job summary, labelled `production` or `dev-only`, so accepted items are visible, never hidden. |

Recommended one-time GitHub repo settings (UI only, not done by code):
enable **Dependabot alerts** and **Dependabot security updates**.

### When the audit job goes red or warns

1. Read the job summary; note whether the finding is `production` or `dev-only`.
2. Fix it (patch bump, override, or replacement), or
3. Accept it explicitly: add its GHSA id to a group in
   `security/accepted-advisories.json` with a reason, honest exposure
   statement, and a `reviewBy` date. Groups past `reviewBy` produce a warning
   while any of their advisories are still reported. IDs that no longer appear
   are reported as stale and should be removed.

## Current status (after the 2026-09-26 remediation)

10 vulnerable packages reduced to 4 (26 unique advisories, all accepted below).
Production-only audit: **1 package (next)**.

Fixed without touching the framework line:

- `nanoid` 3.3.11 to 3.3.19, `postcss-selector-parser` 6.1.2 to 6.1.4, root
  `postcss` 8.5.8 to 8.5.28 (in-range updates).
- Next's pinned nested `postcss@8.4.31` replaced via
  `overrides: { next: { postcss: "^8.5.23" } }`. Verified in an isolated build:
  production build passes and all built CSS is byte-identical to the baseline.
- `xlsx` moved to `devDependencies`.
- `vitest` 2.1.9 to 3.2.7 (pulls vite 7.3.6): clears the critical Vitest UI,
  vite, esbuild and vite-node advisories. Production dependency set unchanged
  (267 packages, 0 differences).

## Deferred items

### Framework Security Migration (Next.js 14 to a patched line)

**Why it remains:** every Next.js advisory's patched version is on 15.5.x or
16.x; 14.2.35 is the final 14.x release, so no in-line fix exists. The official
Next 15 upgrade guide sets the minimum React to 19 for the App Router, and
@react-three/fiber 8 / drei 9 require React below 19.

**Why it is a separate sprint:** it changes, at once,

- React 18 to 19 and Next 14 to 15.5.x (or 16, Node >= 20.9),
- Server Actions (17 `"use server"` files) and async request APIs,
- `src/middleware.ts` (Supabase session gate, i18n routing),
- Supabase SSR auth/cookie behaviour,
- the Ziina payment/checkout flow,
- the 3D stack: R3F 8 to 9 and Drei 9 to 10 (React 19),
- full application regression testing.

**Exposure until then (assumes Vercel hosting, not verified):** realistic
exposure is denial-of-service / information-disclosure class on the App Router
with Server Actions (e.g. GHSA-m99w, GHSA-h25m, GHSA-955p). Advisories for
Windows-hosted RCE, the image optimizer (AVIF RCE), WebSocket upgrades,
rewrites, Pages Router i18n, CSP nonces and `next/script` do not apply to this
app's configuration (App Router only, no rewrites/i18n/`next/image` use, no
custom server, `sharp` not installed). Server Actions should keep
authenticating inside each action, never relying on the page around them.

**Tracked by:** the `framework-security-migration` group in
`security/accepted-advisories.json` (review by 2026-12-31).

### Vitest >= 4.1.11

Clears the last dev-only advisory (`@vitest/mocker`, moderate). Blocked: npm
10.9.3 crashes resolving Vitest >= 4.1.0 (Arborist `#loadPeerSet`), and newer
npm resolves it only via Vite 8 (Rolldown), which would also need the
`esbuild` option in `vitest.config.ts` migrated. Revisit with a newer npm/Vite.

### xlsx (no npm fix)

`xlsx` 0.18.5 is the last release on the npm registry; fixes (0.19.3 /
0.20.2+) ship only from cdn.sheetjs.com. It is a `devDependency`, read only by
the local question-bank CLI on a trusted team-authored workbook, and is
tree-shaken out of the production build; no upload path exists.
Note: a static import chain exists (`src` to `scripts/question-generation/
reviseQuestion` to `question-bank/validate` to `readWorkbook` to `xlsx`)
that only reaches the in-memory `validateWorkbookData`; keep it that way, or
break the chain (lazy-import `readWorkbook`) before ever passing a
user-supplied file to it. Options later: SheetJS CDN tarball >= 0.20.2
(use `XLSX.read(fs.readFileSync(p))`), ExcelJS, or CSV exports.

### three / R3F / Drei notes (no security impact today)

- `three-mesh-bvh@0.7.8` (via drei 9.122.0) is flagged deprecated for
  three.js incompatibility (use 0.8.x); no security advisory. drei pins
  `^0.7.8`, so fixing needs an override. Do it only if drei's `<Bvh>` /
  raycast acceleration is actually used, then test.
- drei's `stats-gl` pulls a second `three@0.170.0`. Only matters if drei's
  `<Stats>` is used; otherwise ignore.
- No application code imports motion/three/R3F/drei yet.

## npm overrides gotcha

Adding an `overrides` entry does not re-resolve an already-locked nested
package (npm 10.9.3). To apply or change one: add the override, delete the
nested `node_modules/<pkg>/node_modules/<dep>` entry from `package-lock.json`,
remove that directory, and run `npm install`. Confirm with `npm ls <dep>`.
