#!/usr/bin/env node
/**
 * The recovery tool is only worth having if it is exact. This builds an email
 * from a KNOWN letter, runs the recovery over it, and asserts the letter comes
 * back character for character - so a change that quietly drops the Arabic
 * comma, mangles a link, or leaves the wrapper chrome in fails here rather
 * than shipping a half-correct letter to students.
 */
import { test, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const SCRIPT = join(process.cwd(), "scripts", "letter-from-email.mjs");

/** Wrap a letter body exactly the way `wrap()` does in the edge function. */
function render({ subject, name, bodyHtml, bodyText, unsub, link, linkLabel, isAr }) {
  const en = (s) => Buffer.from(s, "utf8").toString("base64").replace(/(.{76})/g, "$1\r\n");
  const wa = isAr ? "أي سؤال؟ راسلينا على واتساب." : "Any questions? Message us on WhatsApp.";
  const unsubLabel = isAr ? "إلغاء الاشتراك" : "Unsubscribe";

  const html =
    `<!DOCTYPE html>\n<html lang="${isAr ? "ar" : "en"}" ${isAr ? 'dir="rtl"' : ""}>\n` +
    `<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>\n` +
    `<body style="margin:0;padding:0;background:#f3f4f6;">\n` +
    `<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 20px;">\n` +
    `<tr><td align="center">\n<table width="600" cellpadding="0" cellspacing="0">\n` +
    `  <tr><td style="background:#000000;padding:24px 40px;text-align:center;">\n` +
    `    <p style="margin:0;color:#FFFF00;">KLovers Academy</p>\n  </td></tr>\n` +
    `  <tr><td style="padding:32px 40px;color:#374151;">\n${bodyHtml}\n` +
    `    <p style="color:#6b7280;">${
      isAr
        ? `أي سؤال؟ <a href="https://wa.me/201010003084">راسلينا على واتساب</a>.`
        : `Any questions? <a href="https://wa.me/201010003084">Message us on WhatsApp</a>.`
    }</p>\n` +
    `    <p style="color:#9ca3af;"><a href="${unsub}">${unsubLabel}</a> · KLovers Academy, Egypt</p>\n` +
    `  </td></tr>\n</table>\n</td></tr></table>\n</body></html>`;

  const text = `${bodyText}\n\n${wa}\n\n${unsubLabel}: ${unsub}\nKLovers Academy — kloversegy.com`;

  return [
    "From: KLovers Academy <noreply@kloversegy.com>",
    "To: student@example.com",
    `Subject: =?UTF-8?B?${Buffer.from(subject, "utf8").toString("base64")}?=`,
    "Date: Thu, 18 Sep 2026 21:04:11 +0300",
    "MIME-Version: 1.0",
    'Content-Type: multipart/alternative; boundary="BOUND"',
    "",
    "--BOUND",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    en(text),
    "--BOUND",
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    en(html),
    "--BOUND--",
    "",
  ].join("\r\n");
}

function recover(eml, args = []) {
  const dir = mkdtempSync(join(tmpdir(), "letter-"));
  const file = join(dir, "letter.eml");
  writeFileSync(file, eml);
  return execFileSync("node", [SCRIPT, file, ...args], { encoding: "utf8" });
}

const AR = {
  isAr: true,
  subject: "KLovers — مكانك في المجموعة",
  name: "مريم",
  unsub: "https://kloversegy.com/unsubscribe?token=abc123DEF456",
  link: "https://kloversegy.com/enroll-now",
  linkLabel: "اختاري مجموعتك",
  greet: "مرحباً",
  comma: "،",
};

const EN = {
  isAr: false,
  subject: "KLovers — your place in the group",
  name: "Mariam",
  unsub: "https://kloversegy.com/unsubscribe?token=abc123DEF456",
  link: "https://kloversegy.com/enroll-now",
  linkLabel: "Choose your group",
  greet: "Hi",
  comma: ",",
};

function letters(cfg) {
  // The punctuation after the name is the letter's, not the name's, and it is
  // language-specific: Arabic uses ، (U+060C), English uses a plain comma.
  // Putting the Arabic one in the English fixture made the fixture itself
  // Arabic, which is a trap worth naming.
  const who = `${cfg.greet} ${cfg.name}${cfg.comma}`;
  return {
    bodyHtml:
      `<h1 style="color:#111827;font-size:22px;">${who}</h1>\n` +
      `    <p style="margin:0 0 6px;">${cfg.lead}</p>\n` +
      `    <p style="margin:0;">${cfg.body}</p>\n` +
      `    <div style="margin:24px 0;text-align:center;">\n` +
      `      <a href="${cfg.link}">${cfg.linkLabel}</a>\n` +
      `    </div>\n` +
      `    <p style="margin:0;">${cfg.tail}</p>`,
    bodyText: `${who}\n\n${cfg.lead}\n\n${cfg.body}:\n${cfg.link}\n\n${cfg.tail}`,
  };
}

const AR_LETTER = letters({
  ...AR,
  lead: "مبسوطين إنك كنتِ معانا في الكلاس.",
  body: "التسجيل مفتوح — اختاري مستواكِ والموعد المناسب",
  tail: "المقعد يُحجز باسمك من وقت التسجيل، والدفع بعد بداية المجموعة.",
});

const EN_LETTER = letters({
  ...EN,
  lead: "It was good to have you in the class.",
  body: "Enrolment is open — choose your level and a time that suits you",
  tail: "Your seat is held from the moment you enrol, and payment comes after the group starts.",
});

test("recovers the Arabic came letter, name and links turned back into parameters", () => {
  const out = recover(render({ ...AR, ...AR_LETTER }));

  expect(out).toContain("Subject : KLovers — مكانك في المجموعة");
  expect(out).toContain("Language: Arabic");

  // The name becomes ${who} and the Arabic comma after it SURVIVES - an
  // earlier version matched to the next `<` and ate it.
  expect(out).toContain('مرحباً ${who}،');

  // The body copy comes back verbatim, punctuation and all.
  expect(out).toContain("مبسوطين إنك كنتِ معانا في الكلاس.");
  expect(out).toContain("التسجيل مفتوح — اختاري مستواكِ والموعد المناسب");
  expect(out).toContain("المقعد يُحجز باسمك من وقت التسجيل، والدفع بعد بداية المجموعة.");

  // Links are parameters again, not one student's URLs.
  expect(out).toContain('href="${ENROL_URL}"');
  expect(out).toContain("اختاري مجموعتك");
});

test("recovers the English came letter", () => {
  const out = recover(render({ ...EN, ...EN_LETTER }));

  expect(out).toContain("Subject : KLovers — your place in the group");
  expect(out).toContain("Language: English");
  expect(out).toContain("Hi ${who},");
  expect(out).toContain("It was good to have you in the class.");
  expect(out).toContain("Enrolment is open — choose your level and a time that suits you");
  expect(out).toContain('href="${ENROL_URL}"');
  expect(out).toContain("Choose your group");
});

test("strips the unchanged wrapper and the personal unsubscribe token", () => {
  const out = recover(render({ ...AR, ...AR_LETTER }));

  // The header bar, the WhatsApp line and the footer are `wrap()` constants,
  // not the letter, so they must not come back as if they had changed.
  expect(out).not.toContain("KLovers Academy</p>");
  expect(out).not.toContain("راسلينا على واتساب");
  expect(out).not.toContain("abc123DEF456");
  expect(out).not.toContain("wa.me");
});

test("refuses a file that is not an email", () => {
  expect(() => recover("this is just a note to self, not a message")).toThrow();
});
