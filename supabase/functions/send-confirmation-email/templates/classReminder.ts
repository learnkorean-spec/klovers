// The day-before reminder for a paid group class.
//
// Sent by `send-class-reminders` (hourly cron, 09:00-21:59 Cairo) to every
// seated student of a STARTED group, the day before each session, stamped in
// `class_reminder_sends` so nobody is reminded twice.
//
// Replaces the English-only letter that send-class-reminders used to build
// itself, with its own header and one global link for every group. This one
// carries the group's own room, reads in the class language, and uses the
// shared `brandWrapper` chrome with WhatsApp above the signature.
//
// Dispatched AHEAD of the switch in index.ts, like `trial_guide`: the slug is
// deliberately absent from the template union in common.ts.

import type { EmailPayload } from "./common.ts";
import {
  BRAND_YELLOW, BRAND_DARK, BRAND_GRAY, BRAND_TEXT, BRAND_MUTED,
  unsubscribeFooter, brandWrapper, brandButton,
} from "./common.ts";

const WA_URL = "https://wa.me/201010003084";

/** Fields this letter needs that are not on the shared payload type. */
interface ReminderPayload extends EmailPayload {
  class_time_label?: string;
}

function whatsappBlock(isAr: boolean): string {
  return `
    <p style="color: ${BRAND_MUTED}; font-size: 13px;">${isAr ? "لن تتمكني من الحضور، أو عندك سؤال؟ راسلينا على واتساب." : "Can't make it, or have a question? Message us on WhatsApp."}</p>
    <div style="margin: 20px 0; text-align: center;">
      <a href="${WA_URL}" style="display: inline-block; background-color: #25D366 !important; color: #ffffff !important; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">💬 ${isAr ? "واتساب" : "WhatsApp"}</a>
    </div>`;
}

export function buildClassReminderEmail(payload: EmailPayload) {
  const p = payload as ReminderPayload;
  const isAr = p.language === "ar";
  const when = (p.class_time_label ?? "").trim();
  const link = (p.class_link_url ?? "").trim();
  const group = (p.group_name ?? "").trim();
  const level = (p.level ?? "").trim();

  const box = (label: string, value: string) =>
    value ? `<p style="margin: 0 0 6px; color: ${BRAND_TEXT}; font-size: 14px;">${label} <strong>${value}</strong></p>` : "";

  if (isAr) {
    return {
      subject: "KLovers — حصتك غدًا",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 22px;">مرحباً ${p.name}،</h1>
        <p>تذكير بحصة الكوري غدًا.</p>
        <div style="background-color: ${BRAND_GRAY}; border-right: 4px solid ${BRAND_YELLOW}; border-radius: 4px; padding: 14px 18px; margin: 16px 0;">
          ${box("الموعد:", when)}
          ${box("المجموعة:", group)}
          ${box("المستوى:", level)}
        </div>
        <div style="margin: 24px 0; text-align: center;">
          ${brandButton("ادخلي الحصة", link)}
        </div>
        <p style="color: ${BRAND_MUTED}; font-size: 13px;">هذا هو نفس رابط مجموعتك كل أسبوع: <a href="${link}" style="color: ${BRAND_DARK};">${link}</a></p>
        ${whatsappBlock(true)}
        ${unsubscribeFooter(p.unsubscribe_token, true)}
      `, true),
    };
  }

  return {
    subject: "KLovers — your class is tomorrow",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Hi ${p.name},</h1>
      <p>A reminder that your Korean class is tomorrow.</p>
      <div style="background-color: ${BRAND_GRAY}; border-left: 4px solid ${BRAND_YELLOW}; border-radius: 4px; padding: 14px 18px; margin: 16px 0;">
        ${box("When:", when)}
        ${box("Group:", group)}
        ${box("Level:", level)}
      </div>
      <div style="margin: 24px 0; text-align: center;">
        ${brandButton("Join the class", link)}
      </div>
      <p style="color: ${BRAND_MUTED}; font-size: 13px;">It is the same link for your group every week: <a href="${link}" style="color: ${BRAND_DARK};">${link}</a></p>
      ${whatsappBlock(false)}
      ${unsubscribeFooter(p.unsubscribe_token, false)}
    `, false),
  };
}
