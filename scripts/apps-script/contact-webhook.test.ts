import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";

/**
 * Runs the real contact-webhook.gs in a sandbox with in-memory fakes of the
 * Google services it uses (Sheets, MailApp, Lock, Properties, Script triggers),
 * so saving, notifying, retries, concurrency and recovery are tested before
 * the script is pasted into the Apps Script editor.
 */
const SOURCE = readFileSync(path.join(__dirname, "contact-webhook.gs"), "utf8");

const HEADERS = ["Submission ID", "Name", "Email", "Company", "Inquiry Type", "Message", "Submitted At", "Email Status", "Email Sent At"];
const ID = "3f1c2b9e-8d4a-4f6b-9c2e-1a7b5d0e6f42";
const ID2 = "9b2d7c1e-4a3f-4e8b-8c6d-2f1e0a9b8c7d";
const FIELDS = {
  submissionId: ID,
  name: "Jane Tester",
  email: "jane@example.com",
  company: "Acme",
  inquiryType: "business",
  message: "We'd like to discuss an AI agent.",
};

type Verdict = {
  ok: boolean;
  saved: boolean;
  emailed: boolean;
  duplicate: boolean;
  emailStatus: string | null;
  submissionId: string | null;
  error: string | null;
};
type Cell = unknown;
const isDate = (v: unknown) => Object.prototype.toString.call(v) === "[object Date]";

class FakeSheet {
  rows: Cell[][] = [];
  frozen = 0;
  failAppend = false;
  /** "any": every Email Status write fails; "sent": only the write recording success fails. */
  failStatusWrite: null | "any" | "sent" = null;
  constructor(public name: string) {}
  getLastRow() {
    return this.rows.length;
  }
  appendRow(row: Cell[]) {
    if (this.failAppend) throw Object.assign(new Error("Service Spreadsheets failed"), { name: "Exception" });
    this.rows.push([...row]);
  }
  setFrozenRows(n: number) {
    this.frozen = n;
  }
  getRange(a: number | string, col?: number, numRows = 1, numCols = 1) {
    if (typeof a === "string") return { setNumberFormat: () => undefined };
    const sheet = this;
    const row = a;
    const c = col as number;
    const range = {
      getValues: () =>
        Array.from({ length: numRows }, (_, i) => Array.from({ length: numCols }, (_, j) => sheet.rows[row - 1 + i]?.[c - 1 + j] ?? "")),
      getValue: () => sheet.rows[row - 1]?.[c - 1] ?? "",
      setValues: (vals: Cell[][]) => {
        if (c === 8 && (sheet.failStatusWrite === "any" || (sheet.failStatusWrite === "sent" && vals[0][0] === "sent"))) throw Object.assign(new Error("Service Spreadsheets failed"), { name: "Exception" });
        vals.forEach((r, i) => {
          sheet.rows[row - 1 + i] ??= [];
          r.forEach((v, j) => (sheet.rows[row - 1 + i][c - 1 + j] = v));
        });
        return range;
      },
      setFontWeight: () => range,
      createTextFinder: (text: string) => {
        const finder = {
          matchCase: () => finder,
          matchEntireCell: () => finder,
          findNext: () => {
            for (let i = 0; i < numRows; i++) {
              const v = String(sheet.rows[row - 1 + i]?.[c - 1] ?? "");
              if (v.toLowerCase() === text.toLowerCase()) return { getRow: () => row + i };
            }
            return null;
          },
        };
        return finder;
      },
    };
    return range;
  }
}

function makeScript(opts: { existingTabs?: Record<string, Cell[][]> } = {}) {
  const tabs = new Map<string, FakeSheet>();
  for (const [name, rows] of Object.entries(opts.existingTabs ?? {})) {
    const s = new FakeSheet(name);
    s.rows = rows.map((r) => [...r]);
    tabs.set(name, s);
  }
  const outbox: Record<string, string>[] = [];
  const logs: string[] = [];
  const triggers: string[] = [];
  const env = {
    quota: 100,
    sendError: null as null | string,
    lockHeld: false,
    duringSend: null as null | (() => void),
  };

  const ss = {
    getSheetByName: (n: string) => tabs.get(n) ?? null,
    insertSheet: (n: string) => {
      const s = new FakeSheet(n);
      tabs.set(n, s);
      return s;
    },
  };

  const sandbox: Record<string, unknown> = {
    console: { error: (m: string) => logs.push(String(m)), log: (m: string) => logs.push(String(m)) },
    SpreadsheetApp: { getActiveSpreadsheet: () => ss, openById: () => ss, flush: () => undefined },
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => null }) },
    MailApp: {
      getRemainingDailyQuota: () => env.quota,
      sendEmail: (msg: Record<string, string>) => {
        env.duringSend?.();
        if (env.sendError) throw Object.assign(new Error(env.sendError), { name: "Exception" });
        if (env.quota < 1) throw Object.assign(new Error("Service invoked too many times for one day: email."), { name: "Exception" });
        env.quota--;
        outbox.push(msg);
      },
    },
    LockService: {
      getScriptLock: () => {
        let mine = false;
        return {
          tryLock: () => {
            if (env.lockHeld) return false;
            env.lockHeld = mine = true;
            return true;
          },
          releaseLock: () => {
            if (mine) env.lockHeld = mine = false;
          },
        };
      },
    },
    ScriptApp: {
      getProjectTriggers: () => triggers.map((h) => ({ getHandlerFunction: () => h })),
      newTrigger: (h: string) => ({ timeBased: () => ({ everyHours: () => ({ create: () => void triggers.push(h) }) }) }),
    },
    Utilities: { getUuid: () => "00000000-0000-4000-8000-" + String(outbox.length + tabs.size + logs.length).padStart(12, "0") },
    ContentService: {
      MimeType: { JSON: "application/json" },
      createTextOutput: (text: string) => ({ setMimeType: (type: string) => ({ text, type }) }),
    },
  };
  vm.createContext(sandbox);
  vm.runInContext(SOURCE, sandbox);

  const post = (parameter: Record<string, string>): Verdict => {
    const out = (sandbox.doPost as (e: unknown) => { text: string; type: string })({ parameter });
    expect(out.type).toBe("application/json");
    return JSON.parse(out.text) as Verdict;
  };
  const call = (fn: string) => (sandbox[fn] as () => unknown)();
  const sheet = () => tabs.get("Website Enquiries") as FakeSheet;
  const SandboxDate = vm.runInContext("Date", sandbox) as DateConstructor;
  const dataRows = () => sheet().rows.slice(1);
  return { post, call, sheet, dataRows, tabs, outbox, logs, triggers, env, SandboxDate };
}

let s: ReturnType<typeof makeScript>;
beforeEach(() => {
  s = makeScript();
});

describe("the dedicated worksheet", () => {
  it("is created on first use with the expected header and frozen first row", () => {
    s.post(FIELDS);
    expect(s.sheet().rows[0]).toEqual(HEADERS);
    expect(s.sheet().frozen).toBe(1);
  });

  it("stores one row in the documented column order", () => {
    s.post(FIELDS);
    const [row] = s.dataRows();
    expect(row.slice(0, 6)).toEqual([ID, "Jane Tester", "jane@example.com", "Acme", "business", "We'd like to discuss an AI agent."]);
    expect(isDate(row[6])).toBe(true);
    expect(row[7]).toBe("sent");
    expect(isDate(row[8])).toBe(true);
  });

  it("never touches older tabs or their historical rows", () => {
    const history = [["Timestamp", "Name"], ["2026-04-04", "Old enquiry"]];
    s = makeScript({ existingTabs: { Sheet1: history } });
    s.post(FIELDS);
    expect(s.tabs.get("Sheet1")?.rows).toEqual(history);
    expect(s.dataRows()).toHaveLength(1);
  });

  it("refuses to write into a same-named tab with a different header", () => {
    s = makeScript({ existingTabs: { "Website Enquiries": [["Timestamp", "Name", "Email"]] } });
    expect(s.post(FIELDS)).toMatchObject({ ok: false, saved: false, error: "sheet_layout" });
    expect(s.sheet().rows).toHaveLength(1);
    expect(s.outbox).toHaveLength(0);
  });

  it("stores formula-like input as plain text and emails the original text", () => {
    s.post({ ...FIELDS, message: '=IMPORTXML("https://evil.example","//a")', company: "+971 4 000" });
    const [row] = s.dataRows();
    expect(row[5]).toBe(`'=IMPORTXML("https://evil.example","//a")`);
    expect(row[3]).toBe("'+971 4 000");
    expect(s.outbox[0].body).toContain(`\n=IMPORTXML("https://evil.example","//a")\n`);
  });
});

describe("successful delivery", () => {
  it("saves, sends one notification and reports both", () => {
    expect(s.post(FIELDS)).toEqual({
      ok: true,
      saved: true,
      emailed: true,
      duplicate: false,
      emailStatus: "sent",
      submissionId: ID,
      error: null,
    });
    expect(s.outbox).toHaveLength(1);
    const mail = s.outbox[0];
    expect(mail.to).toBe("albadareen011@gmail.com");
    expect(mail.replyTo).toBe("jane@example.com");
    expect(mail.subject).toBe("New ZentexAI enquiry (business) from Jane Tester");
    expect(mail.body).toContain("We'd like to discuss an AI agent.");
    expect(mail.body).toContain(`Submission ID: ${ID}`);
  });

  it("keeps line breaks out of the subject", () => {
    s.post({ ...FIELDS, name: "Jane\r\nBcc: someone@example.com" });
    expect(s.outbox[0].subject).not.toMatch(/[\r\n]/);
  });

  it("normalises the id to lower case so a retry in another case still matches", () => {
    s.post({ ...FIELDS, submissionId: ID.toUpperCase() });
    s.post(FIELDS);
    expect(s.dataRows()).toHaveLength(1);
    expect(s.outbox).toHaveLength(1);
  });

  it("still saves and notifies for a caller that sends no id", () => {
    const { submissionId, ...noId } = FIELDS;
    void submissionId;
    const r = s.post(noId);
    expect(r).toMatchObject({ ok: true, saved: true, emailed: true });
    expect(r.submissionId).toMatch(/^[0-9a-f-]{36}$/);
  });
});

describe("partial failures", () => {
  it("an email failure keeps the row and reports it explicitly", () => {
    s.env.sendError = "Invalid argument";
    expect(s.post(FIELDS)).toMatchObject({ ok: false, saved: true, emailed: false, emailStatus: "failed", error: "email_failed" });
    expect(s.dataRows()[0][7]).toBe("failed");
    expect(s.dataRows()[0][8]).toBe("");
  });

  it("a failed save sends nothing", () => {
    s.post({ ...FIELDS, submissionId: ID2 }); // creates the sheet
    s.sheet().failAppend = true;
    expect(s.post(FIELDS)).toMatchObject({ ok: false, saved: false, emailed: false, error: "save_failed" });
    expect(s.outbox).toHaveLength(1);
  });

  it("if the pre-send status write fails, nothing is sent and the failure is reported", () => {
    s.post({ ...FIELDS, submissionId: ID2 });
    s.sheet().failStatusWrite = "any";
    expect(s.post(FIELDS)).toMatchObject({ submissionId: ID, saved: true, emailed: false, error: "email_failed" });
    expect(s.outbox).toHaveLength(1); // only the first enquiry's
    expect(s.dataRows()[1][7]).toBe("sending"); // left for retry / recovery
  });

  it("if only recording 'sent' fails, it reports sent (the email went out) and the row stays recoverable", () => {
    s.post({ ...FIELDS, submissionId: ID2 });
    s.sheet().failStatusWrite = "sent";
    expect(s.post(FIELDS)).toMatchObject({ ok: true, emailed: true, emailStatus: "sent" });
    expect(s.outbox).toHaveLength(2);
    expect(s.dataRows()[1][7]).toBe("sending");
    expect(s.logs.join("\n")).toContain("sent but status not recorded");
  });
});

describe("email quota", () => {
  it("does not attempt to send when the daily quota is used up", () => {
    s.env.quota = 0;
    expect(s.post(FIELDS)).toMatchObject({ ok: false, saved: true, emailed: false, emailStatus: "quota_exceeded", error: "email_quota" });
    expect(s.outbox).toHaveLength(0);
    expect(s.dataRows()[0][7]).toBe("quota_exceeded");
  });

  it("recognises MailApp's own quota error when the pre-check passed", () => {
    s.env.sendError = "Service invoked too many times for one day: email.";
    expect(s.post(FIELDS)).toMatchObject({ emailStatus: "quota_exceeded", error: "email_quota" });
  });
});

describe("duplicate requests", () => {
  it("a retry after success adds no row, sends nothing and reports a successful duplicate", () => {
    s.post(FIELDS);
    expect(s.post(FIELDS)).toMatchObject({ ok: true, saved: true, emailed: true, duplicate: true, emailStatus: "sent" });
    expect(s.dataRows()).toHaveLength(1);
    expect(s.outbox).toHaveLength(1);
  });

  it("a retry after an email failure re-sends only the email", () => {
    s.env.sendError = "Temporary failure";
    s.post(FIELDS);
    s.env.sendError = null;
    expect(s.post(FIELDS)).toMatchObject({ ok: true, duplicate: true, emailStatus: "sent" });
    expect(s.dataRows()).toHaveLength(1);
    expect(s.outbox).toHaveLength(1);
  });

  it("a retry uses the stored enquiry, not different text sent under the same id", () => {
    s.env.sendError = "Temporary failure";
    s.post(FIELDS);
    s.env.sendError = null;
    s.post({ ...FIELDS, message: "Something else entirely" });
    expect(s.outbox[0].body).toContain("We'd like to discuss an AI agent.");
    expect(s.dataRows()[0][5]).toBe("We'd like to discuss an AI agent.");
  });

  it("different enquiries are stored and notified separately", () => {
    s.post(FIELDS);
    s.post({ ...FIELDS, submissionId: ID2 });
    expect(s.dataRows().map((r) => r[0])).toEqual([ID, ID2]);
    expect(s.outbox).toHaveLength(2);
  });
});

describe("concurrent submissions", () => {
  it("a request arriving while another holds the lock writes nothing and answers busy", () => {
    let concurrent: Verdict | null = null;
    s.env.duringSend = () => {
      s.env.duringSend = null;
      concurrent = s.post(FIELDS); // the visitor's double submit, mid-send
    };
    expect(s.post(FIELDS)).toMatchObject({ ok: true, duplicate: false });
    expect(concurrent).toMatchObject({ ok: false, saved: false, error: "busy" });
    expect(s.dataRows()).toHaveLength(1);
    expect(s.outbox).toHaveLength(1);
    // Once the first finishes, the retry resolves as a duplicate success.
    expect(s.post(FIELDS)).toMatchObject({ ok: true, duplicate: true });
  });

  it("releases the lock after every outcome", () => {
    s.env.sendError = "boom";
    s.post(FIELDS);
    expect(s.env.lockHeld).toBe(false);
    s.env.sendError = null;
    s.post({ ...FIELDS, email: "" });
    expect(s.env.lockHeld).toBe(false);
  });
});

describe("the limits of exactly-once email", () => {
  it("re-sends, marked as a possible repeat, when an earlier execution died mid-send", () => {
    s.post(FIELDS);
    // Simulate an execution that died after MailApp accepted the email but
    // before "sent" was recorded: the row is left in "sending".
    s.dataRows()[0][7] = "sending";
    s.sheet().rows[1][8] = "";
    const r = s.post(FIELDS);
    expect(r).toMatchObject({ ok: true, duplicate: true, emailStatus: "sent" });
    expect(s.outbox).toHaveLength(2);
    expect(s.outbox[1].subject).toMatch(/^\[Possible repeat\] /);
    expect(s.outbox[1].body).toContain("you may receive it twice");
  });

  it("a normal retry is not marked as a repeat", () => {
    s.env.sendError = "Temporary failure";
    s.post(FIELDS);
    s.env.sendError = null;
    s.post(FIELDS);
    expect(s.outbox[0].subject).not.toMatch(/Possible repeat/);
  });
});

describe("recovery trigger", () => {
  it("re-sends recent unsent rows and skips sent ones", () => {
    s.post(FIELDS);
    s.env.sendError = "Temporary failure";
    s.post({ ...FIELDS, submissionId: ID2 });
    s.env.sendError = null;
    expect(s.call("retryUnsentNotifications")).toEqual({ attempted: 1, sent: 1 });
    expect(s.outbox).toHaveLength(2);
    expect(s.dataRows().map((r) => r[7])).toEqual(["sent", "sent"]);
  });

  it("stops at the quota and leaves the rest for the next run", () => {
    s.env.quota = 0;
    s.post(FIELDS);
    s.post({ ...FIELDS, submissionId: ID2 });
    s.env.quota = 1;
    expect(s.call("retryUnsentNotifications")).toEqual({ attempted: 2, sent: 1 });
    expect(s.dataRows().map((r) => r[7])).toEqual(["sent", "quota_exceeded"]);
  });

  it("ignores rows older than seven days", () => {
    s.env.sendError = "Temporary failure";
    s.post(FIELDS);
    s.env.sendError = null;
    s.dataRows()[0][6] = new s.SandboxDate(Date.now() - 8 * 86400000);
    expect(s.call("retryUnsentNotifications")).toEqual({ attempted: 0, sent: 0 });
  });

  it("does nothing while a submission holds the lock", () => {
    s.env.lockHeld = true;
    expect(s.call("retryUnsentNotifications")).toMatchObject({ attempted: 0, skipped: "busy" });
  });

  it("installs its hourly trigger only once", () => {
    s.call("installRetryTrigger");
    s.call("installRetryTrigger");
    expect(s.triggers).toEqual(["retryUnsentNotifications"]);
  });
});

describe("input validation", () => {
  const bad: [string, Record<string, string>][] = [
    ["a missing name", { ...FIELDS, name: "" }],
    ["an invalid email", { ...FIELDS, email: "not-an-email" }],
    ["an unknown inquiry type", { ...FIELDS, inquiryType: "urgent" }],
    ["an empty message", { ...FIELDS, message: "  " }],
    ["an over-long message", { ...FIELDS, message: "x".repeat(5001) }],
    ["an over-long company", { ...FIELDS, company: "x".repeat(161) }],
    ["a malformed submission id", { ...FIELDS, submissionId: "1; DROP TABLE" }],
  ];
  for (const [label, input] of bad) {
    it(`rejects ${label} without writing or sending`, () => {
      expect(s.post(input)).toMatchObject({ ok: false, saved: false, error: "invalid_input" });
      expect(s.tabs.size).toBe(0);
      expect(s.outbox).toHaveLength(0);
    });
  }

  it("defaults a missing inquiry type to general, as the site does", () => {
    const { inquiryType, ...noType } = FIELDS;
    void inquiryType;
    s.post(noType);
    expect(s.dataRows()[0][4]).toBe("general");
  });
});

describe("logging", () => {
  it("never logs the enquirer's details, whatever fails", () => {
    s.env.sendError = `Invalid email: ${FIELDS.email}`;
    s.post(FIELDS);
    s.env.sendError = null;
    s.env.quota = 0;
    s.post({ ...FIELDS, submissionId: ID2 });
    const logged = s.logs.join("\n");
    expect(logged).toContain(ID);
    for (const v of [FIELDS.name, FIELDS.email, FIELDS.company, FIELDS.message]) expect(logged).not.toContain(v);
  });
});
