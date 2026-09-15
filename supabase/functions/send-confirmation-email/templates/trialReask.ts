// The second ask — for a booking that was asked whether she is coming and
// never answered.
//
// Standing rule 5 decides the words: this is a NEW opening, not a chase. The
// old booking is used only to know who to write to and which class; it is
// never referred to in the text. There is no "you haven't confirmed", no
// "reminder", no apology, and no count of how many times we have written.
//
// Deliberately NOT carrying the book link. The book goes to the students who
// confirm — putting it here would hand it to everyone who was written to,
// which empties the exchange it is part of, and it would compete with the one
// action this letter exists for. See claude/TRIAL_GUIDE_LETTER_2026-09-15.md.
//
// The confirm and decline links are the same two the first ask uses, so the
// page and the RPC behind them are already proven: /trial-confirm carries the
// booking's own token and shows the day picker on a yes.

import type { EmailPayload } from "./common.ts";
import {
  BRAND_YELLOW, BRAND_DARK, BRAND_GRAY, BRAND_TEXT, BRAND_MUTED,
  unsubscribeFooter, brandWrapper, brandButton,
} from "./common.ts";

const WA_URL = "https://wa.me/201010003084";

interface ReaskPayload extends EmailPayload {
  class_time_label?: string;
  duration_label?: string;
}

function whatsappBlock(isAr: boolean): string {
  return `
    <p style="color: ${BRAND_MUTED}; font-size: 13px;">${isAr ? "أي سؤال؟ راسلنا على واتساب." : "Any questions? Message us on WhatsApp."}</p>
    <div style="margin: 20px 0; text-align: center;">
      <a href="${WA_URL}" style="display: inline-block; background-color: #25D366 !important; color: #ffffff !important; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">💬 ${isAr ? "واتساب" : "WhatsApp"}</a>
    </div>`;
}

export function buildTrialReaskEmail(payload: EmailPayload) {
  const p = payload as ReaskPayload;
  const isAr = p.language === "ar";
  const token = p.confirmation_token || "";
  const confirmUrl = `https://kloversegy.com/trial-confirm?token=${token}&response=yes`;
  const declineUrl = `https://kloversegy.com/trial-confirm?token=${token}&response=no`;
  const when = (p.class_time_label ?? "").trim();
  const duration = (p.duration_label ?? "").trim();

  if (isAr) {
    return {
      subject: when
        ? `KLovers — حصة تجريبية مجانية، ${when}`
        : "KLovers — حصة تجريبية مجانية",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 22px;">مرحباً ${p.name}،</h1>
        <p>فتحنا مقاعد في الحصة التجريبية المجانية القادمة.</p>
        <div style="background-color: ${BRAND_GRAY}; border-right: 4px solid ${BRAND_YELLOW}; border-radius: 4px; padding: 14px 18px; margin: 16px 0;">
          ${when ? `<p style="margin: 0; color: ${BRAND_TEXT}; font-size: 14px;"><strong>${when}</strong></p>` : ""}
          ${duration ? `<p style="margin: 6px 0 0; color: ${BRAND_TEXT}; font-size: 14px;">${duration}</p>` : ""}
        </div>
        <p>الحصة تعريفية بالكورية من الصفر: تتعرّفين على الهانغول وطريقة الدراسة معنا، وتقرّرين بعدها بشكل مريح.</p>
        <div style="margin: 24px 0; text-align: center;">
          ${brandButton("أؤكّد حضوري", confirmUrl)}
        </div>
        <p style="text-align: center; margin-top: -4px;">
          <a href="${declineUrl}" style="color: ${BRAND_MUTED}; font-size: 13px;">الموعد لا يناسبني</a>
        </p>
        <p style="color: ${BRAND_MUTED}; font-size: 13px;">بعد التأكيد نرسل لك كتاب الحصة ورابط الدخول.</p>
        ${whatsappBlock(true)}
        ${unsubscribeFooter(p.unsubscribe_token, true)}
      `, true),
    };
  }

  return {
    subject: when
      ? `KLovers — free trial class, ${when}`
      : "KLovers — free trial class",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Hi ${p.name},</h1>
      <p>Seats are open in the next free trial class.</p>
      <div style="background-color: ${BRAND_GRAY}; border-left: 4px solid ${BRAND_YELLOW}; border-radius: 4px; padding: 14px 18px; margin: 16px 0;">
        ${when ? `<p style="margin: 0; color: ${BRAND_TEXT}; font-size: 14px;"><strong>${when}</strong></p>` : ""}
        ${duration ? `<p style="margin: 6px 0 0; color: ${BRAND_TEXT}; font-size: 14px;">${duration}</p>` : ""}
      </div>
      <p>It is an introduction to Korean from zero: you meet Hangeul and the way we teach, and decide afterwards in your own time.</p>
      <div style="margin: 24px 0; text-align: center;">
        ${brandButton("I'll be there", confirmUrl)}
      </div>
      <p style="text-align: center; margin-top: -4px;">
        <a href="${declineUrl}" style="color: ${BRAND_MUTED}; font-size: 13px;">This time doesn't suit me</a>
      </p>
      <p style="color: ${BRAND_MUTED}; font-size: 13px;">Once you confirm, we send you the class book and your joining link.</p>
      ${whatsappBlock(false)}
      ${unsubscribeFooter(p.unsubscribe_token, false)}
    `, false),
  };
}
