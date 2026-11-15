/**
 * ZentexAI contact-form endpoint (Google Apps Script web app, V8 runtime).
 *
 * The site's /api/contact route POSTs each validated enquiry here as form
 * fields: name, email, company, inquiryType, message, submissionId.
 *
 * For each NEW submissionId this script
 *   1. appends one row to the enquiries sheet (same columns as before), then
 *   2. emails a notification to NOTIFY_TO with MailApp,
 * and answers with JSON the site checks before telling the visitor it worked:
 *   { "ok": true|false, "saved": true|false, "emailed": true|false,
 *     "duplicate": true|false, "error": null|"<code>" }
 *
 * Retries: the site resends the same submissionId when a visitor tries again.
 * A repeated id never appends a second row. If its row was saved but the
 * email failed, the retry only re-attempts the email. If both already
 * succeeded, it answers success without doing anything. The record of each id
 * lives in CacheService for up to 6 hours (the service's maximum), which
 * comfortably covers a visitor's retries.
 *
 * Logging: only the submission id and an error class are logged, never the
 * enquirer's name, email or message.
 */

var NOTIFY_TO = "albadareen011@gmail.com";
var DEDUPE_TTL_SECONDS = 21600; // 6 hours, the CacheService maximum
var LOCK_WAIT_MS = 10000;
var UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
var INQUIRY_TYPES = ["business", "consultation", "training", "general"];
var LIMITS = { name: 120, email: 254, company: 160, message: 5000 };

/**
 * KEEP YOUR EXISTING SHEET LOOKUP. Replace the body of this function with the
 * exact line(s) your current script uses to get the sheet, so rows keep going
 * to the same place.
 */
function getSheet_() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
}

/**
 * KEEP YOUR EXISTING COLUMNS. Replace this array with exactly the values, in
 * exactly the order, that your current sheet.appendRow([...]) call uses, each
 * wrapped in safeCell_() (it stops text such as "=IMPORTXML(...)" being run
 * as a spreadsheet formula, and changes nothing else).
 */
function buildRow_(f) {
  return [new Date(), safeCell_(f.name), safeCell_(f.email), safeCell_(f.company), safeCell_(f.inquiryType), safeCell_(f.message)];
}

function doPost(e) {
  var p = (e && e.parameter) || {};
  var f = {
    name: clean_(p.name, LIMITS.name),
    email: clean_(p.email, LIMITS.email),
    company: clean_(p.company, LIMITS.company),
    inquiryType: INQUIRY_TYPES.indexOf(String(p.inquiryType)) >= 0 ? String(p.inquiryType) : "general",
    message: clean_(p.message, LIMITS.message),
  };
  if (!f.name || !f.email || !f.message) return reply_(false, false, false, "invalid_input");

  // The site always sends an id. A request without one (an older caller) still
  // works, it just cannot be de-duplicated.
  var id = UUID_RE.test(String(p.submissionId || "")) ? String(p.submissionId).toLowerCase() : Utilities.getUuid();
  var key = "contact:" + id;

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(LOCK_WAIT_MS)) {
    console.error("contact: lock busy id=" + id);
    return reply_(false, false, false, "busy");
  }
  try {
    var cache = CacheService.getScriptCache();
    var state = readState_(cache, key);
    var duplicate = state !== null;

    if (state && state.emailed) return reply_(true, true, true, null, true);

    if (!state) {
      try {
        getSheet_().appendRow(buildRow_(f));
      } catch (err) {
        console.error("contact: save failed id=" + id + " (" + errName_(err) + ")");
        return reply_(false, false, false, "save_failed");
      }
      state = { saved: true, emailed: false };
      cache.put(key, JSON.stringify(state), DEDUPE_TTL_SECONDS);
    }

    try {
      if (MailApp.getRemainingDailyQuota() < 1) {
        console.error("contact: email quota exhausted id=" + id);
        return reply_(false, true, false, "email_quota", duplicate);
      }
      MailApp.sendEmail({
        to: NOTIFY_TO,
        replyTo: f.email,
        name: "ZentexAI website",
        subject: "New ZentexAI enquiry (" + f.inquiryType + ") from " + oneLine_(f.name, 80),
        body: [
          "A new enquiry was sent from the ZentexAI contact form.",
          "",
          "Name: " + f.name,
          "Email: " + f.email,
          "Company: " + (f.company || "-"),
          "Topic: " + f.inquiryType,
          "",
          "Message:",
          f.message,
          "",
          "Reply to this email to answer the sender directly.",
          "Reference: " + id,
        ].join("\n"),
      });
    } catch (err) {
      console.error("contact: email failed id=" + id + " (" + errName_(err) + ")");
      return reply_(false, true, false, "email_failed", duplicate);
    }

    state.emailed = true;
    cache.put(key, JSON.stringify(state), DEDUPE_TTL_SECONDS);
    return reply_(true, true, true, null, duplicate);
  } finally {
    lock.releaseLock();
  }
}

/** Run this once from the editor (Run > authorize) to grant the email permission. */
function authorize() {
  MailApp.getRemainingDailyQuota();
  getSheet_();
}

function reply_(ok, saved, emailed, error, duplicate) {
  return ContentService.createTextOutput(
    JSON.stringify({ ok: ok, saved: saved, emailed: emailed, duplicate: duplicate === true, error: error || null })
  ).setMimeType(ContentService.MimeType.JSON);
}

function readState_(cache, key) {
  var raw = cache.get(key);
  if (!raw) return null;
  try {
    var s = JSON.parse(raw);
    return s && s.saved === true ? { saved: true, emailed: s.emailed === true } : null;
  } catch (err) {
    return null;
  }
}

function clean_(value, max) {
  return String(value == null ? "" : value).trim().slice(0, max);
}

function oneLine_(value, max) {
  return String(value).replace(/[\r\n\t]+/g, " ").slice(0, max);
}

function safeCell_(value) {
  var s = String(value == null ? "" : value);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function errName_(err) {
  return (err && err.name) || "Error";
}
