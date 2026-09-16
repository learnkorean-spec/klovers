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
//
// Standing rule 5 decides the words: this is a NEW enrolment opening, not a
// follow-up on something past. The reader is never reminded that she sat a
// trial, never asked how it went, never chased.
//
// And rule 3 decides how much: Re, 16 September - "emails as much as possible
// must be neutral not too much data". So the letter no longer names her level.
// The level is settled out loud during the trial, she can change it herself in
// her dashboard, and she confirms it again when she picks a group. A letter
// that announces it adds a fact she already owns, and can contradict her.
// The grey panel describing weekly online classes went for the same reason:
// she has just been in one.
//
// What stays at full size is the seat-and-payment policy. It was 13px muted
// text under the button, and it is the only thing in the letter she cannot
// learn from any other source.

import type { EmailPayload } from "./common.ts";
import {
  BRAND_DARK, BRAND_MUTED,
  unsubscribeFooter, brandWrapper, brandButton,
} from "./common.ts";

const ENROL_URL = "https://kloversegy.com/enroll-now";
const WA_URL = "https://wa.me/201010003084";

// Rule 2: WhatsApp in the body, above the signature, not only in the footer.
// A hyperlink rather than a button, per Re on 16 September - the letter is
// meant to read quietly, and one button in it should mean one action.
function whatsappLine(isAr: boolean): string {
  return `
    <p style="color: ${BRAND_MUTED}; font-size: 14px;">${
      isAr
        ? `أي سؤال؟ <a href="${WA_URL}" style="color: #25D366; text-decoration: underline;">راسلنا على واتساب</a>.`
        : `Any questions? <a href="${WA_URL}" style="color: #25D366; text-decoration: underline;">Message us on WhatsApp</a>.`
    }</p>`;
}

export function buildTrialFollowupDay1Email(p: EmailPayload) {
  const isAr = p.language === "ar";

  if (isAr) {
    return {
      subject: "KLovers — التسجيل مفتوح",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 22px;">مرحباً ${p.name}،</h1>
        <p>التسجيل مفتوح الآن.</p>
        <p>اختاري مستواكِ والموعد المناسب من صفحة التسجيل.</p>
        <div style="margin: 24px 0; text-align: center;">
          ${brandButton("اختاري مجموعتك", ENROL_URL)}
        </div>
        <p>المقعد يُحجز باسمك من وقت التسجيل، والدفع بعد بداية المجموعة.</p>
        ${whatsappLine(true)}
        ${unsubscribeFooter(p.unsubscribe_token, true)}
      `, true),
    };
  }

  return {
    subject: "KLovers — enrolment is open",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Hi ${p.name},</h1>
      <p>Enrolment is open.</p>
      <p>Choose your level and a time that suits you on the enrolment page.</p>
      <div style="margin: 24px 0; text-align: center;">
        ${brandButton("Choose your group", ENROL_URL)}
      </div>
      <p>Your seat is held from the moment you enrol, and payment comes after the group starts.</p>
      ${whatsappLine(false)}
      ${unsubscribeFooter(p.unsubscribe_token, false)}
    `, false),
  };
}
