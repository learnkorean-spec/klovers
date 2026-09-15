// The letter that follows a trial class.
//
// Sent two hours after the class ENDS, by send-trial-followups. It keeps the
// slug `trial_followup_day1` and the `followup_day1_sent_at` stamp, because
// no new template slug can be registered without also touching the 61 KB
// trial.ts - the copy moved here instead, the same way the payment letters
// moved to payment.ts on 2026-09-15. trial.ts still exports a stale
// buildTrialFollowupDay1Email that nothing imports - delete it there next
// time that file is opened.
//
// Why two hours after the class and not the next morning: nothing in the
// database records that a trial HAPPENED. There is no attended mark and no
// completed status, so a follow-up can never be aimed at the people who came.
// The clock can be, though - `starts_at + duration + 2h` is knowable without
// any attendance data at all. Everyone who booked is written to, no-shows
// included, and that is a deliberate choice: an extra letter to someone who
// missed the class costs less than the silence that has stood in its place.
// `trial_followup_day1` had been sent twice in the life of the product, both
// in May.
//
// Standing rule 5 decides the words: this is a NEW enrolment opening, not a
// follow-up on something past. The reader is never reminded that she sat a
// trial, never asked how it went, never chased.

import type { EmailPayload } from "./common.ts";
import {
  BRAND_YELLOW, BRAND_DARK, BRAND_GRAY, BRAND_TEXT, BRAND_MUTED,
  unsubscribeFooter, brandWrapper, brandButton,
} from "./common.ts";

const ENROL_URL = "https://kloversegy.com/enroll-now";
const WA_URL = "https://wa.me/201010003084";

// Rule 2: WhatsApp in the body, above the signature, not only in the footer.
function whatsappBlock(isAr: boolean): string {
  return `
    <p style="color: ${BRAND_MUTED}; font-size: 13px;">${isAr ? "أي سؤال؟ راسلنا على واتساب." : "Any questions? Message us on WhatsApp."}</p>
    <div style="margin: 20px 0; text-align: center;">
      <a href="${WA_URL}" style="display: inline-block; background-color: #25D366 !important; color: #ffffff !important; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">💬 ${isAr ? "واتساب" : "WhatsApp"}</a>
    </div>`;
}

export function buildTrialFollowupDay1Email(p: EmailPayload) {
  const isAr = p.language === "ar";
  // `level` arrives already resolved to a readable label by index.ts - the
  // canonical key `l1` never reaches a letter as "L1" again, and in Arabic it
  // arrives in Arabic.
  const level = (p.level ?? "").toString().trim();

  if (isAr) {
    return {
      subject: level
        ? `KLovers — التسجيل مفتوح لمستوى ${level}`
        : "KLovers — التسجيل مفتوح الآن",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 22px;">مرحباً ${p.name}،</h1>
        ${level
          ? `<p>التسجيل مفتوح الآن في مجموعات <strong>${level}</strong>.</p>`
          : `<p>التسجيل مفتوح الآن في مجموعاتنا الجديدة.</p>`}
        <div style="background-color: ${BRAND_GRAY}; border-${isAr ? "right" : "left"}: 4px solid ${BRAND_YELLOW}; border-radius: 4px; padding: 14px 18px; margin: 16px 0;">
          <p style="margin: 0; color: ${BRAND_TEXT}; font-size: 14px;">حصص جماعية أسبوعية عبر الإنترنت، مع مدرّسة كورية متخصصة، ومجموعة على نفس مستواك.</p>
        </div>
        <p>اختاري المجموعة والموعد اللذين يناسبانك من صفحة التسجيل:</p>
        <div style="margin: 24px 0; text-align: center;">
          ${brandButton("اختاري مجموعتك", ENROL_URL)}
        </div>
        <p style="color: ${BRAND_MUTED}; font-size: 13px;">المقعد يُحجز باسمك من وقت التسجيل، والدفع يأتي بعد بداية المجموعة.</p>
        ${whatsappBlock(true)}
        ${unsubscribeFooter(p.unsubscribe_token, true)}
      `, true),
    };
  }

  return {
    subject: level
      ? `KLovers — enrolment is open for ${level}`
      : "KLovers — enrolment is open",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Hi ${p.name},</h1>
      ${level
        ? `<p>Enrolment is open for <strong>${level}</strong> groups.</p>`
        : `<p>Enrolment is open for our new groups.</p>`}
      <div style="background-color: ${BRAND_GRAY}; border-left: 4px solid ${BRAND_YELLOW}; border-radius: 4px; padding: 14px 18px; margin: 16px 0;">
        <p style="margin: 0; color: ${BRAND_TEXT}; font-size: 14px;">Weekly online group classes, with a specialist Korean teacher, in a group at your own level.</p>
      </div>
      <p>Pick the group and the time that suit you from the enrolment page:</p>
      <div style="margin: 24px 0; text-align: center;">
        ${brandButton("Choose your group", ENROL_URL)}
      </div>
      <p style="color: ${BRAND_MUTED}; font-size: 13px;">Your seat is held from the moment you enrol, and payment comes after the group starts.</p>
      ${whatsappBlock(false)}
      ${unsubscribeFooter(p.unsubscribe_token, false)}
    `, false),
  };
}
