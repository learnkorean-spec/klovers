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
 * The copy is ordered by the objections a reader actually has, in the order
 * they occur: which dates (slots), in my time? (local-time note), how long do
 * I have to decide (deadline), what IS this half hour and will I be put on the
 * spot (what-happens box), who is teaching (teacher box), then the ask, then
 * what comes after, then an exit for anyone none of the dates suit.
 *
 * WHAT THE TRIAL IS
 * -----------------
 * An introduction, not a lesson. Thirty minutes, shared with up to fifteen
 * people: how the course works, which level the reader belongs in, and who is
 * teaching. The letter used to describe it as a first Korean class and promise
 * a learning outcome from it — see the whatHappens comment below for why that
 * had to go. Anything written into this file that reads like teaching content
 * belongs in the course section instead.
 *
 * GENDER
 * ------
 * This was written in the feminine throughout — "احجزي", "اخترتي", "كلمينا",
 * "١٠ طالبات". Most Klovers students are women, but a letter grammatically
 * addressed to women tells every man who gets it that the class is not his.
 * Arabic has no true neuter, so: impersonal constructions wherever a verb can
 * be avoided ("صفحة الحجز بتعرض…", "ننصح بالحجز مبكرًا"), unmarked forms where
 * one cannot. No sentence marks the reader's gender.
 */

import type { EmailPayload } from "./common.ts";
import {
  BRAND_BLACK, BRAND_YELLOW, BRAND_DARK, BRAND_GRAY, BRAND_MUTED,
  SITE_URL, WHATSAPP_URL, brandWrapper, renderClassTime,
} from "./common.ts";

/**
 * Seats per trial class.
 *
 * Matches `trial_slots.capacity`, which migration 20260906120000 raised from
 * 8 to 15. This number was left at 8 by that migration and the letter then
 * told every reader there were 8 places when there were 15 — understating a
 * free class is not a safe error, it is a reason to not bother replying.
 *
 * It is NOT the cohort capacity. The paid Hangul cohorts in
 * `schedule_packages` are deliberately still 8, and that migration asserts it:
 * a trial is a room you sit in once, a cohort is a room you learn in for
 * weeks, and they do not want the same number of people. Do not "fix" the two
 * back into one constant.
 *
 * Hardcoded because `available_slots` carries no capacity field. If
 * `trial_slots.capacity` moves again, move it here in the same commit.
 */
const TRIAL_CAPACITY = 15;

/**
 * Minutes in a trial class. The trial is 30; the Hangul course that follows is
 * 60 per class. Two different numbers for two different things — keep them
 * apart. Overridden by the payload where the caller knows better.
 */
const TRIAL_MINUTES = 30;

/**
 * When the Hangul course actually runs.
 *
 * ⚠ This used to read "a week after your trial, same day, same time". That was
 * WRONG for three readers in four. The trial slots are Fri 15:00 and Sat 16:30
 * (Arabic), Sun 15:00 and Mon 16:00 (English); the course cohorts opened by
 * migration 20260903000000 are Fri 15:00 (Arabic) and Sat 15:00 (English). So
 * only the Friday Arabic trial matched — everyone else was being told a class
 * time that does not exist.
 *
 * The days are stated outright now, which is what the design was in the first
 * place: one Arabic day, one English day, and the student's track picks which.
 *
 * Hardcoded because a template has no database access. If the cohorts move,
 * change them here and in `schedule_packages` in the same breath.
 */
const COURSE_DAYS_AR = "العربي يوم الجمعة ٣ العصر، والإنجليزي يوم السبت ٣ العصر — بتوقيت القاهرة.";
const COURSE_DAYS_EN = "Arabic track Fridays 3pm, English track Saturdays 3pm — Cairo time.";

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const toArabicDigits = (n: number): string =>
  String(n).replace(/\d/g, (d) => AR_DIGITS[Number(d)]);

export function buildTrialRebookEmail(p: EmailPayload) {
  const isAr = p.language === "ar";
  const url = p.rebook_url || `${SITE_URL}/free-trial`;
  const coursesUrl = `${SITE_URL}/courses`;
  const waUrl = WHATSAPP_URL;

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
        return `<div style="background-color: ${BRAND_GRAY}; border: 1px solid #e6e6e6; border-radius: 10px; padding: 14px 18px; margin: 10px 0; ${isAr ? "text-align: right;" : ""}">
          <p style="margin: 0; font-weight: bold; color: ${BRAND_DARK}; font-size: 15px;">📅 ${dayPart}</p>
          <p style="margin: 5px 0 0; color: ${BRAND_MUTED}; font-size: 13px;">⏰ ${ct.timeLine}</p>
        </div>`;
      }).join("")
    : "";

  const localTimeNote = isAr
    ? `<p style="color: ${BRAND_MUTED}; font-size: 13px; margin: 0 0 12px;">🌍 صفحة الحجز بتعرض كل ميعاد بتوقيت بلدك تلقائيًا.</p>`
    : `<p style="color: ${BRAND_MUTED}; font-size: 13px; margin: 0 0 12px;">🌍 The booking page shows every time in your own local time, automatically.</p>`;

  // A real deadline, derived from the dates in the letter rather than typed —
  // it cannot contradict the slot cards above it or go stale on a re-send.
  // "I'll book later" is the most common way a free offer dies.
  const lastDate = slots.map((s) => s.date).filter(Boolean).sort().pop();
  const deadlineNote = lastDate
    ? (isAr
        ? `<p style="color: ${BRAND_MUTED}; font-size: 13px; margin: 0 0 14px;">🗓️ المواعيد دي كلها في نفس الأسبوع، وآخرها <strong>${fmtDate(lastDate as string)}</strong>.</p>`
        : `<p style="color: ${BRAND_MUTED}; font-size: 13px; margin: 0 0 14px;">🗓️ These dates are all in the same week — the last is <strong>${fmtDate(lastDate as string)}</strong>.</p>`)
    : "";

  const minutes = p.trial_duration_min || TRIAL_MINUTES;
  const minutesLabel = isAr ? toArabicDigits(minutes) : String(minutes);

  /**
   * WHAT THE 30 MINUTES ACTUALLY ARE — and what they are not.
   *
   * This box used to promise "by the end you'll write your own name in
   * Korean". That is a LESSON, and the trial is not one. Reham's words: the
   * trial exists so a person can hear how the course works, find out which
   * level they belong in, and meet the teacher — in thirty minutes, shared
   * with up to fifteen other people. Teaching Hangul to fifteen strangers in
   * half an hour is not something that happens, so the letter was selling an
   * outcome the session cannot deliver, and every attendee would have
   * discovered that during it.
   *
   * A promise a free session breaks costs more than the session earns: the
   * first thing the reader learns about Klovers is that its emails overstate.
   * So the box now says plainly what the half hour is, and puts the real
   * teaching where it belongs — in the course, on the next screen down.
   *
   * The reassurance that mattered is kept and strengthened: camera optional,
   * and now no obligation to speak at all. The objection is still "will I be
   * put on the spot in front of strangers" — and the honest answer is better
   * than the old one, because nobody is being asked to perform.
   */
  const whatHappens = isAr
    ? `<div style="background-color: ${BRAND_GRAY}; border-radius: 12px; padding: 18px 22px; margin: 22px 0; text-align: right;">
        <p style="margin: 0 0 12px; font-weight: bold; color: ${BRAND_DARK}; font-size: 15px;">الجلسة دي إيه بالظبط؟</p>
        <p style="margin: 0 0 10px; color: ${BRAND_MUTED}; font-size: 14px; line-height: 1.8;">${minutesLabel} دقيقة على Google Meet — <strong>تعارف على الكورس، مش أول حصة فيه</strong>. الشرح والدراسة بيبدأوا في الكورس نفسه.</p>
        <p style="margin: 0 0 8px; color: ${BRAND_MUTED}; font-size: 14px;">• إزاي الكورس ماشي: المستويات، المدة، والكتاب</p>
        <p style="margin: 0 0 8px; color: ${BRAND_MUTED}; font-size: 14px;">• <strong>المستوى المناسب لك</strong> — سواء بتبدأ من الصفر أو معاك أساس</p>
        <p style="margin: 0 0 8px; color: ${BRAND_MUTED}; font-size: 14px;">• تتعرف على المدرِّسة وتسأل أي حاجة في بالك</p>
        <p style="margin: 0; color: ${BRAND_MUTED}; font-size: 14px;">• <strong>الكاميرا اختيارية</strong>، ومحدش مطالَب يتكلم — تقدر تسمع وبس</p>
      </div>`
    : `<div style="background-color: ${BRAND_GRAY}; border-radius: 12px; padding: 18px 22px; margin: 22px 0;">
        <p style="margin: 0 0 12px; font-weight: bold; color: ${BRAND_DARK}; font-size: 15px;">What this session actually is</p>
        <p style="margin: 0 0 10px; color: ${BRAND_MUTED}; font-size: 14px; line-height: 1.8;">${minutesLabel} minutes on Google Meet — <strong>an introduction to the course, not its first lesson</strong>. The teaching itself starts in the course.</p>
        <p style="margin: 0 0 8px; color: ${BRAND_MUTED}; font-size: 14px;">• How the course works: the levels, the length, the book</p>
        <p style="margin: 0 0 8px; color: ${BRAND_MUTED}; font-size: 14px;">• <strong>Which level is yours</strong> — whether you're starting at zero or already know some</p>
        <p style="margin: 0 0 8px; color: ${BRAND_MUTED}; font-size: 14px;">• Meet the teacher and ask anything you want</p>
        <p style="margin: 0; color: ${BRAND_MUTED}; font-size: 14px;">• <strong>Camera optional</strong>, and nobody has to speak — you can just listen</p>
      </div>`;

  /**
   * WHO IS TEACHING.
   *
   * The letter came from a brand with no face, and one line saying "Reham,
   * who founded Klovers" answered the wrong question — founding a company is
   * not a reason to trust someone with your Korean. The reader's actual
   * question at this point in the letter is "does this person know the
   * language, and can they teach it".
   *
   * So: the full name, the degree, and the years. Both facts are Reham's own
   * and are stated as she states them. Nothing here is inferred or rounded up.
   */
  const teacherBox = isAr
    ? `<div style="background-color: #fffdf0; border: 1px solid #f0e6a8; border-radius: 12px; padding: 18px 22px; margin: 22px 0; text-align: right;">
        <p style="margin: 0 0 10px; font-weight: bold; color: ${BRAND_DARK}; font-size: 15px;">هتقابل مين؟</p>
        <p style="margin: 0 0 8px; color: ${BRAND_MUTED}; font-size: 14px; line-height: 1.8;">
          <strong>ريهام الشرقاوي</strong> — خرّيجة كلية الألسن، قسم اللغة والأدب الكوري، ومؤسِّسة كلوفرز.
        </p>
        <p style="margin: 0; color: ${BRAND_MUTED}; font-size: 14px; line-height: 1.8;">
          أكتر من ١٣ سنة في تدريس اللغات. الجلسة معاها شخصيًا ومباشرة — مش فيديو مسجّل ولا تطبيق.
        </p>
      </div>`
    : `<div style="background-color: #fffdf0; border: 1px solid #f0e6a8; border-radius: 12px; padding: 18px 22px; margin: 22px 0;">
        <p style="margin: 0 0 10px; font-weight: bold; color: ${BRAND_DARK}; font-size: 15px;">Who you'll meet</p>
        <p style="margin: 0 0 8px; color: ${BRAND_MUTED}; font-size: 14px; line-height: 1.8;">
          <strong>Reham Elshrkawy</strong> — graduate of the Faculty of Al-Alsun, Korean Language and Literature, and the founder of Klovers.
        </p>
        <p style="margin: 0; color: ${BRAND_MUTED}; font-size: 14px; line-height: 1.8;">
          Over 13 years teaching languages. The session is with her, live — not a recorded video or an app.
        </p>
      </div>`;

  const meetLinkSection = p.class_link_url
    ? (isAr
        ? `<div style="background-color: #f0fff4; border: 1px solid #6ee7b7; border-radius: 10px; padding: 16px 20px; margin: 22px 0; text-align: center;">
            <p style="margin: 0 0 10px; font-weight: bold; color: ${BRAND_DARK};">🎓 رابط Google Meet — يُفضَّل حفظه ليوم الحصة</p>
            <a href="${p.class_link_url}" style="display: inline-block; background-color: ${BRAND_YELLOW} !important; color: ${BRAND_BLACK} !important; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">الدخول للكلاس</a>
            <p style="margin: 10px 0 0; color: ${BRAND_MUTED}; font-size: 12px;">الرابط ده شخصي — من فضلك ما تشاركهوش مع حد.</p>
          </div>`
        : `<div style="background-color: #f0fff4; border: 1px solid #6ee7b7; border-radius: 10px; padding: 16px 20px; margin: 22px 0; text-align: center;">
            <p style="margin: 0 0 10px; font-weight: bold; color: ${BRAND_DARK};">🎓 Your Google Meet link — save it for class day</p>
            <a href="${p.class_link_url}" style="display: inline-block; background-color: ${BRAND_YELLOW} !important; color: ${BRAND_BLACK} !important; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">Join the Class</a>
            <p style="margin: 10px 0 0; color: ${BRAND_MUTED}; font-size: 12px;">This link is personal — please don't share it.</p>
          </div>`)
    : "";

  const chooseBtn = `<div style="margin: 26px 0; text-align: center;">
    <a href="${url}" style="display: inline-block; background-color: ${BRAND_YELLOW} !important; color: ${BRAND_BLACK} !important; padding: 15px 36px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 16px; border: 1px solid rgba(0,0,0,0.25);">
      ${isAr ? "احجز موعدك" : "Choose My Date"}
    </a>
  </div>`;

  // The missing half of this letter. A free class with nothing after it is a
  // pleasant half-hour that converts nobody. The days are named rather than
  // described relative to the trial — see COURSE_DAYS_AR above for why.
  const nextStep = isAr
    ? `<div style="border: 1px dashed #d5d5d5; border-radius: 12px; padding: 18px 22px; margin: 24px 0; text-align: right;">
        <p style="margin: 0 0 10px; font-weight: bold; color: ${BRAND_DARK}; font-size: 15px;">وبعد الحصة التجريبية؟</p>
        <p style="margin: 0 0 8px; color: ${BRAND_MUTED}; font-size: 14px; line-height: 1.8;">
          كورس <strong>تأسيس الهانغل</strong> — ٤ حصص، الحصة ٦٠ دقيقة، وفي آخرها تقرأ وتكتب أي كلمة كورية.
        </p>
        <p style="margin: 0 0 10px; color: ${BRAND_MUTED}; font-size: 14px; line-height: 1.8;">
          المواعيد: ${COURSE_DAYS_AR}
        </p>
        <a href="${coursesUrl}" style="color: ${BRAND_DARK}; font-size: 13px; font-weight: bold;">تفاصيل الكورس والأسعار ←</a>
      </div>`
    : `<div style="border: 1px dashed #d5d5d5; border-radius: 12px; padding: 18px 22px; margin: 24px 0;">
        <p style="margin: 0 0 10px; font-weight: bold; color: ${BRAND_DARK}; font-size: 15px;">And after the trial?</p>
        <p style="margin: 0 0 8px; color: ${BRAND_MUTED}; font-size: 14px; line-height: 1.8;">
          The <strong>Hangul Foundation</strong> course — four classes of 60 minutes, and by the end you can read and write any Korean word.
        </p>
        <p style="margin: 0 0 10px; color: ${BRAND_MUTED}; font-size: 14px; line-height: 1.8;">
          When it runs: ${COURSE_DAYS_EN}
        </p>
        <a href="${coursesUrl}" style="color: ${BRAND_DARK}; font-size: 13px; font-weight: bold;">Course details and prices →</a>
      </div>`;

  // Anyone none of the four dates suit used to have nothing to do but close
  // the email. This turns a silent no into the data that decides which day
  // opens next.
  const noneSuit = isAr
    ? `<p style="margin: 0 0 16px;">لو مفيش ميعاد مناسب، <a href="${waUrl}" style="color: ${BRAND_DARK}; font-weight: bold;">كلّمنا على واتساب</a> وقول لنا اليوم اللي يناسبك — بنفتح مواعيد جديدة بناءً على الردود دي.</p>`
    : `<p style="margin: 0 0 16px;">If none of these work, <a href="${waUrl}" style="color: ${BRAND_DARK}; font-weight: bold;">message us on WhatsApp</a> and tell us which day suits you — new slots get opened on exactly these replies.</p>`;

  const seats = isAr ? toArabicDigits(TRIAL_CAPACITY) : String(TRIAL_CAPACITY);

  if (isAr) {
    return {
      subject: "KLovers — حصتك التجريبية المجانية جاهزة للحجز 🎉",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 23px; margin: 0 0 16px;">أهلاً ${p.name}! 👋</h1>
        <p style="margin: 0 0 16px;">حصتك التجريبية المجانية <strong>جاهزة للحجز</strong> — دي المواعيد المتاحة:</p>
        ${slotCards}
        ${localTimeNote}
        ${deadlineNote}
        <p style="margin: 0 0 14px;">كل ميعاد بلغة واحدة: الميعاد <strong>الإنجليزي</strong> حصته بالإنجليزي بالكامل، و<strong>العربي</strong> بالعربي بالكامل.</p>
        <p style="margin: 0 0 6px;">عدد المقاعد <strong>${seats} لكل حصة</strong>، فننصح بالحجز مبكرًا.</p>
        ${whatHappens}
        ${teacherBox}
        ${chooseBtn}
        ${meetLinkSection}
        ${nextStep}
        ${noneSuit}
        <p style="margin: 0 0 16px;">ولو الحصة اكتملت قبل ما تحجز، هنبعتلك المواعيد التالية تلقائيًا — <strong>مكانك في القائمة محفوظ</strong>.</p>
        <p style="color: ${BRAND_MUTED}; font-size: 13px; margin: 22px 0 10px;">أي استفسار؟ رد على الإيميل ده، أو كلّمنا على واتساب:</p>
        <div style="margin: 0 0 4px; text-align: center;">
          <a href="${waUrl}" style="display: inline-block; background-color: #25D366 !important; color: #ffffff !important; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">💬 واتساب</a>
        </div>
      `, true),
    };
  }

  return {
    subject: "KLovers — your free trial is ready to book 🎉",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 23px; margin: 0 0 16px;">Hi ${p.name}! 👋</h1>
      <p style="margin: 0 0 16px;">Your free Korean trial class is <strong>ready to book</strong> — here are the available dates:</p>
      ${slotCards}
      ${localTimeNote}
      ${deadlineNote}
      <p style="margin: 0 0 14px;">Each slot is taught in one language only: an <strong>English</strong> slot runs entirely in English, an <strong>Arabic</strong> slot entirely in Arabic.</p>
      <p style="margin: 0 0 6px;">There are <strong>${seats} places per class</strong>, so it is worth booking early.</p>
      ${whatHappens}
      ${teacherBox}
      ${chooseBtn}
      ${meetLinkSection}
      ${nextStep}
      ${noneSuit}
      <p style="margin: 0 0 16px;">If a class fills up before you book, we'll send the next set of dates automatically — <strong>your place on the list is kept</strong>.</p>
      <p style="color: ${BRAND_MUTED}; font-size: 13px; margin: 22px 0 10px;">Any questions? Reply to this email, or message us on WhatsApp:</p>
      <div style="margin: 0 0 4px; text-align: center;">
        <a href="${waUrl}" style="display: inline-block; background-color: #25D366 !important; color: #ffffff !important; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">💬 WhatsApp</a>
      </div>
    `),
  };
}
