// The one letter with no script: whatever Re needs to say, in her own words,
// sent from the Klovers domain.
//
// WHY THIS EXISTS
// ---------------
// Every other template here answers a question the system already knew to ask:
// a seat was booked, a level came out, a payment landed. But a school also has
// to say things nobody wrote a template for — "the level I sent you yesterday
// was wrong, it is Level 1", "Saturday's class moves an hour later", "your
// receipt arrived, thank you". Twice in a single day there was no way to send
// one of those, and the nearest working thing was a personal Gmail account.
// That is the wrong sender: a student who gets school mail from a private
// address has no way to tell it from anyone else pretending to be the school,
// and the reply lands somewhere the school does not read.
//
// So this template sends free text from FROM_EMAIL, through the same path as
// every other letter — which means it is signed by the Klovers domain, it is
// written to email_logs like the rest, and a failure is visible in the same
// place. Nothing about it is special except that the words come from the
// caller instead of from this file.
//
// THE BODY IS TEXT, NOT HTML
// --------------------------
// `body` is escaped before it is rendered. An admin typing an ampersand, a
// price in angle brackets, or an Arabic sentence with a stray `<` must not be
// able to produce broken markup — and must not be able to inject a link or a
// script into a letter that carries the school's name. Blank lines become
// paragraphs and single newlines become line breaks, which is the entirety of
// the formatting available. If rich formatting is ever needed, it belongs in a
// real template, not in a text box.
//
// NO FABRICATED SIGN-OFF, NO INVENTED SUBJECT
// -------------------------------------------
// Both come from the caller. A free-text sender that silently appends its own
// greeting or footer text changes the meaning of what was typed, and the
// person typing is the one accountable for it. The only things added are the
// Klovers wrapper, the signature line, and the unsubscribe footer every
// Klovers letter carries.
import {
  BRAND_DARK, BRAND_MUTED,
  brandWrapper, unsubscribeFooter,
  type EmailPayload,
} from "./common.ts";

/**
 * The two fields this template needs that no other template does.
 *
 * Declared here rather than in common.ts on purpose: that file is 18 KB and is
 * the single import of all 25 existing templates, and the only write path
 * available is a whole-file rewrite — a transcription slip in it breaks every
 * letter Klovers sends. Two optional fields in the one file that reads them
 * costs nothing and risks nothing. Both optional, so a plain `EmailPayload`
 * still satisfies this type; index.ts rejects the call when either is missing.
 */
export type AdminMessagePayload = EmailPayload & {
  /** The subject line, exactly as typed. */
  subject?: string;
  /** The message, as plain text. Escaped before rendering. */
  body?: string;
};

/** Plain text -> safe HTML. Order matters: & first, or the others double-escape. */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Blank line = new paragraph, single newline = line break.
 *
 * \r\n is normalised first: a message pasted from Word or from Windows arrives
 * with carriage returns, and without this every line would end in a stray
 * character and every "blank line" test would fail.
 */
function textToParagraphs(body: string, align: string): string {
  return body
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0)
    .map(
      (block) =>
        `<p style="margin:0 0 16px;color:${BRAND_DARK};font-size:15px;line-height:1.7;text-align:${align};">${
          escapeHtml(block).replace(/\n/g, "<br />")
        }</p>`,
    )
    .join("\n    ");
}

export function buildAdminMessageEmail(payload: AdminMessagePayload): { subject: string; html: string } {
  const isAr = payload.language === "ar";
  const align = isAr ? "right" : "left";
  const subject = (payload.subject || "").trim();
  const paragraphs = textToParagraphs(payload.body || "", align);

  const greeting = isAr ? `أهلاً ${payload.name} 👋` : `Hi ${payload.name} 👋`;
  const signature = isAr ? "ريهام الشرقاوي" : "Reham Elshrkawy";

  const html = `
    <h1 style="color:${BRAND_DARK};font-size:20px;margin:0 0 18px;text-align:${align};">${escapeHtml(greeting)}</h1>
    ${paragraphs}
    <p style="margin:24px 0 0;color:${BRAND_MUTED};font-size:14px;text-align:${align};">${escapeHtml(signature)}</p>
    ${unsubscribeFooter(payload.unsubscribe_token, isAr)}`;

  return { subject, html: brandWrapper(html, isAr) };
}
