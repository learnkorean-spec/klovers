// The payment letter for a private student's bundle.
//
// Every other payment template in this folder is built on `enrollments` — the
// group path. A private student has no enrolment row, so until this existed
// there was no letter in the system that could tell her what she owed. Re
// wrote it out by hand each time, or did not write it.
//
// What the letter has to carry, in Re's words (18 September 2026): "the amount
// must be paid and the payment information and the availability to upload her
// receipt so i confirm when i see it" — and then: "tell her that she finished
// how many and which left must be clear".
//
// So the three facts, in this order:
//   1. which classes have been taught, by date;
//   2. how many are left;
//   3. the amount, how to pay it, and where to put the receipt.
//
// Every one of them comes from the bundle's own counted sessions. Nothing here
// is typed by a person, which is the point: the last version of this letter was
// a message Re composed from memory while looking at a card.
//
// Standing rules 1–5 decide the words. It opens with the summary, not with a
// demand and not with an apology; the facts are stated plainly; there is one
// button; WhatsApp sits above the signature as a link rather than a second
// button. It never says "overdue", never counts days, and never mentions the
// classes that did not happen — those cost her nothing and naming them only
// invites an argument about a date.

import type { EmailPayload } from "./common.ts";
import {
  BRAND_DARK, BRAND_MUTED,
  unsubscribeFooter, brandWrapper, brandButton,
} from "./common.ts";

const DASHBOARD_URL = "https://kloversegy.com/dashboard";
const WA_URL = "https://wa.me/201010003084";
const PAY_NUMBER = "01010003084";

/** The extra fields this template reads, none of which are in EmailPayload. */
interface BundlePaymentFields {
  amount?: number | string | null;
  currency?: string | null;
  total_classes?: number | null;
  remaining_classes?: number | null;
  /** "YYYY-MM-DD", each a counted class, oldest first. */
  done_dates?: string[] | null;
}

/**
 * "2026-09-18" -> "الجمعة 18 سبتمبر" / "Fri 18 Sep".
 *
 * Parsed as a plain date in UTC, never as a local instant: a session_date is a
 * calendar day, and reading it on the server's clock is how a Monday class
 * becomes a Sunday one in a letter.
 */
function formatDay(iso: string, isAr: boolean): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(
    isAr ? "ar-EG-u-nu-latn" : "en-GB",
    { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" },
  );
}

function listDays(dates: string[], isAr: boolean): string {
  return dates
    .map(d => `<li style="margin-bottom: 4px;">${formatDay(d, isAr)}</li>`)
    .join("");
}

// Rule 2: WhatsApp in the body, above the signature, as a link and not a
// second button — the letter has one action and it is the receipt.
function whatsappLine(isAr: boolean): string {
  return `
    <p style="color: ${BRAND_MUTED}; font-size: 14px;">${
      isAr
        ? `أي سؤال؟ <a href="${WA_URL}" style="color: #25D366; text-decoration: underline;">راسلينا على واتساب</a>.`
        : `Any questions? <a href="${WA_URL}" style="color: #25D366; text-decoration: underline;">Message us on WhatsApp</a>.`
    }</p>`;
}

export function buildPrivateBundlePaymentEmail(p: EmailPayload) {
  const isAr = p.language === "ar";
  const f = p as unknown as BundlePaymentFields;

  const done = Array.isArray(f.done_dates) ? f.done_dates.filter(Boolean) : [];
  const remaining = Math.max(0, Number(f.remaining_classes ?? 0));
  const total = Number(f.total_classes ?? done.length + remaining);
  const currency = (f.currency || "EGP").toUpperCase();
  // Kept as sent. A price is not a place to be clever with formatting: the
  // number in the letter has to be the number on the card.
  const amount = String(f.amount ?? "").trim();

  if (isAr) {
    return {
      subject: "باقتك في Klovers — حصصك والمتبقي",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 22px;">مرحبًا ${p.name}،</h1>
        <p>ده ملخص باقتك الحالية (${total} حصص):</p>

        <p style="margin-bottom: 4px;"><strong>اللي اتعمل — ${done.length} ${done.length === 1 ? "حصة" : "حصص"}</strong></p>
        ${done.length
          ? `<ul style="margin-top: 0; padding-inline-start: 20px;">${listDays(done, true)}</ul>`
          : `<p style="color: ${BRAND_MUTED};">لسه مافيش حصص محسوبة.</p>`}

        <p style="margin-bottom: 4px;"><strong>الباقي — ${remaining} ${remaining === 1 ? "حصة" : "حصص"}</strong></p>

        <p><strong>المبلغ:</strong> ${amount} ${currency} للباقة كاملة.</p>

        <p style="margin-bottom: 4px;"><strong>طريقة الدفع</strong></p>
        <p>فودافون كاش أو فوري على <strong dir="ltr">${PAY_NUMBER}</strong>. لو تفضّلي تحويل بنكي، ابعتيلي على واتساب وأبعتلك البيانات.</p>

        <p><strong>بعد التحويل</strong> ادخلي صفحتك وارفعي صورة الإيصال، وهأكّد استلام المبلغ أول ما أشوفه.</p>

        <div style="margin: 24px 0; text-align: center;">
          ${brandButton("ارفعي صورة الإيصال", DASHBOARD_URL)}
        </div>

        ${whatsappLine(true)}
        ${unsubscribeFooter(p.unsubscribe_token, true)}
      `, true),
    };
  }

  return {
    subject: "Your Klovers package — classes and balance",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Hi ${p.name},</h1>
      <p>Here is where your package stands (${total} classes):</p>

      <p style="margin-bottom: 4px;"><strong>Taught — ${done.length} ${done.length === 1 ? "class" : "classes"}</strong></p>
      ${done.length
        ? `<ul style="margin-top: 0; padding-inline-start: 20px;">${listDays(done, false)}</ul>`
        : `<p style="color: ${BRAND_MUTED};">No classes counted yet.</p>`}

      <p style="margin-bottom: 4px;"><strong>Left — ${remaining} ${remaining === 1 ? "class" : "classes"}</strong></p>

      <p><strong>Amount:</strong> ${amount} ${currency} for the whole package.</p>

      <p style="margin-bottom: 4px;"><strong>How to pay</strong></p>
      <p>Vodafone Cash or Fawry on <strong dir="ltr">${PAY_NUMBER}</strong>. For a bank transfer, message me on WhatsApp and I will send the details.</p>

      <p><strong>After you send it</strong>, open your page and upload a photo of the receipt. I will confirm it as soon as I see it.</p>

      <div style="margin: 24px 0; text-align: center;">
        ${brandButton("Upload your receipt", DASHBOARD_URL)}
      </div>

      ${whatsappLine(false)}
      ${unsubscribeFooter(p.unsubscribe_token, false)}
    `, false),
  };
}
