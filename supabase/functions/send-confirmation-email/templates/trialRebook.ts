/**
 * The trial invitation — "your free trial is ready to book".
 *
 * WHY THIS IS ITS OWN FILE
 * ------------------------
 * It lived in `trial.ts` beside the other eight trial emails. That file is
 * 58 KB, and the only write path available here takes whole files, so changing
 * one sentence meant resending all of it and trusting the round-trip. This is
 * the same move that produced `constants/courseCards.ts`: lift the thing being
 * edited into a small module and point the caller at it.
 *
 * `trial.ts` still exports `buildTrialRebookEmail`. Nothing imports it any
 * more — `index.ts` imports this instead. Delete it there when that file is
 * next opened for another reason.
 *
 * WHAT THIS LETTER IS FOR
 * -----------------------
 * One job: get a free trial booked. Not to sell a course, not to explain
 * pricing — every extra ask lowers the chance of the one that matters. The
 * price is deliberately absent for that reason, and because it varies by
 * country: the courses page shows each reader theirs.
 *
 * The copy is organised around the reasons people do not book, in the order
 * they occur to a reader: which dates (slots), in my time? (local-time note),
 * do I have to perform? (what-happens box), who is teaching (teacher line),
 * then the ask, then what comes after, then an exit for anyone none of the
 * dates suit.
 *
 * GENDER
 * ------
 * This was written in the feminine throughout — "احجزي", "اخترتي", "كلمينا",
 * "١٠ طالبات". Most Klovers students are women, but a letter grammatically
 * addressed to women tells every man who gets it that the class is not his.
 * Arabic has no true neuter, so: impersonal constructions wherever a verb can
 * be avoided ("عند فتح صفحة الحجز…", "يُفضَّل الحجز بدري"), unmarked forms
 * where one cannot. No sentence marks the reader's gender.
 */

import type { EmailPayload } from "./common.ts";
import {
  BRAND_BLACK, BRAND_YELLOW, BRAND_DARK, BRAND_GRAY, BRAND_MUTED,
  SITE_URL, brandWrapper, renderClassTime,
} from "./common.ts";

/**
 * Seats per trial class.
 *
 * Matches `trial_slots.capacity` and the capacity of the Hangul cohorts in
 * `schedule_packages`. If that changes, change it here in the same commit —
 * `available_slots` carries no capacity field, so this cannot yet be derived.
 */
const TRIAL_CAPACITY = 8;

/**
 * Minutes in a trial class. The trial is 30; the Hangul course that follows is
 * 60 per class. Two different numbers for two different things — keep them
 * apart. Overridden by the payload where the caller knows better.
 */
const TRIAL_MINUTES = 30;

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const toArabicDigits = (n: number): string =>
  String(n).replace(/\d/g, (d) => AR_DIGITS[Number(d)]);

export function buildTrialRebookEmail(p: EmailPayload) {
  const isAr = p.language === "ar";
  const url = p.rebook_url || `${SITE_URL}/free-trial`;
  const coursesUrl = `${SITE_URL}/courses`;
  const waUrl = "https://wa.me/201010003084";

  const dayNamesEn = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayNamesAr = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

  // Sort by DATE, not by day_of_week. These slots carry real dates, and
  // ordering by weekday put Sunday the 13th and Monday the 14th above Friday
  // the 11th — the reader saw four dates shuffled. day_of_week stays as the
  // tie-break for any slot with no date.
  const slots = (p.available_slots || []).slice().sort((a, b) =>
    (a.date || "").localeCompare(b.date || "") ||
    a.day_of_week - b.day_of_week ||
    a.start_time.localeCompare(b.start_time)
  );

  const fmtDate = (iso: string) =>
    new Date(iso + "T00:00:00").toLocaleDateString(
      isAr ? "ar-EG" : "en-US", { month: "long", day: "numeric" });

  const slotCards = slots.length
    ? slots.map((s) => {
        const day = isAr ? dayNamesAr[s.day_of_week] : dayNamesEn[s.day_of_week];
        const dateLabel = s.date ? fmtDate(s.date) : "";
        const dayPart = dateLabel ? `${day}${isAr ? "، " : ", "}${dateLabel}` : day;
        // The booking carries the student's own zone, so each slot is stated in
        // their time with the slot's home time in brackets.
        const ct = renderClassTime({
          date: s.date, time: s.start_time,
          slotTz: s.timezone || "Africa/Cairo",
          studentTz: p.student_timezone, isAr,
        });
        return `<div style="background-color: ${BRAND_GRAY}; border: 1px solid #e0e0e0; border-radius: 8px; padding: 12px 16px; margin: 8px 0; ${isAr ? "text-align: right;" : ""}">
          <p style="margin: 0; font-weight: bold; color: ${BRAND_DARK};">📅 ${dayPart}</p>
          <p style="margin: 4px 0 0; color: ${BRAND_MUTED}; font-size: 13px;">⏰ ${ct.timeLine}</p>
        </div>`;
      }).join("")
    : "";

  const localTimeNote = isAr
    ? `<p style="color: ${BRAND_MUTED}; font-size: 13px; margin: 0 0 14px;">🌍 عند فتح صفحة الحجز، كل ميعاد بيظهر <strong>بتوقيت بلدك</strong> تلقائيًا.</p>`
    : `<p style="color: ${BRAND_MUTED}; font-size: 13px; margin: 0 0 14px;">🌍 When you open the booking page, every time is shown in <strong>your own local time</strong> automatically.</p>`;

  // A real deadline, derived from the dates in the letter rather than typed —
  // it cannot contradict the slot cards above it or go stale on a re-send.
  // "I'll book later" is the most common way a free offer dies.
  const lastDate = slots.map((s) => s.date).filter(Boolean).sort().pop();
  const deadlineNote = lastDate
    ? (isAr
        ? `<p style="color: ${BRAND_MUTED}; font-size: 13px; margin: 0 0 14px;">🗓️ المواعيد دي كلها في نفس الأسبوع — آخر واحد فيهم <strong>${fmtDate(lastDate as string)}</strong>.</p>`
        : `<p style="color: ${BRAND_MUTED}; font-size: 13px; margin: 0 0 14px;">🗓️ These dates are all in the same week — the last one is <strong>${fmtDate(lastDate as string)}</strong>.</p>`)
    : "";

  const minutes = p.trial_duration_min || TRIAL_MINUTES;
  const minutesLabel = isAr ? toArabicDigits(minutes) : String(minutes);

  /**
   * The objection this answers is not price — the class is free. It is "will I
   * be put on the spot in front of strangers", which is the real reason people
   * do not turn up to a first language class. So: how long, camera optional,
   * and one concrete thing they will walk away having done.
   */
  const whatHappens = isAr
    ? `<div style="background-color: ${BRAND_GRAY}; border-radius: 10px; padding: 16px 20px; margin: 20px 0; text-align: right;">
        <p style="margin: 0 0 10px; font-weight: bold; color: ${BRAND_DARK};">الحصة ماشية إزاي؟</p>
        <p style="margin: 0 0 6px; color: ${BRAND_MUTED}; font-size: 14px;">• ${minutesLabel} دقيقة على Google Meet</p>
        <p style="margin: 0 0 6px; color: ${BRAND_MUTED}; font-size: 14px;">• <strong>مش لازم تفتح الكاميرا</strong> — اتفرّج وشارك براحتك</p>
        <p style="margin: 0; color: ${BRAND_MUTED}; font-size: 14px;">• في آخر الحصة <strong>هتكتب اسمك بالكوري</strong></p>
      </div>`
    : `<div style="background-color: ${BRAND_GRAY}; border-radius: 10px; padding: 16px 20px; margin: 20px 0;">
        <p style="margin: 0 0 10px; font-weight: bold; color: ${BRAND_DARK};">What happens in the class?</p>
        <p style="margin: 0 0 6px; color: ${BRAND_MUTED}; font-size: 14px;">• ${minutesLabel} minutes on Google Meet</p>
        <p style="margin: 0 0 6px; color: ${BRAND_MUTED}; font-size: 14px;">• <strong>Camera is optional</strong> — join and take part at your own pace</p>
        <p style="margin: 0; color: ${BRAND_MUTED}; font-size: 14px;">• By the end you'll <strong>write your own name in Korean</strong></p>
      </div>`;

  // The letter came from a brand with no face. A named teacher with a live
  // class is the one thing a language app cannot copy.
  const teacherLine = isAr
    ? `<p style="margin: 0 0 14px;">بتدرّس معايا أنا — <strong>ريهام</strong>. حصة مباشرة معايا، مش فيديو مسجّل ولا تطبيق.</p>`
    : `<p style="margin: 0 0 14px;">You'll be taught by me — <strong>Reham</strong>. A live class with a teacher, not a recorded video or an app.</p>`;

  const meetLinkSection = p.class_link_url
    ? (isAr
        ? `<div style="background-color: #f0fff4; border: 1px solid #6ee7b7; border-radius: 8px; padding: 14px 18px; margin: 20px 0; text-align: center;">
            <p style="margin: 0 0 8px; font-weight: bold; color: ${BRAND_DARK};">🎓 رابط Google Meet (يُفضَّل حفظه ليوم الحصة)</p>
            <a href="${p.class_link_url}" style="display: inline-block; background-color: ${BRAND_YELLOW} !important; color: ${BRAND_BLACK} !important; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">الدخول للكلاس</a>
            <p style="margin: 8px 0 0; color: ${BRAND_MUTED}; font-size: 12px;">ملاحظة: الرابط ده شخصي — من فضلك ما تشاركهوش مع حد.</p>
          </div>`
        : `<div style="background-color: #f0fff4; border: 1px solid #6ee7b7; border-radius: 8px; padding: 14px 18px; margin: 20px 0; text-align: center;">
            <p style="margin: 0 0 8px; font-weight: bold; color: ${BRAND_DARK};">🎓 Your Google Meet link (save it for class day)</p>
            <a href="${p.class_link_url}" style="display: inline-block; background-color: ${BRAND_YELLOW} !important; color: ${BRAND_BLACK} !important; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">Join the Class</a>
            <p style="margin: 8px 0 0; color: ${BRAND_MUTED}; font-size: 12px;">Note: this link is personal — please don't share it.</p>
          </div>`)
    : "";

  const chooseBtn = `<div style="margin: 24px 0; text-align: center;">
    <a href="${url}" style="display: inline-block; background-color: ${BRAND_YELLOW} !important; color: ${BRAND_BLACK} !important; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">
      ${isAr ? "احجز موعدك" : "Choose My Date"}
    </a>
  </div>`;

  // The missing half of this letter. A free class with nothing after it is a
  // pleasant hour that converts nobody.
  //
  // "Same day, same time, the week after" is true by construction: the Hangul
  // cohorts run Fri and Sat 15:00 Africa/Cairo and the Arabic Friday and
  // English Sunday trials are 15:00 too. Relative rather than dated, so it
  // cannot go stale between sends.
  const nextStep = isAr
    ? `<div style="border: 1px dashed #d1d5db; border-radius: 10px; padding: 16px 20px; margin: 22px 0; text-align: right;">
        <p style="margin: 0 0 8px; font-weight: bold; color: ${BRAND_DARK};">وبعد الحصة التجريبية؟</p>
        <p style="margin: 0 0 6px; color: ${BRAND_MUTED}; font-size: 14px; line-height: 1.7;">
          كورس <strong>تأسيس الهانغل</strong> بيبدأ بعدها بأسبوع — <strong>نفس اليوم ونفس الساعة</strong>.
          ٤ حصص، الحصة ٦٠ دقيقة، وفي آخرها تقدر تقرا وتكتب أي كلمة كورية.
        </p>
        <a href="${coursesUrl}" style="color: ${BRAND_DARK}; font-size: 13px; font-weight: bold;">تفاصيل الكورس والأسعار ←</a>
      </div>`
    : `<div style="border: 1px dashed #d1d5db; border-radius: 10px; padding: 16px 20px; margin: 22px 0;">
        <p style="margin: 0 0 8px; font-weight: bold; color: ${BRAND_DARK};">And after the trial?</p>
        <p style="margin: 0 0 6px; color: ${BRAND_MUTED}; font-size: 14px; line-height: 1.7;">
          The <strong>Hangul Foundation</strong> course starts a week later — <strong>same day, same time</strong>.
          Four classes of 60 minutes, and by the end you can read and write any Korean word.
        </p>
        <a href="${coursesUrl}" style="color: ${BRAND_DARK}; font-size: 13px; font-weight: bold;">Course details and prices →</a>
      </div>`;

  // Anyone none of the four dates suit used to have nothing to do but close
  // the email. This turns a silent no into a message that also says which day
  // to open next.
  const noneSuit = isAr
    ? `<p style="margin: 0 0 14px;">مش مناسب أي ميعاد فيهم؟ <a href="${waUrl}" style="color: ${BRAND_DARK}; font-weight: bold;">ابعتلنا على واتساب</a> وقول لنا اليوم اللي يناسبك — بنفتح مواعيد جديدة على أساس الردود دي.</p>`
    : `<p style="margin: 0 0 14px;">None of these times work? <a href="${waUrl}" style="color: ${BRAND_DARK}; font-weight: bold;">Message us on WhatsApp</a> and tell us which day suits you — new slots get opened based on exactly these replies.</p>`;

  const seats = isAr ? toArabicDigits(TRIAL_CAPACITY) : String(TRIAL_CAPACITY);

  if (isAr) {
    return {
      subject: "KLovers — حصتك التجريبية المجانية جاهزة للحجز 🎉",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 22px;">أهلاً ${p.name}! 👋</h1>
        <p>حصتك الكورية التجريبية المجانية <strong>جاهزة للحجز</strong>. دي المواعيد المتاحة:</p>
        ${slotCards}
        ${localTimeNote}
        ${deadlineNote}
        <p>كل ميعاد بلغة واحدة بس — الميعاد <strong>الإنجليزي</strong> حصته كلها بالإنجليزي، و<strong>العربي</strong> كلها بالعربي.</p>
        <p>الأماكن محدودة بـ <strong>${seats} لكل حصة</strong>، ويُفضَّل الحجز بدري.</p>
        ${whatHappens}
        ${teacherLine}
        ${chooseBtn}
        ${meetLinkSection}
        ${nextStep}
        ${noneSuit}
        <p>ولو الحصة كمّلت قبل الحجز، هنبعت المواعيد اللي بعدها — <strong>المكان في القائمة محفوظ</strong>، ومش محتاج أي إجراء.</p>
        <p style="color: ${BRAND_MUTED}; font-size: 13px; margin-top: 20px;">أي سؤال؟ الرد على الإيميل ده، أو على واتساب:</p>
        <div style="margin: 8px 0 4px; text-align: center;">
          <a href="${waUrl}" style="display: inline-block; background-color: #25D366 !important; color: #ffffff !important; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">💬 واتساب</a>
        </div>
      `, true),
    };
  }

  return {
    subject: "KLovers — your free trial is ready to book 🎉",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Hi ${p.name}! 👋</h1>
      <p>Your free Korean trial class is <strong>ready to book</strong>. Here are the available dates:</p>
      ${slotCards}
      ${localTimeNote}
      ${deadlineNote}
      <p>Each slot is taught in one language only — pick an <strong>English</strong> slot and the class runs in English, an <strong>Arabic</strong> slot and it runs in Arabic.</p>
      <p>Places are limited to <strong>${seats} per class</strong>, so it is worth booking early.</p>
      ${whatHappens}
      ${teacherLine}
      ${chooseBtn}
      ${meetLinkSection}
      ${nextStep}
      ${noneSuit}
      <p>If a class fills up before you book, we'll send the next set of dates — <strong>your place on the list is kept</strong>, and there's nothing you need to do.</p>
      <p style="color: ${BRAND_MUTED}; font-size: 13px; margin-top: 20px;">Any questions? Reply to this email, or message us on WhatsApp:</p>
      <div style="margin: 8px 0 4px; text-align: center;">
        <a href="${waUrl}" style="display: inline-block; background-color: #25D366 !important; color: #ffffff !important; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">💬 WhatsApp</a>
      </div>
    `),
  };
}
