// Free-trial copy for people who signed up and never booked one.
//
// 28 Nov 2026, from the data: in the previous 60 days 50 people created an
// account and 44 of them neither booked a trial nor enrolled. 37 of the 44
// came in through the games page, 29 were gone within 15 minutes, and 5 ever
// saw the free-trial page. Each of them received exactly one email, the
// welcome, and that email did not mention the free trial at all (its two
// buttons were the placement test and the course list). After that: nothing.
//
// So three things live here, all about the same offer:
//   * trialBlock()   the free class as the FIRST thing in the welcome email
//   * nudge 1        two days after signup, still no trial
//   * nudge 2        four days after nudge 1, still no trial. The last one.
//
// Written the way Re writes: short, plain, no dashes as punctuation.

import {
  BRAND_DARK, BRAND_GRAY, BRAND_MUTED, BRAND_TEXT, SITE_URL,
  brandButton, brandWrapper, unsubscribeFooter,
} from "../send-confirmation-email/templates/common.ts";

export type NextTrial = { date: string; startTime: string } | null;

export const NUDGE_TEMPLATES = ["signup_trial_nudge_1", "signup_trial_nudge_2"] as const;
export type NudgeStep = 1 | 2;

/** /free-trial in the reader's language, tagged so bookings can be traced back. */
export function trialUrl(isAr: boolean, campaign: string): string {
  return `${SITE_URL}${isAr ? "/ar" : ""}/free-trial?utm_source=email&utm_medium=lifecycle&utm_campaign=${campaign}`;
}

/**
 * "Friday 4 December, 1:00 PM (Cairo time)". The trial calendar is kept in
 * Cairo time, so the date and the clock are formatted as plain calendar
 * values, never shifted through the server's own time zone.
 */
export function formatTrial(next: NextTrial, isAr: boolean): string | null {
  if (!next) return null;
  const [y, m, d] = next.date.split("-").map(Number);
  const [hh, mm] = next.startTime.split(":").map(Number);
  if (!y || !m || !d || Number.isNaN(hh)) return null;
  const when = new Date(Date.UTC(y, m - 1, d, hh, mm || 0));
  const day = new Intl.DateTimeFormat(isAr ? "ar-EG-u-nu-latn" : "en-GB", {
    weekday: "long", day: "numeric", month: "long", timeZone: "UTC",
  }).format(when);
  const clock = new Intl.DateTimeFormat(isAr ? "ar-EG-u-nu-latn" : "en-US", {
    hour: "numeric", minute: "2-digit", timeZone: "UTC",
  }).format(when);
  return isAr ? `${day}، الساعة ${clock} (بتوقيت مصر)` : `${day}, ${clock} (Cairo time)`;
}

/** The free class, for the top of the welcome email. */
export function trialBlock(isAr: boolean, next: NextTrial): string {
  const when = formatTrial(next, isAr);
  const url = trialUrl(isAr, "welcome");
  return isAr
    ? `
    <div style="background-color: ${BRAND_GRAY}; border-radius: 8px; padding: 16px 18px; margin: 16px 0; text-align: center;">
      <p style="margin: 0 0 6px; color: ${BRAND_DARK}; font-size: 16px; font-weight: bold;">ابدئي بحصة تجريبية مجانية</p>
      <p style="margin: 0 0 12px; color: ${BRAND_TEXT}; font-size: 14px;">30 دقيقة أونلاين مع المدرّسة، في مجموعة صغيرة، ومن غير أي دفع.${when ? `<br>أقرب حصة: <strong>${when}</strong>` : ""}</p>
      ${brandButton("احجزي حصتك المجانية", url)}
    </div>`
    : `
    <div style="background-color: ${BRAND_GRAY}; border-radius: 8px; padding: 16px 18px; margin: 16px 0; text-align: center;">
      <p style="margin: 0 0 6px; color: ${BRAND_DARK}; font-size: 16px; font-weight: bold;">Start with a free trial class</p>
      <p style="margin: 0 0 12px; color: ${BRAND_TEXT}; font-size: 14px;">30 minutes online with a real teacher, in a small group. No payment.${when ? `<br>Next class: <strong>${when}</strong>` : ""}</p>
      ${brandButton("Book my free class", url)}
    </div>`;
}

export function buildNudge(
  step: NudgeStep,
  name: string,
  isAr: boolean,
  next: NextTrial,
  unsubToken: string | undefined,
): { subject: string; html: string } {
  const first = (name || "").trim().split(/\s+/)[0] || "";
  const when = formatTrial(next, isAr);
  const url = trialUrl(isAr, NUDGE_TEMPLATES[step - 1]);

  const whenLineAr = when
    ? `<p style="color: ${BRAND_TEXT}; font-size: 15px;">أقرب حصة: <strong>${when}</strong></p>`
    : "";
  const whenLineEn = when
    ? `<p style="color: ${BRAND_TEXT}; font-size: 15px;">Next class: <strong>${when}</strong></p>`
    : "";

  let subject: string;
  let body: string;

  if (step === 1) {
    subject = isAr ? "حصتك الكورية المجانية مستنياكي" : "Your free Korean class is waiting";
    body = isAr
      ? `
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">${first ? `هاي ${first}،` : "هاي،"}</h1>
      <p style="color: ${BRAND_TEXT}; font-size: 15px;">سجلتي في KLovers من كام يوم. أسرع طريقة تبدئي بيها بجد هي حصة واحدة مباشرة مع مدرّسة.</p>
      <p style="color: ${BRAND_TEXT}; font-size: 15px;">الحصة 30 دقيقة أونلاين، في مجموعة صغيرة، ومجانية تمامًا. من غير كارت ومن غير أي التزام.</p>
      ${whenLineAr}
      <div style="margin: 22px 0; text-align: center;">${brandButton("احجزي حصتي المجانية", url)}</div>
      <p style="color: ${BRAND_MUTED}; font-size: 13px;">لو عندك أي سؤال، ردي على الإيميل ده وهنرد عليكي.</p>`
      : `
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">${first ? `Hi ${first},` : "Hi,"}</h1>
      <p style="color: ${BRAND_TEXT}; font-size: 15px;">You signed up at KLovers a few days ago. The fastest way to really get started is one live class with a teacher.</p>
      <p style="color: ${BRAND_TEXT}; font-size: 15px;">It's 30 minutes online, in a small group, and it's free. No card and nothing to commit to.</p>
      ${whenLineEn}
      <div style="margin: 22px 0; text-align: center;">${brandButton("Book my free class", url)}</div>
      <p style="color: ${BRAND_MUTED}; font-size: 13px;">Got a question? Just reply to this email and we'll answer.</p>`;
  } else {
    subject = isAr ? "لسه عايزة تتعلمي كوري؟ حصة مجانية واحدة" : "Still want to learn Korean? One free class";
    body = isAr
      ? `
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">${first ? `هاي ${first}،` : "هاي،"}</h1>
      <p style="color: ${BRAND_TEXT}; font-size: 15px;">الألعاب بداية حلوة. بس الحصة المباشرة هي المكان اللي بتبدئي تتكلمي فيه فعلًا، والمدرّسة بتسمعك وبتصلحلك.</p>
      <p style="color: ${BRAND_TEXT}; font-size: 15px;">لسه ليكي حصة تجريبية مجانية عندنا.</p>
      ${whenLineAr}
      <div style="margin: 22px 0; text-align: center;">${brandButton("اختاري ميعادك", url)}</div>
      <p style="color: ${BRAND_MUTED}; font-size: 13px;">دي آخر مرة هنفكرك بيها. حسابك وألعابك موجودين وقت ما تحبي.</p>`
      : `
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">${first ? `Hi ${first},` : "Hi,"}</h1>
      <p style="color: ${BRAND_TEXT}; font-size: 15px;">The games are a good start. A live class is where you actually start speaking, with a teacher who listens and corrects you.</p>
      <p style="color: ${BRAND_TEXT}; font-size: 15px;">Your free trial class is still open.</p>
      ${whenLineEn}
      <div style="margin: 22px 0; text-align: center;">${brandButton("Pick my time", url)}</div>
      <p style="color: ${BRAND_MUTED}; font-size: 13px;">This is the last reminder about it. Your account and your games stay right where they are.</p>`;
  }

  return { subject, html: brandWrapper(body + unsubscribeFooter(unsubToken, isAr), isAr) };
}
