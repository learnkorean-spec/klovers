// The two payment letters. Split out of lifecycle.ts on 2026-09-15 so their
// copy can be rewritten without resending 54 KB of that file. lifecycle.ts
// still exports stale copies of buildPaymentMethodReminderEmail and
// buildReceiptNudgeEmail that nothing imports any more - delete them there the
// next time that file is opened.
//
// Letter one - `payment_method_reminder`, sent by send_payment_ask_emails()
//   on cron payment-ask-hourly, in the last day before the first class. It
//   carries the price and the two payment methods.
// Letter two - `receipt_nudge`, sent by send_payment_final_alert() on cron
//   payment-final-alert-hourly at 23:00 Africa/Cairo on day three after the
//   first class. It is the last letter a student ever receives about payment.
//   The seat is NOT released afterwards - Re gets an admin notification and
//   decides. Nothing in the copy may imply otherwise.
//
// Both follow the five standing message rules in
// claude/CUSTOMER_MESSAGE_TONE_RULE.md: open with the gain and never
// apologise, WhatsApp in the body above the signature, neutral tone, the one
// shared brandWrapper chrome, and a live enrolment rather than a chase.

import type { EmailPayload } from "./common.ts";
import {
  BRAND_YELLOW, BRAND_DARK, BRAND_GRAY, BRAND_TEXT, BRAND_MUTED,
  unsubscribeFooter, brandWrapper, brandButton,
} from "./common.ts";

// The only number Klovers publishes. Vodafone Cash and Fawry both sit on it,
// and it is where a reader asks for bank-transfer details - those are never
// printed in an email. Mirrors WHATSAPP_NUMBER in src/lib/siteConfig.ts.
const PAY_PHONE = "+20 101 000 3084";
const WA_URL = "https://wa.me/201010003084";

function payUrlFor(enrollmentId?: string): string {
  return enrollmentId
    ? `https://kloversegy.com/pay/${enrollmentId}`
    : "https://kloversegy.com/dashboard";
}

// first_class_date arrives as a timestamptz. Built from its own parts and
// formatted in UTC, so the day printed is the day stored - never shifted by
// the runtime's local zone. activate_pkg_group() writes it from a date, so
// today the stored instant is midnight UTC and the Cairo day is the same day.
function formatClassDate(raw: unknown, isAr: boolean): string {
  if (!raw) return "";
  const m = String(raw).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return String(raw);
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  try {
    // `ar-EG` alone formats the day and year in Arabic-Indic digits (٢١), while
    // the amount a few lines below is Western (2,400 EGP). One letter, two
    // numeral systems. `-u-nu-latn` keeps the Arabic month name and puts the
    // digits back in the form every other number in the letter uses.
    return new Intl.DateTimeFormat(isAr ? "ar-EG-u-nu-latn" : "en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(d);
  } catch {
    return `${m[3]}/${m[2]}/${m[1]}`;
  }
}

function formatAmount(p: EmailPayload): string {
  if (p.amount === undefined || p.amount === null) return "";
  return p.currency === "EGP"
    ? `${p.amount.toLocaleString()} EGP`
    : `$${p.amount}`;
}

// Price row. Omitted rather than printed empty when the caller has no amount -
// the admin "send payment letter" button in AdminDashboard sends without one.
function amountBox(amountStr: string, isAr: boolean): string {
  if (!amountStr) return "";
  return `
    <div style="background-color: ${BRAND_GRAY}; border-${isAr ? "right" : "left"}: 4px solid ${BRAND_YELLOW}; border-radius: 4px; padding: 14px 18px; margin: 16px 0;">
      <p style="margin: 0; font-size: 14px; color: ${BRAND_MUTED};">${isAr ? "المبلغ" : "Amount"}</p>
      <p style="margin: 4px 0 0; font-size: 20px; font-weight: bold; color: ${BRAND_DARK};">${amountStr}</p>
    </div>`;
}

// Vodafone Cash and Fawry, both on the one number. Bank transfer is on offer
// but its details are never printed - the reader asks on WhatsApp.
function methodsBox(isAr: boolean): string {
  if (isAr) {
    return `
    <div style="background-color: ${BRAND_GRAY}; border-radius: 8px; padding: 16px 18px; margin: 16px 0;">
      <p style="margin: 0 0 10px; font-weight: bold; color: ${BRAND_DARK}; font-size: 15px;">طرق الدفع</p>
      <p style="margin: 0 0 6px; color: ${BRAND_TEXT}; font-size: 14px;">فودافون كاش — <strong style="direction: ltr; unicode-bidi: embed;">${PAY_PHONE}</strong></p>
      <p style="margin: 0 0 6px; color: ${BRAND_TEXT}; font-size: 14px;">فوري — <strong style="direction: ltr; unicode-bidi: embed;">${PAY_PHONE}</strong></p>
      <p style="margin: 10px 0 0; color: ${BRAND_MUTED}; font-size: 13px;">التحويل البنكي متاح أيضاً — راسلنا على واتساب على نفس الرقم ونرسل لك بيانات الحساب.</p>
    </div>`;
  }
  return `
    <div style="background-color: ${BRAND_GRAY}; border-radius: 8px; padding: 16px 18px; margin: 16px 0;">
      <p style="margin: 0 0 10px; font-weight: bold; color: ${BRAND_DARK}; font-size: 15px;">Payment options</p>
      <p style="margin: 0 0 6px; color: ${BRAND_TEXT}; font-size: 14px;">Vodafone Cash — <strong>${PAY_PHONE}</strong></p>
      <p style="margin: 0 0 6px; color: ${BRAND_TEXT}; font-size: 14px;">Fawry — <strong>${PAY_PHONE}</strong></p>
      <p style="margin: 10px 0 0; color: ${BRAND_MUTED}; font-size: 13px;">Bank transfer is available too — message us on WhatsApp on the same number and we'll send the account details.</p>
    </div>`;
}

// Rule 2: WhatsApp in the body, above the signature, not only in the footer.
function whatsappBlock(isAr: boolean): string {
  return `
    <p style="color: ${BRAND_MUTED}; font-size: 13px;">${isAr ? "أي سؤال؟ راسلنا على واتساب." : "Any questions? Message us on WhatsApp."}</p>
    <div style="margin: 20px 0; text-align: center;">
      <a href="${WA_URL}" style="display: inline-block; background-color: #25D366 !important; color: #ffffff !important; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">💬 ${isAr ? "واتساب" : "WhatsApp"}</a>
    </div>`;
}

// ── Letter one: payment_method_reminder ──
// The last day before the first class. Opens with the class, not with what is
// owed; the price and the methods follow, and the one action is the pay page.
export function buildPaymentMethodReminderEmail(p: EmailPayload) {
  const isAr = p.language === "ar";
  const dateStr = formatClassDate(p.first_class_date, isAr);
  const amountStr = formatAmount(p);
  const payUrl = payUrlFor(p.enrollment_id);

  if (isAr) {
    return {
      subject: dateStr
        ? `KLovers — حصتك الأولى يوم ${dateStr}، وطرق الدفع`
        : "KLovers — تفاصيل الدفع لحصتك الأولى",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 22px;">مرحباً ${p.name}،</h1>
        ${dateStr
          ? `<p>حصتك الأولى يوم <strong>${dateStr}</strong>.</p>`
          : `<p>حصتك الأولى على وشك البدء.</p>`}
        <p>إليك تفاصيل الدفع حتى يكون مقعدك جاهزاً قبل بدايتها.</p>
        ${amountBox(amountStr, true)}
        ${methodsBox(true)}
        <p>بعد التحويل، ارفع صورة الإيصال من صفحة الدفع الخاصة بك:</p>
        <div style="margin: 24px 0; text-align: center;">
          ${brandButton("صفحة الدفع", payUrl)}
        </div>
        ${whatsappBlock(true)}
        ${unsubscribeFooter(p.unsubscribe_token, true)}
      `, true),
    };
  }
  return {
    subject: dateStr
      ? `KLovers — your first class is on ${dateStr}, and how to pay`
      : "KLovers — payment details for your first class",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Hi ${p.name},</h1>
      ${dateStr
        ? `<p>Your first class is on <strong>${dateStr}</strong>.</p>`
        : `<p>Your first class is about to start.</p>`}
      <p>Here are the payment details, so your seat is ready before it begins.</p>
      ${amountBox(amountStr, false)}
      ${methodsBox(false)}
      <p>Once you've transferred, upload the receipt from your payment page:</p>
      <div style="margin: 24px 0; text-align: center;">
        ${brandButton("Payment page", payUrl)}
      </div>
      ${whatsappBlock(false)}
      ${unsubscribeFooter(p.unsubscribe_token, false)}
    `, false),
  };
}

// ── Letter two: receipt_nudge ──
// 23:00 Africa/Cairo, day three after the first class, and the last letter
// there will ever be. It states the date, keeps the seat, and asks for
// nothing. No deadline, no warning colour, no second follow-up.
export function buildReceiptNudgeEmail(p: EmailPayload) {
  const isAr = p.language === "ar";
  const dateStr = formatClassDate(p.first_class_date, isAr);
  const amountStr = formatAmount(p);
  const payUrl = payUrlFor(p.enrollment_id);

  if (isAr) {
    return {
      subject: "KLovers — مقعدك في المجموعة محفوظ",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 22px;">مرحباً ${p.name}،</h1>
        ${dateStr
          ? `<p>مقعدك في المجموعة التي بدأت يوم <strong>${dateStr}</strong> ما زال محفوظاً باسمك.</p>`
          : `<p>مقعدك في المجموعة ما زال محفوظاً باسمك.</p>`}
        ${amountBox(amountStr, true)}
        ${methodsBox(true)}
        <p>متى أحببت إتمام الدفع، ارفع صورة الإيصال من صفحة الدفع الخاصة بك:</p>
        <div style="margin: 24px 0; text-align: center;">
          ${brandButton("صفحة الدفع", payUrl)}
        </div>
        <p style="color: ${BRAND_MUTED}; font-size: 13px;">هذه آخر رسالة نرسلها بخصوص الدفع. مقعدك يبقى كما هو، والقرار قرارك.</p>
        ${whatsappBlock(true)}
        ${unsubscribeFooter(p.unsubscribe_token, true)}
      `, true),
    };
  }
  return {
    subject: "KLovers — your seat in the group is kept",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Hi ${p.name},</h1>
      ${dateStr
        ? `<p>Your seat in the group that started on <strong>${dateStr}</strong> is still held in your name.</p>`
        : `<p>Your seat in the group is still held in your name.</p>`}
      ${amountBox(amountStr, false)}
      ${methodsBox(false)}
      <p>Whenever you'd like to complete the payment, upload the receipt from your payment page:</p>
      <div style="margin: 24px 0; text-align: center;">
        ${brandButton("Payment page", payUrl)}
      </div>
      <p style="color: ${BRAND_MUTED}; font-size: 13px;">This is the last letter we'll send about payment. Your seat stays as it is, and the decision is yours.</p>
      ${whatsappBlock(false)}
      ${unsubscribeFooter(p.unsubscribe_token, false)}
    `, false),
  };
}
