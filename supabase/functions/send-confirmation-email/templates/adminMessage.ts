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
// the formatting available in `body`.
//
// STRUCTURE, ADDED 14 SEP 2026
// ----------------------------
// The first real use of this template was an invitation to a free trial class
// offering two dates. Written as plain paragraphs it had two defects, and both
// mattered:
//
//   1. The dates — the one thing the reader has to act on — sat in the same
//      grey run of text as everything else.
//   2. The booking URL rendered as escaped TEXT, not a link. In the one letter
//      whose entire purpose is to be clicked, there was nothing to click.
//
// So `highlight`, `cta_url`/`cta_label` and `secondary_url`/`secondary_label`
// were added. They are deliberately NOT a way to pass HTML: `highlight` is
// escaped exactly like `body`, and both URLs are accepted only if they are
// https:// — a `javascript:` or `data:` href in a letter carrying the school's
// name is precisely the thing the escaping above exists to prevent. Anything
// else is dropped silently rather than rendered as a dead button, because a
// button that does nothing is worse than no button.
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
 * The fields this template needs that no other template does.
 *
 * Declared here rather than in common.ts on purpose: that file is 18 KB and is
 * the single import of all 25 existing templates, and the only write path
 * available is a whole-file rewrite — a transcription slip in it breaks every
 * letter Klovers sends. A few optional fields in the one file that reads them
 * costs nothing and risks nothing. All optional, so a plain `EmailPayload`
 * still satisfies this type; index.ts rejects the call when subject or body is
 * missing.
 */
export type AdminMessagePayload = EmailPayload & {
  /** The subject line, exactly as typed. */
  subject?: string;
  /** The message, as plain text. Escaped before rendering. */
  body?: string;
  /**
   * The one thing the reader has to act on — dates, a time, a price — lifted
   * out of the prose into a bordered box. Plain text, escaped like `body`.
   * Omitted entirely when absent; there is no empty box.
   */
  highlight?: string;
  /** Button text. Ignored unless `cta_url` is a usable https:// URL. */
  cta_label?: string;
  /** Button destination. https:// only — anything else is dropped. */
  cta_url?: string;
  /**
   * A second way out, under the button: WhatsApp, usually.
   *
   * Not a second button. A letter with two equal buttons asks the reader to
   * decide how to answer before she has decided whether to answer, and the
   * cheaper route wins by looking easier. This renders as a quiet line of text
   * so the primary action stays primary — but it is a real link, because for
   * a good share of these students WhatsApp is the only channel they will
   * actually use. https:// only, same as `cta_url`.
   */
  secondary_label?: string;
  secondary_url?: string;
  /**
   * Whatever comes AFTER the box and the button — the closing line, the "reply
   * if neither suits you". Without this, `highlight` and the button can only
   * ever land at the very end of the letter, below the sign-off sentence,
   * which reads as an afterthought rather than as the thing being asked for.
   * Plain text, escaped exactly like `body`.
   */
  body_after?: string;
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

/**
 * An https:// URL, or nothing.
 *
 * `new URL()` rather than a regex: a regex that looks right still accepts
 * `https:/\/evil` and similar, and this href goes out under the school's name.
 * A malformed URL throws and is dropped.
 */
function safeHttpsUrl(raw: string | undefined): string | null {
  const candidate = (raw || "").trim();
  if (!candidate) return null;
  try {
    const parsed = new URL(candidate);
    return parsed.protocol === "https:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

/** The bordered box. Returns "" when there is nothing to put in it. */
function highlightBlock(highlight: string | undefined, align: string): string {
  const text = (highlight || "").trim();
  if (!text) return "";
  const lines = escapeHtml(text.replace(/\r\n/g, "\n").replace(/\r/g, "\n"))
    .replace(/\n/g, "<br />");
  return `
    <div style="background:#fffbe6;border:2px solid #FFFF00;border-radius:10px;padding:16px 18px;margin:4px 0 20px;">
      <p style="margin:0;color:${BRAND_DARK};font-size:16px;line-height:2;text-align:${align};font-weight:bold;">${lines}</p>
    </div>`;
}

/** The button. Returns "" unless the URL survived validation. */
function ctaBlock(url: string | null, label: string | undefined, isAr: boolean): string {
  if (!url) return "";
  const text = escapeHtml((label || "").trim() || (isAr ? "احجزي مكانك" : "Book your place"));
  return `
    <div style="text-align:center;margin:8px 0 24px;">
      <a href="${escapeHtml(url)}" style="display:inline-block;background:#FFFF00;color:#000000;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:16px;font-weight:bold;border:2px solid #000000;">${text}</a>
    </div>`;
}

/** The quiet line under the button. Returns "" unless the URL survived validation. */
function secondaryBlock(url: string | null, label: string | undefined, isAr: boolean): string {
  if (!url) return "";
  const text = escapeHtml((label || "").trim() || (isAr ? "أو كلّمنا على واتساب" : "Or message us on WhatsApp"));
  return `
    <p style="text-align:center;margin:0 0 24px;font-size:14px;">
      <a href="${escapeHtml(url)}" style="color:#1a9e4f;text-decoration:underline;font-weight:bold;">${text}</a>
    </p>`;
}

export function buildAdminMessageEmail(payload: AdminMessagePayload): { subject: string; html: string } {
  const isAr = payload.language === "ar";
  const align = isAr ? "right" : "left";
  const subject = (payload.subject || "").trim();
  const paragraphs = textToParagraphs(payload.body || "", align);
  const highlight = highlightBlock(payload.highlight, align);
  const cta = ctaBlock(safeHttpsUrl(payload.cta_url), payload.cta_label, isAr);
  const secondary = secondaryBlock(safeHttpsUrl(payload.secondary_url), payload.secondary_label, isAr);
  const after = textToParagraphs(payload.body_after || "", align);

  const greeting = isAr ? `أهلاً ${payload.name} 👋` : `Hi ${payload.name} 👋`;
  const signature = isAr ? "ريهام الشرقاوي" : "Reham Elshrkawy";

  const html = `
    <h1 style="color:${BRAND_DARK};font-size:20px;margin:0 0 18px;text-align:${align};">${escapeHtml(greeting)}</h1>
    ${paragraphs}${highlight}${cta}${secondary}
    ${after}
    <p style="margin:24px 0 0;color:${BRAND_MUTED};font-size:14px;text-align:${align};">${escapeHtml(signature)}</p>
    ${unsubscribeFooter(payload.unsubscribe_token, isAr)}`;

  return { subject, html: brandWrapper(html, isAr) };
}
