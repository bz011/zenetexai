import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {
  evaluateAudit,
  parseAcceptedAdvisories,
  type AuditAdvisory,
  type RawAuditReport,
} from "./auditPolicy";

const ACCEPTED_FILE = path.resolve(__dirname, "../../security/accepted-advisories.json");

function runNpmAudit(extraArgs: string[]): RawAuditReport {
  const result = spawnSync("npm", ["audit", "--json", ...extraArgs], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  let parsed: (RawAuditReport & { error?: { summary?: string } }) | undefined;
  try {
    parsed = JSON.parse(result.stdout);
  } catch {
    parsed = undefined;
  }
  // npm exits non-zero whenever vulnerabilities exist, so the exit code is not
  // a failure signal - only an unparsable or error-shaped report is.
  if (!parsed || parsed.error || !parsed.vulnerabilities) {
    throw new Error(
      `npm audit did not produce a usable report: ${parsed?.error?.summary ?? result.stderr.slice(0, 300)}`,
    );
  }
  return parsed;
}

function row(a: AuditAdvisory, scope: string, extra = ""): string {
  return `| ${a.severity} | ${a.pkg} | ${a.id} | ${scope} | ${a.title.replace(/\|/g, "/")}${extra} |`;
}

function main(): number {
  const accepted = parseAcceptedAdvisories(JSON.parse(fs.readFileSync(ACCEPTED_FILE, "utf8")));
  const report = runNpmAudit([]);
  const productionReport = runNpmAudit(["--omit=dev"]);
  const today = new Date().toISOString().slice(0, 10);
  const result = evaluateAudit({ report, productionReport, accepted, today, failAt: "high" });

  const scopeOf = (a: AuditAdvisory) => (result.productionIds.has(a.id) ? "production" : "dev-only");
  const lines: string[] = ["## Dependency security audit", ""];

  lines.push(`**New (not in accepted list): ${result.newFindings.length}** (failing: ${result.failing.length})`);
  lines.push(`**Known and accepted/deferred: ${result.accepted.length}**`, "");

  if (result.newFindings.length > 0) {
    lines.push("### New findings", "", "| Severity | Package | Advisory | Scope | Title |", "|---|---|---|---|---|");
    for (const a of result.newFindings) lines.push(row(a, scopeOf(a)));
    lines.push("");
  }

  lines.push("### Accepted / deferred findings", "", "| Severity | Package | Advisory | Scope | Title |", "|---|---|---|---|---|");
  for (const a of result.accepted) lines.push(row(a, scopeOf(a), ` _(${a.group})_`));
  lines.push("");

  for (const group of result.expiredGroups) {
    lines.push(`> Review overdue: accepted group **${group.name}** passed its review date (${group.reviewBy}).`);
  }
  for (const stale of result.staleIds) {
    lines.push(`> ${stale.id} (${stale.group}) is no longer reported - remove it from security/accepted-advisories.json.`);
  }

  const summary = lines.join("\n");
  console.log(summary);
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${summary}\n`);

  for (const a of result.failing) {
    console.log(`::error title=New ${a.severity} dependency vulnerability::${a.pkg} ${a.id} - ${a.title}`);
  }
  for (const a of result.newFindings.filter((n) => !result.failing.includes(n))) {
    console.log(`::warning title=New ${a.severity} dependency vulnerability::${a.pkg} ${a.id} - ${a.title}`);
  }
  for (const group of result.expiredGroups) {
    console.log(`::warning title=Accepted advisories need review::${group.name} review date ${group.reviewBy} has passed`);
  }

  return result.failing.length > 0 ? 1 : 0;
}

try {
  process.exit(main());
} catch (error) {
  console.error(`::error title=Dependency audit could not run::${(error as Error).message}`);
  process.exit(2);
}
