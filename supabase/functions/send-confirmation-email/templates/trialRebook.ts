/**
 * The trial invitation — "enrolment is open for the free trial class".
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
 * WHAT DOES NOT GO IN THIS LETTER — set by Re, 15 September 2026
 * --------------------------------------------------------------
 * **The seat count.** Capacity is an internal operating number. The reader has
 * no decision to make with it and no way to check it, so stating it only
 * creates something that can be wrong — and it was, three times over. The
 * constant said 8 while `trial_slots` said 15; it said 15 while they said 25.
 * Every one of the 31 letters sent on 15 September quoted a number that
 * matched no class the reader could book.
 *
 * The fix is not to wire the number to the database. It is to not print it.
 * A number that is never stated cannot go stale. If capacity ever becomes
 * something a reader needs — a genuinely contended class — say it as a fact
 * about that class in that letter, not as a constant in this file.
 *
 * TONE RULES — set by Re, 15 September 2026
 * -----------------------------------------
 * See `claude/CUSTOMER_MESSAGE_TONE_RULE.md`. Three of the five rules bite in
 * this file and each one removed something that used to be here:
 *
 *  • **Rule 3, neutral tone.** Every emoji is gone — subject line included —
 *    along with the exclamation marks and the scarcity nudge ("so it is worth
 *    booking early"). The seat count went too, for the reason above: a count
 *    next to a deadline reads as pressure whatever the words around it say.
 *    State the offer; let them decide.
 *
 *  • **Rule 5, every outreach is a new enrolment.** The letter never refers to
 *    a previous booking, a missed class, or time elapsed — not even softly.
 *    Most readers of this letter booked months ago and heard nothing back;
 *    the temptation to acknowledge that is exactly what the rule forbids. The
 *    old row is how we know who to write to, and that is all it is.
 *
 *  • **Rule 2/4, WhatsApp and chrome.** WhatsApp appears twice: as an inline
 *    hyperlink where it sits inside a sentence, and as the green button that
 *    closes the letter — Re compared both in her own inbox and kept the
 *    button, because for this audience a green pill reads as WhatsApp before a
 *    word of it does. See the contactLine comment below. The header and footer
 *    come from `brandWrapper` and are never overridden here.
 *
 * WHAT THE TRIAL IS
 * -----------------
 * An introduction, not a lesson. Thirty minutes, shared with a room of other
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
 * be avoided ("صفحة الحجز بتعرض…", "الحجز بياخد أقل من دقيقة"), unmarked forms
 * where one cannot. No sentence marks the reader's gender.
 */

import type { EmailPayload } from "./common.ts";
import {
  BRAND_BLACK, BRAND_YELLOW, BRAND_DARK, BRAND_GRAY, BRAND_MUTED,
  SITE_URL, WHATSAPP_URL, brandWrapper, renderClassTime,
} from "./common.ts";

/**
 * Minutes in a trial class. The trial is 30; the Hangul course that follows is
 * 60 per class. Two different numbers for two different things — keep them
 * apart. Overridden by the payload where the caller knows better.
 *
 * This is the only capacity-or-duration number left in the file, and it is
 * here because the reader genuinely needs it: half an hour is a different
 * commitment from two hours. Compare the removed seat count — see the header.
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
        // A table with a coloured first cell, not a div with a border-left:
        // Outlook drops border-left on a div, which would leave four
        // identical grey slabs. As cells, the yellow edge survives.
        return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width: 100%; border-collapse: separate; margin: 10px 0;" dir="${isAr ? "rtl" : "ltr"}">
          <tr>
            <td width="4" style="width: 4px; background-color: ${BRAND_YELLOW}; font-size: 0; line-height: 0;">&nbsp;</td>
            <td style="background-color: #fafafa; border: 1px solid #ebebeb; ${isAr ? "border-right: 0;" : "border-left: 0;"} padding: 13px 18px; ${isAr ? "text-align: right;" : ""}">
              <div style="font-weight: 700; color: ${BRAND_DARK}; font-size: 15.5px; line-height: 1.4;">${dayPart}</div>
              <div style="margin-top: 3px; color: ${BRAND_MUTED}; font-size: 13.5px;">${ct.timeLine}</div>
            </td>
          </tr>
        </table>`;
      }).join("")
    : "";

  const localTimeNote = isAr
    ? `<p style="color: ${BRAND_MUTED}; font-size: 13px; margin: 0 0 12px;">صفحة الحجز بتعرض كل ميعاد بتوقيت بلدك تلقائيًا.</p>`
    : `<p style="color: ${BRAND_MUTED}; font-size: 13px; margin: 0 0 12px;">The booking page shows every time in your own local time, automatically.</p>`;

  // A real deadline, derived from the dates in the letter rather than typed —
  // it cannot contradict the slot cards above it or go stale on a re-send.
  //
  // Rule 3 note: a plain date is neutral and belongs here. What is NOT allowed
  // is dressing it as pressure — "hurry", "last chance", a countdown. The
  // reader is told when the dates run out and decides for themselves.
  const lastDate = slots.map((s) => s.date).filter(Boolean).sort().pop();
  const deadlineNote = lastDate
    ? (isAr
        ? `<p style="color: ${BRAND_MUTED}; font-size: 13px; margin: 0 0 14px;">المواعيد دي كلها في نفس الأسبوع، وآخرها <strong>${fmtDate(lastDate as string)}</strong>.</p>`
        : `<p style="color: ${BRAND_MUTED}; font-size: 13px; margin: 0 0 14px;">These dates are all in the same week — the last is <strong>${fmtDate(lastDate as string)}</strong>.</p>`)
    : "";

  const minutes = p.trial_duration_min || TRIAL_MINUTES;
  const minutesLabel = isAr ? toArabicDigits(minutes) : String(minutes);

  /**
   * WHAT THE 30 MINUTES ACTUALLY ARE — and what they are not.
   *
   * This box used to promise "by the end you'll write your own name in
   * Korean". That is a LESSON, and the trial is not one. Reham's words: the
   * trial exists so a person can hear how the course works, find out which
   * level they belong in, and meet the teacher — in thirty minutes, in a room
   * with other people. Teaching Hangul to a room of strangers in half an hour
   * is not something that happens, so the letter was selling an outcome the
   * session cannot deliver, and every attendee would have discovered that
   * during it.
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
            <p style="margin: 0 0 10px; font-weight: bold; color: ${BRAND_DARK};">رابط Google Meet — يُفضَّل حفظه ليوم الحصة</p>
            <a href="${p.class_link_url}" style="display: inline-block; background-color: ${BRAND_YELLOW} !important; color: ${BRAND_BLACK} !important; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">الدخول للكلاس</a>
            <p style="margin: 10px 0 0; color: ${BRAND_MUTED}; font-size: 12px;">الرابط ده شخصي — من فضلك ما تشاركهوش مع حد.</p>
          </div>`
        : `<div style="background-color: #f0fff4; border: 1px solid #6ee7b7; border-radius: 10px; padding: 16px 20px; margin: 22px 0; text-align: center;">
            <p style="margin: 0 0 10px; font-weight: bold; color: ${BRAND_DARK};">Your Google Meet link — save it for class day</p>
            <a href="${p.class_link_url}" style="display: inline-block; background-color: ${BRAND_YELLOW} !important; color: ${BRAND_BLACK} !important; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">Join the Class</a>
            <p style="margin: 10px 0 0; color: ${BRAND_MUTED}; font-size: 12px;">This link is personal — please don't share it.</p>
          </div>`)
    : "";

  // The one action the letter is for, so it is given the weight of one: a
  // wide bar rather than a modest inline button, and a line under it that
  // removes the last hesitation before the click.
  //
  // The border is solid black rather than a 25%-alpha black. Outlook does not
  // composite rgba on a border and falls back to nothing, which left the
  // yellow bar edgeless there — and yellow needs its edge, which is the same
  // reason the site carries a `.text-outlined` utility for this colour.
  //
  // The line under it states two facts — a minute, no card — rather than
  // urging. Under Rule 3 that is the difference between informing and pushing.
  const chooseBtn = `<div style="margin: 28px 0 10px; text-align: center;">
    <a href="${url}" style="display: block; background-color: ${BRAND_YELLOW} !important; color: ${BRAND_BLACK} !important; padding: 17px 24px; border-radius: 10px; text-decoration: none; font-weight: 800; font-size: 17px; letter-spacing: 0.2px; border: 2px solid ${BRAND_BLACK}; text-align: center;">
      ${isAr ? "احجز موعدك" : "Choose My Date"}
    </a>
    <p style="margin: 10px 0 0; color: ${BRAND_MUTED}; font-size: 12.5px;">${isAr ? "الحجز بياخد أقل من دقيقة، ومن غير أي دفع." : "Booking takes under a minute. No payment, no card."}</p>
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
  //
  // WhatsApp is a hyperlink HERE and a button below, on purpose: this one sits
  // mid-sentence, where a button cannot go without breaking the line.
  const noneSuit = isAr
    ? `<p style="margin: 0 0 16px;">لو مفيش ميعاد مناسب، <a href="${waUrl}" style="color: ${BRAND_DARK}; font-weight: 700; text-decoration: underline;">تواصل معنا على واتساب</a> وقول لنا اليوم اللي يناسبك — بنفتح مواعيد جديدة بناءً على الردود دي.</p>`
    : `<p style="margin: 0 0 16px;">If none of these work, <a href="${waUrl}" style="color: ${BRAND_DARK}; font-weight: 700; text-decoration: underline;">message us on WhatsApp</a> and tell us which day suits you — new slots get opened on exactly these replies.</p>`;

  /**
   * The closing contact block — a green WhatsApp button.
   *
   * It was briefly made an underlined hyperlink, on the argument that #25D366
   * is a third colour in a two-colour brand and competes with the yellow CTA
   * above it. Re looked at both in her inbox and chose the button, so the
   * button is what ships. Her reasoning holds up: for this audience WhatsApp
   * IS the reply channel, and a green pill is recognised as WhatsApp before a
   * word of it is read — a line of underlined text is not. The competition
   * with the yellow CTA is also less real than it looked, because the two are
   * separated by several blocks and ask for different things: book a date, or
   * ask a question.
   *
   * Rule 3 still applies inside it. The button used to read "💬 واتساب" — the
   * emoji is gone, the button is not. Neutral tone governs the words and the
   * decoration, not whether a link may be a button.
   *
   * Keep the green to WhatsApp alone. It is the one place in any Klovers email
   * where a third colour is allowed, because it is not ours — it is the mark
   * of the channel it opens.
   */
  const contactLine = isAr
    ? `<p style="color: ${BRAND_MUTED}; font-size: 13px; margin: 22px 0 10px;">أي استفسار؟ رد على الإيميل ده، أو تواصل معنا على واتساب:</p>
      <div style="margin: 0 0 4px; text-align: center;">
        <a href="${waUrl}" style="display: inline-block; background-color: #25D366 !important; color: #ffffff !important; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">واتساب</a>
      </div>`
    : `<p style="color: ${BRAND_MUTED}; font-size: 13px; margin: 22px 0 10px;">Any questions? Reply to this email, or message us on WhatsApp:</p>
      <div style="margin: 0 0 4px; text-align: center;">
        <a href="${waUrl}" style="display: inline-block; background-color: #25D366 !important; color: #ffffff !important; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">WhatsApp</a>
      </div>`;

  if (isAr) {
    return {
      subject: "KLovers — التسجيل مفتوح في الحصة التجريبية المجانية",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 23px; margin: 0 0 16px;">أهلاً ${p.name}،</h1>
        <p style="margin: 0 0 16px;">التسجيل مفتوح في حصة تجريبية مجانية للغة الكورية — دي المواعيد المتاحة:</p>
        ${slotCards}
        ${localTimeNote}
        ${deadlineNote}
        <p style="margin: 0 0 14px;">كل ميعاد بلغة واحدة: الميعاد <strong>الإنجليزي</strong> حصته بالإنجليزي بالكامل، و<strong>العربي</strong> بالعربي بالكامل.</p>
        ${whatHappens}
        ${teacherBox}
        ${chooseBtn}
        ${meetLinkSection}
        ${nextStep}
        ${noneSuit}
        <p style="margin: 0 0 16px;">ولو الحصة اكتملت قبل الحجز، هنبعت المواعيد التالية تلقائيًا — <strong>مكانك في القائمة محفوظ</strong>.</p>
        ${contactLine}
      `, true),
    };
  }

  return {
    subject: "KLovers — enrolment is open for the free trial class",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 23px; margin: 0 0 16px;">Hi ${p.name},</h1>
      <p style="margin: 0 0 16px;">Enrolment is open for a free Korean trial class — here are the available dates:</p>
      ${slotCards}
      ${localTimeNote}
      ${deadlineNote}
      <p style="margin: 0 0 14px;">Each slot is taught in one language only: an <strong>English</strong> slot runs entirely in English, an <strong>Arabic</strong> slot entirely in Arabic.</p>
      ${whatHappens}
      ${teacherBox}
      ${chooseBtn}
      ${meetLinkSection}
      ${nextStep}
      ${noneSuit}
      <p style="margin: 0 0 16px;">If a class fills up before you book, we'll send the next set of dates automatically — <strong>your place on the list is kept</strong>.</p>
      ${contactLine}
    `),
  };
}
