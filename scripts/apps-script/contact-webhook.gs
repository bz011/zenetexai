/**
 * ZentexAI contact-form endpoint (Google Apps Script web app, V8 runtime).
 *
 * CALLER: only the site's /api/contact route, server-side. It POSTs the
 * fields its schema has already validated (src/lib/validators/contactValidators.ts),
 * form-encoded:
 *   webhookSecret shared secret (see AUTHENTICATION)
 *   submissionId  UUID, one per enquiry, reused when the visitor retries
 *   name          1-120 chars
 *   email         valid address, max 254
 *   company       0-160 chars (optional)
 *   inquiryType   business | consultation | training | general
 *   message       1-5000 chars
 *
 * AUTHENTICATION. Apps Script web apps do not expose request headers to
 * doPost, so the shared secret travels in the POST body (never the URL, which
 * Google and proxies may log). It is checked before any spreadsheet or email
 * work, by comparing SHA-256 digests so the comparison takes the same time
 * whatever the input. Script Properties:
 *   CONTACT_WEBHOOK_SECRET  required, at least 32 characters. If it is missing
 *                           or short, every request is rejected (fail closed).
 *   CONTACT_AUTH_MODE       "enforce" (default when unset): a missing or wrong
 *                           secret is rejected.
 *                           "transition": a WRONG secret is still rejected, but
 *                           a request with NO secret is accepted. Only for the
 *                           changeover from a site version that does not send
 *                           one yet; switch to "enforce" once it does.
 * Apps Script always answers HTTP 200, so rejection is the JSON error
 * "unauthorized" (or "not_configured"), with nothing saved or sent.
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
 * Per-submission delivery bookkeeping (attempt count, and whether an email may
 * already have gone out) is kept in Script Properties under "mail:<id>" and
 * removed once "sent" is recorded.
 *
 * REPLY (JSON), checked by /api/contact before the visitor sees success:
 *   { ok, saved, emailed, duplicate, emailStatus, submissionId, error }
 *   ok = saved && emailed, where emailed means "sent AND recorded as sent".
 *   emailStatus adds one reply-only value, "sent_unconfirmed": MailApp
 *   accepted the email but the "sent" status could not be written, so the
 *   outcome is reported as uncertain (ok false, error "status_unrecorded").
 *   error is a short code or null.
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
 * as a possible repeat (the "may already be sent" flag survives a later
 * failure or quota stop, so the eventual re-send is still marked). The only
 * duplicate email therefore comes from that rare crash or bookkeeping window.
 * A notification is never dropped without its row showing failed /
 * quota_exceeded / sending. retryUnsentNotifications() works through those
 * rows, but only once RETRY_ENABLED is "true" in Script Properties: it is
 * OFF by default and the hourly trigger is not installed until approved. "sent" means Google accepted the
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
var RETRY_MAX_ATTEMPTS = 5; // send attempts per row (all sources) after which recovery stops
var MIN_SECRET_LENGTH = 32;

var UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
var INQUIRY_TYPES = ["business", "consultation", "training", "general"];
var LIMITS = { name: 120, email: 254, company: 160, message: 5000 };

// ---------------------------------------------------------------------------
// Web app entry point
// ---------------------------------------------------------------------------

function doPost(e) {
  var params = (e && e.parameter) || {};
  var auth = checkAuth_(params.webhookSecret);
  if (auth !== "ok") {
    console.error("contact: request rejected (" + auth + ")");
    return reply_({ error: auth });
  }
  var input = parseInput_(params);
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
    var statusBefore = null;

    if (duplicate) {
      statusBefore = String(sheet.getRange(row, COL.status).getValue());
      if (statusBefore === STATUS.sent) {
        return reply_({ submissionId: id, saved: true, emailed: true, duplicate: true, emailStatus: STATUS.sent });
      }
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
      result = notify_(sheet, row, statusBefore);
    } catch (err) {
      // e.g. the quota check or a status write threw. The row exists; whatever
      // status it holds (sending/failed) is picked up by retries and recovery.
      console.error("contact: notification step failed id=" + id + " (" + errName_(err) + ")");
      result = { status: STATUS.failed, error: "email_failed" };
    }
    return reply_({
      submissionId: id,
      saved: true,
      emailed: result.status === STATUS.sent, // "sent_unconfirmed" is not confirmed
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

/**
 * Sends notifications for recent rows whose email is not "sent". Does nothing
 * unless the RETRY_ENABLED script property is "true". Per row it skips rows
 * older than RETRY_MAX_AGE_DAYS or with RETRY_MAX_ATTEMPTS attempts already
 * (so a permanently failing row, or one whose status cannot be written, is not
 * re-sent every hour), isolates each row's errors from the rest, and stops at
 * the daily quota.
 */
function retryUnsentNotifications() {
  if (!retryEnabled_()) return { attempted: 0, sent: 0, skipped: "disabled" };
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
      var id = String(values[i][COL.id - 1]);
      var status = String(values[i][COL.status - 1]);
      var submitted = values[i][COL.submittedAt - 1];
      if (!id || status === STATUS.sent) continue;
      if (isDate_(submitted) && submitted.getTime() < cutoff) continue;
      if (readTrack_(id).attempts >= RETRY_MAX_ATTEMPTS) continue;
      attempted++;
      var result;
      try {
        result = notify_(sheet, i + 2, status);
      } catch (err) {
        console.error("contact: recovery failed id=" + id + " (" + errName_(err) + ")");
        continue;
      }
      if (result.status === STATUS.sent) sent++;
      if (result.status === STATUS.quota) break; // nothing more can go out today
    }
    return { attempted: attempted, sent: sent };
  } finally {
    lock.releaseLock();
  }
}

/** Adds the hourly recovery trigger, once. Refuses unless RETRY_ENABLED is "true". */
function installRetryTrigger() {
  if (!retryEnabled_()) throw new Error("Set the RETRY_ENABLED script property to true first");
  var exists = ScriptApp.getProjectTriggers().some(function (t) {
    return t.getHandlerFunction() === "retryUnsentNotifications";
  });
  if (!exists) ScriptApp.newTrigger("retryUnsentNotifications").timeBased().everyHours(1).create();
}

/** Removes the hourly recovery trigger. */
function removeRetryTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === "retryUnsentNotifications") ScriptApp.deleteTrigger(t);
  });
}

/** Run once from the editor to grant permissions and create the sheet. Sends nothing. */
function authorize() {
  MailApp.getRemainingDailyQuota();
  getSheet_();
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

/**
 * Attempts the notification for one row (caller holds the lock) and records
 * the outcome. statusBefore is the row's Email Status before this request, or
 * null for a row this request just created.
 */
function notify_(sheet, row, statusBefore) {
  var values = sheet.getRange(row, 1, 1, HEADERS.length).getValues()[0];
  var id = String(values[COL.id - 1]);
  var track = readTrack_(id);
  // "sending" found by a later execution means an earlier one stopped mid-send.
  var maybeSentBefore = track.maybeSent || statusBefore === STATUS.sending;

  if (MailApp.getRemainingDailyQuota() < 1) {
    setStatus_(sheet, row, STATUS.quota, "");
    if (maybeSentBefore && !track.maybeSent) writeTrack_(id, { attempts: track.attempts, maybeSent: true });
    console.error("contact: email quota exhausted id=" + id);
    return { status: STATUS.quota, error: "email_quota" };
  }

  // Recorded before sending, so a crash between send and "sent" is detectable.
  setStatus_(sheet, row, STATUS.sending, "");
  writeTrack_(id, { attempts: track.attempts + 1, maybeSent: true });
  try {
    MailApp.sendEmail(buildEmail_(values, maybeSentBefore));
  } catch (err) {
    // A thrown send did not go out; only an earlier interruption leaves doubt.
    writeTrack_(id, { attempts: track.attempts + 1, maybeSent: maybeSentBefore });
    var quota = /too many times|quota|limit exceeded/i.test(String(err && err.message));
    setStatus_(sheet, row, quota ? STATUS.quota : STATUS.failed, "");
    console.error("contact: email failed id=" + id + " (" + errName_(err) + (quota ? ", quota" : "") + ")");
    return { status: quota ? STATUS.quota : STATUS.failed, error: quota ? "email_quota" : "email_failed" };
  }
  try {
    setStatus_(sheet, row, STATUS.sent, new Date());
  } catch (err) {
    // MailApp accepted the email, but "sent" is not recorded: the row stays
    // "sending" and the track keeps maybeSent, so any retry re-sends marked as
    // a possible repeat. Reported as uncertain, never as confirmed success.
    console.error("contact: sent but status not recorded id=" + id + " (" + errName_(err) + ")");
    return { status: "sent_unconfirmed", error: "status_unrecorded" };
  }
  clearTrack_(id);
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

/** "ok", "unauthorized" or "not_configured". Never logs or returns the secret. */
function checkAuth_(provided) {
  var props = PropertiesService.getScriptProperties();
  var expected = props.getProperty("CONTACT_WEBHOOK_SECRET") || "";
  if (expected.length < MIN_SECRET_LENGTH) return "not_configured";
  var mode = props.getProperty("CONTACT_AUTH_MODE") === "transition" ? "transition" : "enforce";
  if (provided == null || provided === "") return mode === "transition" ? "ok" : "unauthorized";
  return digestEquals_(String(provided), expected) ? "ok" : "unauthorized";
}

/** Compares SHA-256 digests byte by byte, without an early exit. */
function digestEquals_(a, b) {
  var da = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, a, Utilities.Charset.UTF_8);
  var db = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, b, Utilities.Charset.UTF_8);
  var diff = da.length ^ db.length;
  for (var i = 0; i < da.length && i < db.length; i++) diff |= da[i] ^ db[i];
  return diff === 0;
}

function retryEnabled_() {
  return PropertiesService.getScriptProperties().getProperty("RETRY_ENABLED") === "true";
}

function readTrack_(id) {
  var raw = PropertiesService.getScriptProperties().getProperty("mail:" + id);
  if (!raw) return { attempts: 0, maybeSent: false };
  try {
    var t = JSON.parse(raw);
    return { attempts: Number(t.a) || 0, maybeSent: t.m === true };
  } catch (err) {
    return { attempts: 0, maybeSent: false };
  }
}

function writeTrack_(id, t) {
  PropertiesService.getScriptProperties().setProperty("mail:" + id, JSON.stringify({ a: t.attempts, m: t.maybeSent }));
}

function clearTrack_(id) {
  try {
    PropertiesService.getScriptProperties().deleteProperty("mail:" + id);
  } catch (err) {
    console.error("contact: tracking cleanup failed id=" + id + " (" + errName_(err) + ")");
  }
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
