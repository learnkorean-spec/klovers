// The trial-day reminder — sent about two hours before the class starts.
//
// WHY THIS EXISTS
//
// Until now a trial got nothing on the day. `class-reminder-24h` and
// `class-reminder-1h` read pkg_group_sessions JOIN pkg_group_members, and a
// trial booking is in neither table; `send-pre-class-reminders` is gated on
// enrollments.first_class_date. So the last letter a trial student received
// was the book, the day before — and on 17 September the reminder for the
// first class had to be typed by hand from /admin/message.
//
// WHO IT GOES TO
//
// Every live booking on today's session, confirmed or silent. That is Re's
// rule for this letter and it is the opposite of the book's: the book is the
// reward for confirming, the reminder is the thing that fills the room. A
// student who never answered still booked a seat, and two hours before the
// class the useful act is to hand her the link, not to ask her again.
//
// WHAT IT CARRIES
//
// The time, the room link, and the book. The book link is optional here — it
// is a reminder, not the book letter — so a failure to sign the PDF costs the
// letter its second button, not its send. The room link is required: a
// reminder without the room is a reminder to stand outside a door.
//
// Standing rules: neutral tone, the gain first, one action, WhatsApp above the
// signature, same brandWrapper chrome as every other letter.

import type { EmailPayload } from "./common.ts";
import {
  BRAND_YELLOW, BRAND_DARK, BRAND_GRAY, BRAND_TEXT, BRAND_MUTED,
  unsubscribeFooter, brandWrapper, brandButton,
} from "./common.ts";

const WA_URL = "https://wa.me/201010003084";

/** Fields this letter needs that are not on the shared payload type. */
interface ReminderPayload extends EmailPayload {
  class_time_label?: string;
  meeting_url?: string;
  guide_url?: string;
}

function whatsappBlock(isAr: boolean): string {
  return `
    <p style="color: ${BRAND_MUTED}; font-size: 13px;">${isAr ? "أي سؤال؟ راسلنا على واتساب." : "Any questions? Message us on WhatsApp."}</p>
    <div style="margin: 20px 0; text-align: center;">
      <a href="${WA_URL}" style="display: inline-block; background-color: #25D366 !important; color: #ffffff !important; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">💬 ${isAr ? "واتساب" : "WhatsApp"}</a>
    </div>`;
}

export function buildTrialReminderEmail(payload: EmailPayload) {
  const p = payload as ReminderPayload;
  const isAr = p.language === "ar";
  const when = (p.class_time_label ?? "").trim();
  const meetingUrl = (p.meeting_url ?? "").trim();
  const guideUrl = (p.guide_url ?? "").trim();

  if (isAr) {
    return {
      subject: "KLovers — حصتك التجريبية اليوم",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 22px;">مرحباً ${p.name}،</h1>
        <p>حصتك التجريبية اليوم، وهذا رابط الدخول.</p>
        ${when
          ? `<div style="background-color: ${BRAND_GRAY}; border-right: 4px solid ${BRAND_YELLOW}; border-radius: 4px; padding: 14px 18px; margin: 16px 0;">
               <p style="margin: 0; color: ${BRAND_TEXT}; font-size: 14px;">موعد حصتك: <strong>${when}</strong></p>
             </div>`
          : ""}
        <div style="margin: 24px 0; text-align: center;">
          ${brandButton("ادخلي الحصة", meetingUrl)}
        </div>
        <p style="color: ${BRAND_MUTED}; font-size: 13px;">افتحي الرابط قبل الموعد بخمس دقائق من الهاتف أو الحاسوب. لا يحتاج تحميل أي برنامج.</p>
        ${guideUrl
          ? `<p style="color: ${BRAND_MUTED}; font-size: 13px;">ومعك كتاب الحصة إن أردت مراجعته قبلها: <a href="${guideUrl}" style="color: ${BRAND_DARK};">افتحي الكتاب</a></p>`
          : ""}
        <p style="color: ${BRAND_MUTED}; font-size: 13px;">إن حدث ظرف ولم تستطيعي الحضور، ردّي على هذه الرسالة ونرتّب لك موعدًا آخر.</p>
        ${whatsappBlock(true)}
        ${unsubscribeFooter(p.unsubscribe_token, true)}
      `, true),
    };
  }

  return {
    subject: "KLovers — your trial class today",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Hi ${p.name},</h1>
      <p>Your trial class is today, and this is the link to join.</p>
      ${when
        ? `<div style="background-color: ${BRAND_GRAY}; border-left: 4px solid ${BRAND_YELLOW}; border-radius: 4px; padding: 14px 18px; margin: 16px 0;">
             <p style="margin: 0; color: ${BRAND_TEXT}; font-size: 14px;">Your class: <strong>${when}</strong></p>
           </div>`
        : ""}
      <div style="margin: 24px 0; text-align: center;">
        ${brandButton("Join the class", meetingUrl)}
      </div>
      <p style="color: ${BRAND_MUTED}; font-size: 13px;">Open the link five minutes early, on a phone or a laptop. Nothing to install.</p>
      ${guideUrl
        ? `<p style="color: ${BRAND_MUTED}; font-size: 13px;">The class book is here too, if you want a look first: <a href="${guideUrl}" style="color: ${BRAND_DARK};">open the book</a></p>`
        : ""}
      <p style="color: ${BRAND_MUTED}; font-size: 13px;">If something came up and you cannot make it, reply to this letter and we will move you to another day.</p>
      ${whatsappBlock(false)}
      ${unsubscribeFooter(p.unsubscribe_token, false)}
    `, false),
  };
}
