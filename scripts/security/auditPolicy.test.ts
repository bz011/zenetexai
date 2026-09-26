import { describe, expect, it } from "vitest";
import {
  evaluateAudit,
  extractAdvisories,
  parseAcceptedAdvisories,
  type AcceptedAdvisories,
  type RawAuditReport,
} from "./auditPolicy";

function advisory(id: string, name: string, severity: string) {
  return {
    source: 1,
    name,
    title: `${name} issue`,
    url: `https://github.com/advisories/${id}`,
    severity,
  };
}

const ACCEPTED: AcceptedAdvisories = {
  groups: [
    {
      name: "framework",
      reason: "deferred",
      exposure: "prod",
      reviewBy: "2026-12-31",
      advisories: ["GHSA-aaaa-aaaa-aaaa", "GHSA-gone-gone-gone"],
    },
  ],
};

describe("extractAdvisories", () => {
  it("ignores package-name via entries and de-duplicates by advisory id", () => {
    const report: RawAuditReport = {
      vulnerabilities: {
        next: { via: [advisory("GHSA-aaaa-aaaa-aaaa", "next", "high"), "postcss"] },
        postcss: { via: [advisory("GHSA-aaaa-aaaa-aaaa", "next", "high")] },
      },
    };
    expect(extractAdvisories(report).map((a) => a.id)).toEqual(["GHSA-aaaa-aaaa-aaaa"]);
  });

  it("falls back to a numeric id when an advisory has no url", () => {
    const report: RawAuditReport = {
      vulnerabilities: { pkg: { via: [{ source: 42, name: "pkg", severity: "low" }] } },
    };
    expect(extractAdvisories(report)[0]?.id).toBe("npm-42");
  });
});

describe("evaluateAudit", () => {
  it("treats a known accepted advisory as accepted, not new", () => {
    const report: RawAuditReport = {
      vulnerabilities: { next: { via: [advisory("GHSA-aaaa-aaaa-aaaa", "next", "critical")] } },
    };
    const result = evaluateAudit({ report, accepted: ACCEPTED, today: "2026-09-26" });
    expect(result.failing).toHaveLength(0);
    expect(result.newFindings).toHaveLength(0);
    expect(result.accepted[0]?.group).toBe("framework");
  });

  it("fails on a NEW high advisory but only warns on a NEW moderate one", () => {
    const report: RawAuditReport = {
      vulnerabilities: {
        lodash: { via: [advisory("GHSA-new1-new1-new1", "lodash", "high")] },
        left: { via: [advisory("GHSA-new2-new2-new2", "left", "moderate")] },
      },
    };
    const result = evaluateAudit({ report, accepted: ACCEPTED, today: "2026-09-26" });
    expect(result.newFindings).toHaveLength(2);
    expect(result.failing.map((a) => a.id)).toEqual(["GHSA-new1-new1-new1"]);
  });

  it("honours a stricter failAt threshold", () => {
    const report: RawAuditReport = {
      vulnerabilities: { left: { via: [advisory("GHSA-new2-new2-new2", "left", "moderate")] } },
    };
    const result = evaluateAudit({
      report,
      accepted: ACCEPTED,
      today: "2026-09-26",
      failAt: "moderate",
    });
    expect(result.failing).toHaveLength(1);
  });

  it("flags an expired review date only while the group is still reported", () => {
    const report: RawAuditReport = {
      vulnerabilities: { next: { via: [advisory("GHSA-aaaa-aaaa-aaaa", "next", "high")] } },
    };
    const expired = evaluateAudit({ report, accepted: ACCEPTED, today: "2027-01-15" });
    expect(expired.expiredGroups.map((g) => g.name)).toEqual(["framework"]);

    const resolved = evaluateAudit({ report: {}, accepted: ACCEPTED, today: "2027-01-15" });
    expect(resolved.expiredGroups).toHaveLength(0);
  });

  it("reports allowlist entries that are no longer in the audit as stale", () => {
    const report: RawAuditReport = {
      vulnerabilities: { next: { via: [advisory("GHSA-aaaa-aaaa-aaaa", "next", "high")] } },
    };
    const result = evaluateAudit({ report, accepted: ACCEPTED, today: "2026-09-26" });
    expect(result.staleIds).toEqual([{ group: "framework", id: "GHSA-gone-gone-gone" }]);
  });

  it("marks advisories present in the production-only report as production", () => {
    const full: RawAuditReport = {
      vulnerabilities: {
        next: { via: [advisory("GHSA-aaaa-aaaa-aaaa", "next", "high")] },
        vitest: { via: [advisory("GHSA-devv-devv-devv", "vitest", "moderate")] },
      },
    };
    const prod: RawAuditReport = {
      vulnerabilities: { next: { via: [advisory("GHSA-aaaa-aaaa-aaaa", "next", "high")] } },
    };
    const result = evaluateAudit({
      report: full,
      productionReport: prod,
      accepted: ACCEPTED,
      today: "2026-09-26",
    });
    expect(result.productionIds.has("GHSA-aaaa-aaaa-aaaa")).toBe(true);
    expect(result.productionIds.has("GHSA-devv-devv-devv")).toBe(false);
  });
});

describe("parseAcceptedAdvisories", () => {
  it("accepts a well-formed allowlist", () => {
    expect(parseAcceptedAdvisories(ACCEPTED).groups).toHaveLength(1);
  });

  it("rejects a malformed group instead of silently accepting everything", () => {
    expect(() =>
      parseAcceptedAdvisories({ groups: [{ name: "x", reviewBy: "soon", advisories: [] }] }),
    ).toThrow();
    expect(() => parseAcceptedAdvisories({})).toThrow();
  });
});
