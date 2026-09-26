#!/usr/bin/env node
/**
 * letter-from-email — recover the exact letter source from a SENT email.
 *
 * WHY THIS EXISTS
 * ---------------
 * On 26 Sep 2026 a corrected attendance letter (v3) was applied by editing
 * send-trial-attendance-letters in the Supabase dashboard, so production runs
 * v3 while the repo still holds v2. The deployed source cannot be read back
 * without a Supabase management token, and git holds no trace of it - the file
 * is byte-identical on every branch, local and remote.
 *
 * But v3 was not only deployed, it was SENT. The 18 September "came" letter
 * reached three real students, so the exact text exists in their inboxes and in
 * Resend's sent log. That is reachable by a human with no tokens, no
 * connectors and no deploy - which makes it the only route to the real v3.
 *
 * This turns that email back into code, so the recovery is mechanical instead
 * of a human retyping Arabic marketing copy and getting one character wrong.
 *
 * HOW IT WORKS
 * ------------
 * The wrapper is unchanged between versions - it is `wrap()` in the function,
 * with the same header bar, the same WhatsApp line and the same unsubscribe
 * footer. So everything OUTSIDE the letter body is a known constant, and
 * stripping it leaves the part that actually changed. The three substitutions
 * the sender made at send time (the student's first name, the unsubscribe
 * token) are put back as `${who}` / `${unsubUrl}`, and the two links back to
 * `${ENROL_URL}` / `${TRIAL_URL}`.
 *
 *   node scripts/letter-from-email.mjs <path-to-saved-email>
 *   node scripts/letter-from-email.mjs <path> --which=came
 *
 * Accepts a saved .eml, or any file containing the raw source as shown by
 * Gmail's "Show original" / Apple Mail's "View Message Source".
 *
 * WHY NOT JUST PASTE THE TEXT
 * ---------------------------
 * Because a wrong character in Arabic copy ships to real students and is not
 * caught by a typecheck. This emits code the caller diffs against the repo
 * file, and the deploy-time drift gate in deploy-functions.yml then refuses to
 * deploy unless the two agree - so a bad recovery is caught before production
 * rather than after.
 */

import { readFileSync } from "node:fs";

const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const which = (process.argv.find((a) => a.startsWith("--which=")) || "").split("=")[1] || "came";

if (args.length !== 1) {
  console.error(
    "Usage: node scripts/letter-from-email.mjs <saved-email> [--which=came|missed]\n\n" +
      "Save the letter as .eml, or copy the raw source (Gmail: Show original) into a file.",
  );
  process.exit(1);
}

const raw = readFileSync(args[0], "utf8");

/** RFC 2047: `=?UTF-8?B?...?=` is base64, `=?UTF-8?Q?...?=` is quoted-printable. */
function decodeHeader(value) {
  if (!value) return "";
  return value
    .replace(/=\?([^?]+)\?([BQ])\?([^?]*)\?=/gi, (_, _charset, kind, body) => {
      if (kind.toUpperCase() === "B") return Buffer.from(body, "base64").toString("utf8");
      return body
        .replace(/_/g, " ")
        .replace(/=([0-9A-F]{2})/gi, (_m, hex) => String.fromCharCode(parseInt(hex, 16)));
    })
    .replace(/\r?\n[ \t]+/g, " ");
}

function header(name) {
  // Unfold before matching: a long header is split across lines.
  const unfolded = raw.replace(/\r?\n[ \t]+/g, " ");
  const m = unfolded.match(new RegExp(`^${name}:\\s*(.*)$`, "im"));
  return decodeHeader(m ? m[1].trim() : "");
}

const subject = header("Subject");
const from = header("From");
const date = header("Date");

/**
 * The body lives in a multipart MIME document, so pick the part by preference:
 * text/html is what the student actually saw, text/plain is the fallback.
 */
function bodyPart(preferred) {
  const re = new RegExp(
    `content-type:\\s*text/${preferred}[^\\r\\n]*\\r?\\n(?:content-transfer-encoding:[^\\r\\n]*\\r?\\n)?\\r?\\n([\\s\\S]*?)(?=\\r?\\n--)`,
    "i",
  );
  const m = raw.match(re);
  if (!m) return null;
  let body = m[1];
  if (/content-transfer-encoding:\s*base64/i.test(m[0])) {
    body = Buffer.from(body.replace(/\s/g, ""), "base64").toString("utf8");
  } else if (/content-transfer-encoding:\s*quoted-printable/i.test(m[0])) {
    body = body.replace(/=([0-9A-F]{2})/gi, (_x, h) => String.fromCharCode(parseInt(h, 16)));
  }
  return body;
}

const html = bodyPart("html");
const text = bodyPart("plain");

if (!html && !text) {
  console.error(
    "Could not find a text/html or text/plain part in that file.\n" +
      "It may be a forwarding wrapper rather than the original message.\n" +
      "Open the ORIGINAL sent letter and save that.",
  );
  process.exit(1);
}

// Language, decided from the SUBJECT and the letter's own opening line only.
//
// Not from the whole message: wrap() is bilingual by design - it carries both
// an Arabic and an English unsubscribe label side by side, and `Any questions?`
// sits next to the Arabic. Testing the raw body for any Arabic character
// therefore reads every English letter as Arabic, which then picks the wrong
// greeting template. The subject is written per-language, so it is the honest
// signal, and the opening line is the fallback for a subject that was not.
const opening = (html || text || "").replace(/<[^>]*>/g, " ").slice(0, 200);
const isAr = /[\u0600-\u06FF]/.test(subject) || /[\u0600-\u06FF]/.test(opening);
const GREETING = isAr ? "مرحباً" : "Hi";

// ── Put the sender's substitutions back ──────────────────────────────────────
// The letter is rendered with the student's own first name and her personal
// unsubscribe token. Both are recoverable from the message, and both are
// parameters in the source, so they go back to being parameters.

const UNSUB_RE = /https?:\/\/[^\s"'<>]*\/unsubscribe\??[^\s"'<>]*/g;
const ENROL_RE = /https?:\/\/[^\s"'<>]*\/enroll-now/g;
const TRIAL_RE = /https?:\/\/[^\s"'<>]*\/trial-booking/g;

const unsubMatches = (html || text || "").match(UNSUB_RE) || [];
const unsub = unsubMatches.length
  ? unsubMatches.sort((a, b) => b.length - a.length)[0]
  : "https://kloversegy.com/unsubscribe";

function restoreLinks(s) {
  return s
    .replace(ENROL_RE, "${ENROL_URL}")
    .replace(TRIAL_RE, "${TRIAL_URL}")
    .split(unsub)
    .join("${unsubUrl}");
}

/**
 * The greeting is `مرحباً <name>،` / `Hi <name>,` - the name is the first
 * parameter and the punctuation after it belongs to the letter, not the name.
 * So only the name token is replaced, and the trailing comma is left alone;
 * an earlier version matched greedily to the next `<` and ate it.
 */
function restoreName(s) {
  return s.replace(
    new RegExp(`(${GREETING}\\s+)([^\\s<،,.]+)`, "g"),
    "$1${who}",
  );
}

// ── Isolate the letter body from the unchanged wrapper ───────────────────────
// wrap() is identical in every version, so these are known constants rather
// than things being guessed at. Anything left between them is the letter.

function stripWrapper(s) {
  if (!s) return s;
  return s
    // the black header bar — markup in the HTML part, bare text in the text part
    .replace(/<p[^>]*>\s*KLovers Academy\s*<\/p>/gi, "")
    .replace(/^\s*KLovers Academy\s*$/gm, "")
    // the WhatsApp line, in whichever form it arrived. The HTML part carries the
    // wa.me URL inside a <p>; the text/plain part carries only the prose. Every
    // prose rule below is anchored to ONE line with [^\n]*, never [^<]*, because
    // a letter's own paragraphs contain no `<` and so a `<`-based rule silently
    // swallows them.
    .replace(/<p[^>]*>[^\n]*wa\.me[^\n]*<\/p>/gi, "")
    .replace(/[^\n]*(?:أي سؤال|Any questions)[^\n]*/g, "")
    // the unsubscribe footer paragraph, then the plain-text form of the same
    .replace(/<p[^>]*>[^\n]*إلغاء الاشتراك[^\n]*<\/p>/gi, "")
    .replace(/<p[^>]*>[^\n]*Unsubscribe[^\n]*<\/p>/gi, "")
    .replace(/[^\n]*(?:إلغاء الاشتراك|Unsubscribe):[^\n]*/g, "")
    .replace(/[^\n]*·\s*KLovers Academy,\s*Egypt[^\n]*/g, "")
    .replace(/[^\n]*KLovers Academy — kloversegy\.com[^\n]*/g, "")
    // the outer table and document chrome, so only the letter's markup is left
    .replace(/<\/?table[^>]*>/gi, "")
    .replace(/<head[\s\S]*?<\/head>/gi, "")
    .replace(/<\/?(html|head|body)[^>]*>/gi, "")
    .replace(/<meta[^>]*>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .join("\n")
    .trim();
}

const letterHtml = stripWrapper(restoreLinks(restoreName(html || "")));
const letterText = stripWrapper(restoreLinks(restoreName(text || "")));

console.log("─".repeat(72));
console.log("Recovered from the sent message");
console.log("─".repeat(72));
console.log(`Subject : ${subject}`);
console.log(`From    : ${from}`);
console.log(`Date    : ${date}`);
console.log(`Language: ${isAr ? "Arabic" : "English"}`);
console.log(`Kind    : ${which}  (override with --which=missed)`);
console.log("─".repeat(72));
console.log("\n--- body html ---\n");
console.log(letterHtml || "(no html part)");
console.log("\n--- body text ---\n");
console.log(letterText || "(no text/plain part)");
console.log("\n" + "─".repeat(72));
console.log(
  "Now diff these against supabase/functions/send-trial-attendance-letters/index.ts\n" +
    "(cameLetter: 144/145/147-151 AR, 157/158/160-164 EN;\n" +
    " missedLetter: 184/185/186-192 AR, 195/196/197-202 EN).\n" +
    "If the wrapper itself changed, say so - this script assumes it did not.",
);
