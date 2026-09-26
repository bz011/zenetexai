export type Severity = "info" | "low" | "moderate" | "high" | "critical";

const SEVERITY_RANK: Record<Severity, number> = {
  info: 0,
  low: 1,
  moderate: 2,
  high: 3,
  critical: 4,
};

export interface AuditAdvisory {
  id: string;
  pkg: string;
  severity: Severity;
  title: string;
  url: string;
}

export interface AcceptedGroup {
  name: string;
  reason: string;
  exposure: string;
  reviewBy: string;
  advisories: string[];
}

export interface AcceptedAdvisories {
  groups: AcceptedGroup[];
}

interface RawVia {
  source?: number | string;
  name?: string;
  title?: string;
  url?: string;
  severity?: string;
}

export interface RawAuditReport {
  vulnerabilities?: Record<string, { via?: Array<string | RawVia> }>;
}

export interface AuditEvaluation {
  newFindings: AuditAdvisory[];
  failing: AuditAdvisory[];
  accepted: Array<AuditAdvisory & { group: string }>;
  expiredGroups: AcceptedGroup[];
  staleIds: Array<{ group: string; id: string }>;
  productionIds: Set<string>;
}

function isSeverity(value: unknown): value is Severity {
  return typeof value === "string" && value in SEVERITY_RANK;
}

export function severityAtLeast(severity: Severity, threshold: Severity): boolean {
  return SEVERITY_RANK[severity] >= SEVERITY_RANK[threshold];
}

export function extractAdvisories(report: RawAuditReport): AuditAdvisory[] {
  const byId = new Map<string, AuditAdvisory>();
  for (const [pkgName, vuln] of Object.entries(report.vulnerabilities ?? {})) {
    for (const via of vuln.via ?? []) {
      if (typeof via === "string") continue;
      const url = via.url ?? "";
      const id = url.split("/").pop() || `npm-${via.source ?? pkgName}`;
      if (byId.has(id)) continue;
      byId.set(id, {
        id,
        pkg: via.name ?? pkgName,
        severity: isSeverity(via.severity) ? via.severity : "moderate",
        title: via.title ?? "(no title)",
        url,
      });
    }
  }
  return [...byId.values()];
}

export function parseAcceptedAdvisories(raw: unknown): AcceptedAdvisories {
  const groups = (raw as { groups?: unknown })?.groups;
  if (!Array.isArray(groups)) {
    throw new Error("accepted-advisories.json must contain a `groups` array");
  }
  for (const group of groups as AcceptedGroup[]) {
    const valid =
      typeof group?.name === "string" &&
      typeof group.reason === "string" &&
      typeof group.exposure === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(group.reviewBy) &&
      Array.isArray(group.advisories) &&
      group.advisories.every((id) => typeof id === "string");
    if (!valid) {
      throw new Error(
        `Invalid accepted-advisories group: ${JSON.stringify(group)?.slice(0, 120)}`,
      );
    }
  }
  return { groups: groups as AcceptedGroup[] };
}

export function evaluateAudit(opts: {
  report: RawAuditReport;
  productionReport?: RawAuditReport;
  accepted: AcceptedAdvisories;
  today: string;
  failAt?: Severity;
}): AuditEvaluation {
  const failAt = opts.failAt ?? "high";
  const advisories = extractAdvisories(opts.report);
  const productionIds = new Set(
    extractAdvisories(opts.productionReport ?? {}).map((a) => a.id),
  );

  const groupById = new Map<string, AcceptedGroup>();
  for (const group of opts.accepted.groups) {
    for (const id of group.advisories) groupById.set(id, group);
  }

  const newFindings: AuditAdvisory[] = [];
  const accepted: AuditEvaluation["accepted"] = [];
  const reportedIds = new Set<string>();
  for (const advisory of advisories) {
    reportedIds.add(advisory.id);
    const group = groupById.get(advisory.id);
    if (group) accepted.push({ ...advisory, group: group.name });
    else newFindings.push(advisory);
  }

  const activeGroupNames = new Set(accepted.map((a) => a.group));
  const expiredGroups = opts.accepted.groups.filter(
    (g) => g.reviewBy < opts.today && activeGroupNames.has(g.name),
  );
  const staleIds = opts.accepted.groups.flatMap((g) =>
    g.advisories.filter((id) => !reportedIds.has(id)).map((id) => ({ group: g.name, id })),
  );

  return {
    newFindings,
    failing: newFindings.filter((a) => severityAtLeast(a.severity, failAt)),
    accepted,
    expiredGroups,
    staleIds,
    productionIds,
  };
}
