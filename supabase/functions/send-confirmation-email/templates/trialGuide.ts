// The trial book letter — sent before the class, only to students who said
// they are coming.
//
// Why it exists: the prep letter (`trial_prep`) goes to everyone booked on the
// session, confirmed or silent. The book is different. It is the material the
// student reads before she sits the class, and it is worth sending only to the
// people who answered "yes, I am coming" — `attendance_response = 'yes'`.
// Sent by `send-trial-guide`, stamped in `trial_bookings.guide_sent_at`, so
// exactly one book letter reaches each booking.
//
// The slug `trial_guide` is dispatched AHEAD of the switch in index.ts, like
// `admin_message` and `placement_result`, so the 18 KB template union in
// common.ts does not have to be rewritten to add it.
//
// Link, never attachment: the Arabic book is a few hundred KB, the sending
// domain is still young, and a link can be corrected without re-mailing
// anyone. It is also measurable — an open of the book is a second signal of
// intent beside the confirm click.
//
// Standing rules: neutral tone, the gain first, one action, WhatsApp above the
// signature, and the same `brandWrapper` chrome as every other letter.

import type { EmailPayload } from "./common.ts";
import {
  BRAND_YELLOW, BRAND_DARK, BRAND_GRAY, BRAND_TEXT, BRAND_MUTED,
  unsubscribeFooter, brandWrapper, brandButton,
} from "./common.ts";

const WA_URL = "https://wa.me/201010003084";

/** Fields this letter needs that are not on the shared payload type. */
interface GuidePayload extends EmailPayload {
  guide_url?: string;
  class_time_label?: string;
  meeting_url?: string;
}

function whatsappBlock(isAr: boolean): string {
  return `
    <p style="color: ${BRAND_MUTED}; font-size: 13px;">${isAr ? "أي سؤال؟ راسلنا على واتساب." : "Any questions? Message us on WhatsApp."}</p>
    <div style="margin: 20px 0; text-align: center;">
      <a href="${WA_URL}" style="display: inline-block; background-color: #25D366 !important; color: #ffffff !important; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">💬 ${isAr ? "واتساب" : "WhatsApp"}</a>
    </div>`;
}

export function buildTrialGuideEmail(payload: EmailPayload) {
  const p = payload as GuidePayload;
  const isAr = p.language === "ar";
  const guideUrl = (p.guide_url ?? "").trim();
  const when = (p.class_time_label ?? "").trim();
  const meetingUrl = (p.meeting_url ?? "").trim();

  if (isAr) {
    return {
      subject: "KLovers — كتاب الحصة التجريبية",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 22px;">مرحباً ${p.name}،</h1>
        <p>كتاب الحصة التجريبية جاهز، وهذه نسختك منه.</p>
        ${when
          ? `<div style="background-color: ${BRAND_GRAY}; border-right: 4px solid ${BRAND_YELLOW}; border-radius: 4px; padding: 14px 18px; margin: 16px 0;">
               <p style="margin: 0; color: ${BRAND_TEXT}; font-size: 14px;">موعد حصتك: <strong>${when}</strong></p>
             </div>`
          : ""}
        <p>افتحي الكتاب قبل الحصة — أربع صفحات فيها ما سنبدأ به، ومسار المستويات من الصفر إلى TOPIK.</p>
        <div style="margin: 24px 0; text-align: center;">
          ${brandButton("افتحي الكتاب", guideUrl)}
        </div>
        ${meetingUrl
          ? `<p style="color: ${BRAND_MUTED}; font-size: 13px;">رابط الحصة: <a href="${meetingUrl}" style="color: ${BRAND_DARK};">${meetingUrl}</a></p>`
          : ""}
        <p style="color: ${BRAND_MUTED}; font-size: 13px;">لا حاجة لطباعة الكتاب، يمكنك متابعته من الهاتف أو الحاسوب.</p>
        ${whatsappBlock(true)}
        ${unsubscribeFooter(p.unsubscribe_token, true)}
      `, true),
    };
  }

  return {
    subject: "KLovers — your trial class book",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Hi ${p.name},</h1>
      <p>The trial class book is ready, and this is your copy.</p>
      ${when
        ? `<div style="background-color: ${BRAND_GRAY}; border-left: 4px solid ${BRAND_YELLOW}; border-radius: 4px; padding: 14px 18px; margin: 16px 0;">
             <p style="margin: 0; color: ${BRAND_TEXT}; font-size: 14px;">Your class: <strong>${when}</strong></p>
           </div>`
        : ""}
      <p>Open it before the class — four pages covering what we start with, and the level path from zero to TOPIK.</p>
      <div style="margin: 24px 0; text-align: center;">
        ${brandButton("Open the book", guideUrl)}
      </div>
      ${meetingUrl
        ? `<p style="color: ${BRAND_MUTED}; font-size: 13px;">Class link: <a href="${meetingUrl}" style="color: ${BRAND_DARK};">${meetingUrl}</a></p>`
        : ""}
      <p style="color: ${BRAND_MUTED}; font-size: 13px;">No need to print it — it reads fine on a phone or a laptop.</p>
      ${whatsappBlock(false)}
      ${unsubscribeFooter(p.unsubscribe_token, false)}
    `, false),
  };
}
