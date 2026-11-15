/**
 * ZentexAI contact-form endpoint (Google Apps Script web app, V8 runtime).
 *
 * CALLER: only the site's /api/contact route, server-side. It POSTs the
 * fields its schema has already validated (src/lib/validators/contactValidators.ts),
 * form-encoded:
 *   submissionId  UUID, one per enquiry, reused when the visitor retries
 *   name          1-120 chars
 *   email         valid address, max 254
 *   company       0-160 chars (optional)
 *   inquiryType   business | consultation | training | general
 *   message       1-5000 chars
 *
 * STORAGE: a dedicated worksheet, SHEET_NAME, created on first use with the
 * header row below. Older tabs and their rows are never read, changed or
 * deleted. The sheet is the durable record: one row per Submission ID.
 *
 *   A Submission ID | B Name | C Email | D Company | E Inquiry Type |
 *   F Message | G Submitted At | H Email Status | I Email Sent At
 *
 * Email Status: sending | sent | failed | quota_exceeded
 *
 * REPLY (JSON), checked by /api/contact before the visitor sees success:
 *   { ok, saved, emailed, duplicate, emailStatus, submissionId, error }
 *   ok = saved && emailed. error is a short code or null.
 *
 * RETRIES AND CONCURRENCY. Every request runs under one script-wide lock, so
 * two requests (a double submit, a visitor's retry overlapping a slow first
 * attempt, or two different visitors) never interleave. Under the lock:
 *   - an unknown id appends exactly one row, then sends the email;
 *   - a known id never appends again. If its email is already "sent" the
 *     request is answered as a successful duplicate; otherwise the email is
 *     attempted again using the row's stored details.
 *
 * DELIVERY GUARANTEE: at-least-once, never silently lost. Exactly-once email
 * is not achievable here: MailApp has no idempotency key, and an execution can
 * die after Google accepted the email but before "sent" is written. The row is
 * set to "sending" (and flushed) before each attempt, so a later execution that
 * finds "sending" knows the earlier one died mid-attempt. It re-sends, marked
 * as a possible repeat. The only duplicate email therefore comes from that
 * rare crash window. A notification is never dropped without its row showing
 * failed / quota_exceeded / sending, and retryUnsentNotifications() (optional
 * hourly trigger) works through those rows. "sent" means Google accepted the
 * message for delivery, not that it reached the inbox (spam filtering, etc.).
 *
 * LOGGING: submission id and error class only. Never names, emails or messages.
 */

var NOTIFY_TO = "albadareen011@gmail.com";
var SHEET_NAME = "Website Enquiries";
var HEADERS = ["Submission ID", "Name", "Email", "Company", "Inquiry Type", "Message", "Submitted At", "Email Status", "Email Sent At"];
var COL = { id: 1, name: 2, email: 3, company: 4, inquiryType: 5, message: 6, submittedAt: 7, status: 8, sentAt: 9 };
var STATUS = { sending: "sending", sent: "sent", failed: "failed", quota: "quota_exceeded" };

var LOCK_WAIT_MS = 8000; // the site waits 15 s in total
var RETRY_MAX_PER_RUN = 20;
var RETRY_MAX_AGE_DAYS = 7;

var UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
var INQUIRY_TYPES = ["business", "consultation", "training", "general"];
var LIMITS = { name: 120, email: 254, company: 160, message: 5000 };

// ---------------------------------------------------------------------------
// Web app entry point
// ---------------------------------------------------------------------------

function doPost(e) {
  var input = parseInput_((e && e.parameter) || {});
  if (!input) return reply_({ error: "invalid_input" });
  var id = input.submissionId;

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(LOCK_WAIT_MS)) {
    console.error("contact: lock busy id=" + id);
    return reply_({ submissionId: id, error: "busy" });
  }
  try {
    var sheet;
    try {
      sheet = getSheet_();
    } catch (err) {
      console.error("contact: sheet unavailable id=" + id + " (" + errName_(err) + ")");
      return reply_({ submissionId: id, error: errCode_(err, "save_failed") });
    }

    var row = findRow_(sheet, id);
    var duplicate = row !== null;
    var repeatAttempt = false;

    if (duplicate) {
      var status = String(sheet.getRange(row, COL.status).getValue());
      if (status === STATUS.sent) {
        return reply_({ submissionId: id, saved: true, emailed: true, duplicate: true, emailStatus: STATUS.sent });
      }
      // Under the lock, "sending" means an earlier execution died mid-attempt.
      repeatAttempt = status === STATUS.sending;
    } else {
      try {
        sheet.appendRow([
          id,
          safeCell_(input.name),
          safeCell_(input.email),
          safeCell_(input.company),
          input.inquiryType,
          safeCell_(input.message),
          new Date(),
          STATUS.sending,
          "",
        ]);
        SpreadsheetApp.flush();
      } catch (err) {
        console.error("contact: save failed id=" + id + " (" + errName_(err) + ")");
        return reply_({ submissionId: id, error: "save_failed" });
      }
      row = findRow_(sheet, id);
      if (row === null) {
        console.error("contact: saved row not found id=" + id);
        return reply_({ submissionId: id, error: "save_failed" });
      }
    }

    var result;
    try {
      result = notify_(sheet, row, repeatAttempt);
    } catch (err) {
      // e.g. the quota check or a status write threw. The row exists; whatever
      // status it holds (sending/failed) is picked up by retries and recovery.
      console.error("contact: notification step failed id=" + id + " (" + errName_(err) + ")");
      result = { status: STATUS.failed, error: "email_failed" };
    }
    return reply_({
      submissionId: id,
      saved: true,
      emailed: result.status === STATUS.sent,
      duplicate: duplicate,
      emailStatus: result.status,
      error: result.error,
    });
  } finally {
    lock.releaseLock();
  }
}

// ---------------------------------------------------------------------------
// Recovery: re-send notifications that did not go out (optional hourly trigger)
// ---------------------------------------------------------------------------

/** Sends notifications for recent rows whose email is not "sent". Safe to run any time. */
function retryUnsentNotifications() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) return { attempted: 0, sent: 0, skipped: "busy" };
  try {
    var sheet = getSheet_();
    var last = sheet.getLastRow();
    if (last < 2) return { attempted: 0, sent: 0 };
    var values = sheet.getRange(2, 1, last - 1, HEADERS.length).getValues();
    var cutoff = Date.now() - RETRY_MAX_AGE_DAYS * 86400000;
    var attempted = 0;
    var sent = 0;
    for (var i = 0; i < values.length && attempted < RETRY_MAX_PER_RUN; i++) {
      var status = String(values[i][COL.status - 1]);
      var submitted = values[i][COL.submittedAt - 1];
      if (status === STATUS.sent || !values[i][COL.id - 1]) continue;
      if (isDate_(submitted) && submitted.getTime() < cutoff) continue;
      attempted++;
      var result = notify_(sheet, i + 2, status === STATUS.sending);
      if (result.status === STATUS.sent) sent++;
      if (result.status === STATUS.quota) break; // nothing more can go out today
    }
    return { attempted: attempted, sent: sent };
  } finally {
    lock.releaseLock();
  }
}

/** Run once from the editor to add the hourly recovery trigger (no duplicates). */
function installRetryTrigger() {
  var exists = ScriptApp.getProjectTriggers().some(function (t) {
    return t.getHandlerFunction() === "retryUnsentNotifications";
  });
  if (!exists) ScriptApp.newTrigger("retryUnsentNotifications").timeBased().everyHours(1).create();
}

/** Run once from the editor to grant permissions and create the sheet. Sends nothing. */
function authorize() {
  MailApp.getRemainingDailyQuota();
  getSheet_();
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

/** Attempts the notification for one row (caller holds the lock) and records the outcome. */
function notify_(sheet, row, repeatAttempt) {
  var values = sheet.getRange(row, 1, 1, HEADERS.length).getValues()[0];
  var id = String(values[COL.id - 1]);

  if (MailApp.getRemainingDailyQuota() < 1) {
    setStatus_(sheet, row, STATUS.quota, "");
    console.error("contact: email quota exhausted id=" + id);
    return { status: STATUS.quota, error: "email_quota" };
  }

  // Recorded before sending, so a crash between send and "sent" is detectable.
  setStatus_(sheet, row, STATUS.sending, "");
  try {
    MailApp.sendEmail(buildEmail_(values, repeatAttempt));
  } catch (err) {
    var quota = /too many times|quota|limit exceeded/i.test(String(err && err.message));
    setStatus_(sheet, row, quota ? STATUS.quota : STATUS.failed, "");
    console.error("contact: email failed id=" + id + " (" + errName_(err) + (quota ? ", quota" : "") + ")");
    return { status: quota ? STATUS.quota : STATUS.failed, error: quota ? "email_quota" : "email_failed" };
  }
  try {
    setStatus_(sheet, row, STATUS.sent, new Date());
  } catch (err) {
    // The email went out; only the bookkeeping failed. Report it as sent: the
    // row stays "sending", so a later retry may repeat it (at-least-once).
    console.error("contact: sent but status not recorded id=" + id + " (" + errName_(err) + ")");
  }
  return { status: STATUS.sent, error: null };
}

function buildEmail_(v, repeatAttempt) {
  var id = String(v[COL.id - 1]);
  var name = plain_(v[COL.name - 1]);
  var email = plain_(v[COL.email - 1]);
  var type = String(v[COL.inquiryType - 1]);
  var submitted = v[COL.submittedAt - 1];
  var msg = {
    to: NOTIFY_TO,
    name: "ZentexAI website",
    subject: (repeatAttempt ? "[Possible repeat] " : "") + "New ZentexAI enquiry (" + type + ") from " + oneLine_(name, 80),
    body: [
      repeatAttempt ? "Note: an earlier attempt to send this notification was interrupted, so you may receive it twice.\n" : null,
      "A new enquiry was sent from the ZentexAI contact form.",
      "",
      "Name: " + name,
      "Email: " + email,
      "Company: " + (plain_(v[COL.company - 1]) || "-"),
      "Inquiry type: " + type,
      "Submitted at: " + (isDate_(submitted) ? submitted.toISOString() : String(submitted)),
      "",
      "Message:",
      plain_(v[COL.message - 1]),
      "",
      "Reply to this email to answer the sender directly.",
      "Submission ID: " + id,
    ]
      .filter(function (line) { return line !== null; })
      .join("\n"),
  };
  if (EMAIL_RE.test(email)) msg.replyTo = email;
  return msg;
}

/** Returns the dedicated sheet, creating it with its header on first use. */
function getSheet_() {
  var props = PropertiesService.getScriptProperties();
  var spreadsheetId = props.getProperty("SPREADSHEET_ID");
  var ss = spreadsheetId ? SpreadsheetApp.openById(spreadsheetId) : SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error("No spreadsheet: bind the script or set the SPREADSHEET_ID script property");
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight("bold");
    sheet.setFrozenRows(1);
    sheet.getRange("A:A").setNumberFormat("@"); // ids stay plain text
    SpreadsheetApp.flush();
    return sheet;
  }
  var header = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  for (var i = 0; i < HEADERS.length; i++) {
    if (String(header[i]) !== HEADERS[i]) {
      var e = new Error("Unexpected header in " + SHEET_NAME);
      e.code = "sheet_layout";
      throw e;
    }
  }
  return sheet;
}

function findRow_(sheet, id) {
  var last = sheet.getLastRow();
  if (last < 2) return null;
  var cell = sheet.getRange(2, COL.id, last - 1, 1).createTextFinder(id).matchCase(false).matchEntireCell(true).findNext();
  return cell ? cell.getRow() : null;
}

function setStatus_(sheet, row, status, sentAt) {
  sheet.getRange(row, COL.status, 1, 2).setValues([[status, sentAt]]);
  SpreadsheetApp.flush();
}

function parseInput_(p) {
  var f = {
    name: clean_(p.name),
    email: clean_(p.email),
    company: clean_(p.company),
    inquiryType: clean_(p.inquiryType) || "general",
    message: clean_(p.message),
    submissionId: clean_(p.submissionId).toLowerCase(),
  };
  if (!f.name || f.name.length > LIMITS.name) return null;
  if (!EMAIL_RE.test(f.email) || f.email.length > LIMITS.email) return null;
  if (f.company.length > LIMITS.company) return null;
  if (INQUIRY_TYPES.indexOf(f.inquiryType) < 0) return null;
  if (!f.message || f.message.length > LIMITS.message) return null;
  // The site always sends an id. A caller without one still gets its enquiry
  // saved and emailed under a fresh id; it just cannot be de-duplicated.
  if (!f.submissionId) f.submissionId = Utilities.getUuid().toLowerCase();
  if (!UUID_RE.test(f.submissionId)) return null;
  return f;
}

function reply_(r) {
  var saved = r.saved === true;
  var emailed = r.emailed === true;
  var body = {
    ok: saved && emailed,
    saved: saved,
    emailed: emailed,
    duplicate: r.duplicate === true,
    emailStatus: r.emailStatus || null,
    submissionId: r.submissionId || null,
    error: r.error || null,
  };
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);
}

function clean_(value) {
  return String(value == null ? "" : value).trim();
}

function oneLine_(value, max) {
  return String(value).replace(/[\r\n\t]+/g, " ").slice(0, max);
}

/** Stops text such as "=IMPORTXML(...)" being run as a spreadsheet formula. */
function safeCell_(value) {
  var s = String(value == null ? "" : value);
  return /^[=+\-@\t\r]/.test(s) ? "'" + s : s;
}

/** Undoes safeCell_ for the email body (Sheets strips the apostrophe on read anyway). */
function plain_(value) {
  var s = String(value == null ? "" : value);
  return /^'[=+\-@\t\r]/.test(s) ? s.slice(1) : s;
}

function isDate_(value) {
  return Object.prototype.toString.call(value) === "[object Date]";
}

function errName_(err) {
  return (err && err.name) || "Error";
}

function errCode_(err, fallback) {
  return (err && err.code) || fallback;
}
