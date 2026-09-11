// The letter a student gets the moment the placement test is finished.
//
// Until now the placement test sent NOTHING. Someone answered every question,
// saw a level on a screen, and that was the end of it — no letter, no times,
// no way back in. The whole point of the test is to end with a seat, so this
// letter carries the three things that turn a result into one: the level, the
// times of the group at that level, and one link that books the place.
//
// TWO THINGS THIS TEMPLATE DOES NOT DO
// ------------------------------------
// 1. It never addresses the reader as male or female. Klovers does not record
//    anyone's gender and must not guess it from a name, so every sentence that
//    wanted a verb aimed at the reader uses a VERBAL NOUN (مصدر) or the
//    passive instead — "تأكيد الميعاد", not "أكّدي ميعادك"; "اتعدّى", not
//    "عدّيتيه". Arabic verbal nouns and passives carry no gender. If a line is
//    ever added here, it has to pass the same test.
// 2. It never invents a group. Levels 4-6 have no group running, and the honest
//    version of that is to say so and promise a personal message — not to show
//    a booking button that leads to an empty list. The trigger raises an admin
//    notification in the same breath, so the promise is one Re actually sees.
//
// THE TWO DAYS ARE A CHOICE, NOT A COMMITMENT
// -------------------------------------------
// This letter used to say "الأحد والأربع" — Sunday AND Wednesday. It is
// Sunday OR Wednesday. A schedule_packages row is ONE weekly slot, and two rows
// at the same level are two times to pick between: student_package_preferences
// is upserted on user_id alone so a student holds exactly one; SchedulePicker
// offers the other rows at the level as "alternatives" when one is full; each
// row carries its own capacity of 8; and the student-facing copy is singular
// throughout ("اختر موعد حصة").
//
// Nobody was booked into the wrong thing — the page only ever lets one slot be
// chosen. But two evenings a week is a different proposition from one, and the
// reader who quietly decides they have not got the time does not write in to
// say so.
//
// The times come per-slot for the same reason. min(start_time) was right only
// because all four levels currently run both their slots at the same hour; a
// level at Monday 15:00 and Thursday 18:00 would have been given one wrong hour
// with nothing to catch it.
//
// THE SCORE, AND WHY IT IS NOT A FRACTION
// ---------------------------------------
// "You scored 9 out of 52" reads as a failure. It is not one: 9 is past the
// Level 1 line, which is exactly what the reader wants to know. So the score
// appears as a POSITION ON THE LADDER — the line just passed, and the next line
// and how far away it is — and never as a ratio of a 52-item paper most
// students deliberately stop partway through.
//
// THE DOOR MARKED "NOT SURE"
// --------------------------
// A letter that hands down a level and offers exactly one action — book the
// seat — leaves a reader who disagrees with nowhere to go, and that reader does
// not write in. They just do not book. So the level is followed by the evidence
// (above) and then by the three facts that make it safe to accept: the test is
// a first estimate, the first class is what settles it, and moving group costs
// nothing. Anyone who wants it settled BEFORE booking gets a WhatsApp link to
// Re, pre-filled with their name and level. A text link, not a second button:
// it must never compete with booking for the reader who is already convinced.
import {
  BRAND_BLACK, BRAND_YELLOW, BRAND_DARK, BRAND_GRAY, BRAND_MUTED,
  SITE_URL, WHATSAPP_URL, brandWrapper, unsubscribeFooter,
  type EmailPayload,
} from "./common.ts";
import { levelLabel, type EmailLanguage } from "../../_shared/levelLabel.ts";

/**
 * The four fields this template needs that no other template does.
 *
 * They are declared here rather than added to `EmailPayload` in common.ts on
 * purpose: common.ts is 18 KB and is the single import of all 25 existing
 * templates, and the assistant's only write path is a whole-file rewrite. A
 * transcription slip in that file breaks every letter Klovers sends. Four
 * optional fields in the one file that reads them costs nothing and risks
 * nothing. All are optional, so a plain `EmailPayload` still satisfies this.
 */
export type PlacementResultPayload = EmailPayload & {
  /** schedule_packages.day_of_week per slot, ascending. 0 = Sunday. */
  group_days_dow?: number[];
  /** "HH:MM" per slot, in the SAME order as group_days_dow. */
  group_times?: string[];
  /** Phone, country or timezone still missing from the profile. */
  needs_profile?: boolean;
  /** placement_tests.score — raw marks out of 52. */
  score?: number;
};

/**
 * MIRROR of EXAM_BANDS in src/constants/topikPapers.ts. Edge functions run in
 * Deno and cannot import from src/, so this is a deliberate duplicate — and
 * scripts/lib/placement-bands.test.mjs fails if the two disagree, so the copy
 * is checked rather than merely intended.
 *
 * The numbers are section boundaries, not percentages: 8 is all of section A,
 * 18 is A+B (through 1급), 28 adds C, 40 adds D. Ascending here because the
 * letter walks UP the ladder looking for the last line a score cleared;
 * topikPapers.ts lists them descending because it is looking for a grade.
 */
const BANDS: Array<{ min: number; key: string }> = [
  { min: 8, key: "l1" },
  { min: 18, key: "l2" },
  { min: 28, key: "l3" },
  { min: 40, key: "l4" },
];

/** Past 4급. Not a level with a line of its own, so it gets no row. */
const ABOVE_MIN = 48;

// 0 = Sunday, the convention used by schedule_packages.day_of_week.
const DAY_AR = ["الأحد", "الاتنين", "التلات", "الأربع", "الخميس", "الجمعة", "السبت"];
const DAY_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function toArabicDigits(s: string): string {
  return s.replace(/[0-9]/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
}

function num(n: number, isAr: boolean): string {
  return isAr ? toArabicDigits(String(n)) : String(n);
}

function dayName(d: number, isAr: boolean): string {
  return (isAr ? DAY_AR : DAY_EN)[d] ?? "";
}

/**
 * "الاتنين أو الخميس" / "Monday or Thursday".
 *
 * OR, not AND. See the note at the top of this file: the days are alternatives
 * and the student attends one of them.
 */
function dayOptions(dows: number[], isAr: boolean): string {
  const names = dows
    .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
    .map((d) => dayName(d, isAr));
  if (names.length === 0) return "";
  if (names.length === 1) return names[0];
  const last = names.pop()!;
  return isAr ? `${names.join("، ")} أو ${last}` : `${names.join(", ")} or ${last}`;
}

/**
 * "16:00" -> "٤:٠٠ العصر" / "4:00 PM".
 *
 * Written out rather than handed to Intl because Intl's ar-EG output is
 * "٤:٠٠ م", and the part of the day is the half a reader actually checks
 * against their own afternoon.
 */
function timeLabel(hhmm: string, isAr: boolean): string {
  const [hStr, mStr] = (hhmm || "").split(":");
  const h = parseInt(hStr ?? "", 10);
  const m = parseInt(mStr ?? "0", 10);
  if (!Number.isFinite(h)) return hhmm || "";
  const mm = String(Number.isFinite(m) ? m : 0).padStart(2, "0");
  const h12 = h % 12 === 0 ? 12 : h % 12;
  if (!isAr) return `${h12}:${mm} ${h < 12 ? "AM" : "PM"}`;
  const part = h < 12 ? "الصبح" : h < 15 ? "الضهر" : h < 18 ? "العصر" : "بالليل";
  return `${toArabicDigits(`${h12}:${mm}`)} ${part}`;
}

const HANGUL_KEYS = new Set(["hangul", "hangul_foundation", "foundation", "level_0"]);

/** Legacy spellings still present on old placement_tests rows. */
function canonicalLevelKey(raw: string): string {
  const v = (raw || "").trim().toLowerCase();
  const legacy: Record<string, string> = {
    level_1: "l1", level_2: "l2", level_3: "l3",
    level_4: "l4", level_5: "l5", level_6: "l6",
    level_0: "hangul", foundation: "hangul", hangul_foundation: "hangul",
  };
  return legacy[v] ?? v;
}

/**
 * Where this score sits on the ladder.
 *
 * Returns null — and the letter then says nothing about the score at all — in
 * these cases, each deliberate:
 *
 *  - no score, or a score below the first line. Someone placed at the alphabet
 *    has no threshold to have passed, and "your score: 2" under that headline
 *    is a mark out of nothing.
 *  - the band this score falls in disagrees with the level on the row. Rows
 *    graded before 9 Sep 2026 used the old stop-at-the-first-failed-section
 *    rule, and a table contradicting the headline above it is worse than no
 *    table.
 */
function ladderPosition(score: number | undefined, levelKey: string) {
  if (typeof score !== "number" || !Number.isFinite(score)) return null;
  if (score < BANDS[0].min) return null;

  let idx = 0;
  for (let i = 0; i < BANDS.length; i += 1) {
    if (score >= BANDS[i].min) idx = i;
  }
  const passed = BANDS[idx];

  // Past 4급 is graded "above", which maps to l5 — still consistent with the
  // top line having been cleared, but there is no next line to show.
  const isAbove = score >= ABOVE_MIN;
  if (!isAbove && passed.key !== levelKey) return null;
  if (isAbove && levelKey !== "l5" && levelKey !== "l4") return null;

  const next = isAbove ? undefined : BANDS[idx + 1];
  return { passed, next, remaining: next ? next.min - score : 0 };
}

export function buildPlacementResultEmail(payload: PlacementResultPayload): { subject: string; html: string } {
  const isAr = payload.language === "ar";
  const lang: EmailLanguage = isAr ? "ar" : "en";
  // index.ts has already turned `level` into a label a student can read.
  // `slot_level` still holds the raw key, which is what tells us whether this
  // is the from-the-alphabet group rather than a continuing one.
  const levelText = payload.level || "";
  const rawKey = canonicalLevelKey(payload.slot_level || "");
  const isHangul = HANGUL_KEYS.has(rawKey);
  const ladder = ladderPosition(payload.score, rawKey);

  const dows = Array.isArray(payload.group_days_dow) ? payload.group_days_dow : [];
  const times = Array.isArray(payload.group_times) ? payload.group_times : [];
  const fallbackTime = payload.group_time || "";
  const hasGroup = dows.length > 0 && (times.length > 0 || !!fallbackTime);
  // One time row when every slot runs at the same hour, which is true of every
  // level today; a day-by-day list the moment it stops being true.
  const sameTime = times.length === 0 || times.every((t) => t === times[0]);
  const oneTime = times[0] || fallbackTime;

  const cityAr = !payload.group_timezone || payload.group_timezone === "Africa/Cairo"
    ? "القاهرة"
    : payload.group_timezone.split("/").pop()!.replace(/_/g, " ");
  const cityEn = (payload.group_timezone || "Africa/Cairo").split("/").pop()!.replace(/_/g, " ");

  const scheduleUrl = `${SITE_URL}/dashboard/schedule`;
  const profileUrl = `${SITE_URL}/complete-profile?email=${encodeURIComponent(payload.email || "")}`;
  // Pre-filled so the reader does not have to explain themselves from scratch,
  // and so Re opens a message that already says who it is and what it is about.
  const askUrl = `${WHATSAPP_URL}?text=${encodeURIComponent(
    isAr
      ? `أهلاً ريهام، أنا ${payload.name}. نتيجة اختبار تحديد المستوى طلعت ${levelText}، وعندي سؤال عن المستوى.`
      : `Hi Reham, this is ${payload.name}. My placement result came out as ${levelText} — I have a question about the level.`,
  )}`;

  const levelBox = `
    <div style="background-color:${BRAND_YELLOW};border:2px solid ${BRAND_BLACK};border-radius:10px;padding:22px;margin:0 0 20px;text-align:center;">
      <p style="margin:0 0 4px;color:${BRAND_DARK};font-size:13px;font-weight:600;">${isAr ? "المستوى" : "Level"}</p>
      <p style="margin:0;font-size:26px;font-weight:bold;color:${BRAND_BLACK};">${levelText}</p>
    </div>`;

  const row = (label: string, value: string, last = false) => `
      <tr>
        <td style="padding:11px 14px;${last ? "" : "border-bottom:1px solid #f0f0f0;"}color:${BRAND_MUTED};font-size:13px;width:44%;">${label}</td>
        <td style="padding:11px 14px;${last ? "" : "border-bottom:1px solid #f0f0f0;"}font-weight:bold;color:${BRAND_DARK};font-size:14px;">${value}</td>
      </tr>`;

  /** The slot rows, in whichever of the two shapes the data calls for. */
  const slotRows = (ar: boolean): string => {
    const city = ar ? cityAr : cityEn;
    if (sameTime) {
      return (
        row(ar ? "الأيام المتاحة" : "Days available", dayOptions([...dows], ar)) +
        row(ar ? "الميعاد" : "Time",
          ar ? `${timeLabel(oneTime, true)} — بتوقيت ${city}` : `${timeLabel(oneTime, false)} — ${city} time`)
      );
    }
    const pairs = dows
      .map((d, i) => `${dayName(d, ar)} ${timeLabel(times[i] || fallbackTime, ar)}`)
      .join(ar ? " · " : " · ");
    return row(
      ar ? "المواعيد المتاحة" : "Times available",
      ar ? `${pairs} — بتوقيت ${city}` : `${pairs} — ${city} time`,
    );
  };

  let body: string;

  if (isAr) {
    const opener = isHangul
      ? `<p style="margin:0 0 18px;">يعني <strong>البداية من الأساس</strong> — من الحروف الكورية نفسها، وفيه مجموعة تأسيس جاهزة.</p>`
      : `<p style="margin:0 0 18px;">يعني <strong>البداية مش من الصفر</strong> — الأساس موجود، وفيه مجموعة في نفس المستوى جاهزة.</p>`;

    const scoreBlock = !ladder ? "" : `
    <h2 style="color:${BRAND_DARK};font-size:16px;margin:0 0 8px;">ليه المستوى ده بالذات؟</h2>
    <p style="margin:0 0 12px;color:${BRAND_MUTED};font-size:14px;">الاختبار ٢٥ سؤال مرتّبين من الأسهل للأصعب، وكل مستوى ليه خط ثابت لازم يتعدّى.</p>
    <table style="width:100%;border-collapse:collapse;margin:0 0 10px;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;">
      ${row("الدرجة", num(payload.score as number, true))}
      ${row(`خط ${levelLabel(ladder.passed.key, lang)}`, `${num(ladder.passed.min, true)} — اتعدّى ✅`, !ladder.next)}
      ${ladder.next ? row(`خط ${levelLabel(ladder.next.key, lang)}`, `${num(ladder.next.min, true)} — فاضل ${num(ladder.remaining, true)}`, true) : ""}
    </table>
    <p style="margin:0 0 22px;color:${BRAND_MUTED};font-size:13px;">يعني الرقم مش نسبة نجاح أو رسوب — هو مكان البداية على السلم.</p>`;

    // The door marked "not sure". After the evidence, before the times.
    const levelCheck = `
    <div style="background-color:${BRAND_GRAY};border-right:4px solid ${BRAND_BLACK};border-radius:0 8px 8px 0;padding:16px 18px;margin:0 0 22px;">
      <p style="margin:0 0 6px;font-weight:bold;color:${BRAND_DARK};">ولو المستوى ده مش مقنع؟</p>
      <p style="margin:0 0 8px;color:${BRAND_MUTED};font-size:14px;">الاختبار تقدير مبدئي بس — اللي بيأكد المستوى فعلاً هي أول حصة. ولو طلع مش مناسب، <strong>النقل لمجموعة تانية متاح ومن غير أي تكلفة</strong>.</p>
      <p style="margin:0;color:${BRAND_MUTED};font-size:14px;">ولو الأفضل التأكد قبل الحجز — <a href="${askUrl}" style="color:${BRAND_DARK};font-weight:bold;">كلمة سريعة مع ريهام على الواتساب</a>، والمستوى يتظبط سوا.</p>
    </div>`;

    const groupBlock = hasGroup
      ? `
    <h2 style="color:${BRAND_DARK};font-size:16px;margin:26px 0 12px;">مواعيد المستوى</h2>
    <table style="width:100%;border-collapse:collapse;margin:0 0 8px;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;">
      ${slotRows(true)}
      ${row("المجموعة", "ساعة للحصة · ٨ طلاب بالكتير", true)}
    </table>
    <p style="margin:0 0 22px;color:${BRAND_MUTED};font-size:13px;"><strong>حصة واحدة في الأسبوع</strong> — المواعيد دي بدائل، واختيار واحد منهم بيتم من الحساب. والمجموعة صغيرة عن قصد — عشان يبقى فيه وقت لكل حد يتكلم.</p>

    <div style="background-color:${BRAND_GRAY};border-right:4px solid ${BRAND_YELLOW};border-radius:0 8px 8px 0;padding:16px 18px;margin:0 0 20px;">
      <p style="margin:0 0 6px;font-weight:bold;color:${BRAND_DARK};">فاضل خطوة واحدة</p>
      <p style="margin:0;color:${BRAND_MUTED};font-size:14px;">اختيار الميعاد من الحساب، عشان المكان يتحجز في المجموعة.</p>
    </div>

    <div style="text-align:center;margin:24px 0 10px;">
      <a href="${scheduleUrl}" style="display:inline-block;background-color:${BRAND_YELLOW} !important;color:${BRAND_BLACK} !important;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;border:2px solid ${BRAND_BLACK};">📅 اختيار الميعاد</a>
    </div>
    <p style="margin:0 0 22px;color:${BRAND_MUTED};font-size:13px;text-align:center;">الدخول بنفس الإيميل ده — والمواعيد المتاحة للمستوى هتكون جاهزة.</p>
    <p style="margin:0 0 20px;color:${BRAND_MUTED};font-size:14px;">ولو مافيش فيهم ميعاد مناسب — الرد على الإيميل ده كفاية، وهنرتّب ميعاد تاني.</p>`
      : `
    <div style="background-color:${BRAND_GRAY};border-right:4px solid ${BRAND_YELLOW};border-radius:0 8px 8px 0;padding:16px 18px;margin:26px 0 20px;">
      <p style="margin:0 0 6px;font-weight:bold;color:${BRAND_DARK};">المستوى ده مالوش مجموعة شغالة دلوقتي</p>
      <p style="margin:0;color:${BRAND_MUTED};font-size:14px;">فالتواصل هيبقى شخصي — رسالة جاية على الإيميل ده بالمتاح للمستوى ده بالظبط، من غير أي خطوة مطلوبة دلوقتي.</p>
    </div>`;

    const profileBlock = payload.needs_profile
      ? `<p style="margin:0 0 20px;color:${BRAND_MUTED};font-size:13px;">وفيه بيانات ناقصة في الحساب (التليفون والدولة والتوقيت) — <a href="${profileUrl}" style="color:${BRAND_DARK};font-weight:bold;">استكمالها من هنا</a> بيخلي المواعيد تظهر بتوقيتك الصح.</p>`
      : "";

    body = `
    <h1 style="color:${BRAND_DARK};font-size:20px;margin:0 0 8px;">أهلاً ${payload.name} 👋</h1>
    <p style="margin:0 0 20px;color:${BRAND_MUTED};font-size:14px;">دي نتيجة اختبار تحديد المستوى.</p>
    ${levelBox}
    ${opener}
    ${scoreBlock}
    ${levelCheck}
    ${groupBlock}
    ${profileBlock}
    <p style="margin:22px 0 0;color:#333333;">ريهام الشرقاوي</p>
    ${unsubscribeFooter(payload.unsubscribe_token, true)}`;
  } else {
    const opener = isHangul
      ? `<p style="margin:0 0 18px;">That means <strong>starting from the alphabet itself</strong> — and there is a foundation group ready to join.</p>`
      : `<p style="margin:0 0 18px;">That means <strong>not starting from zero</strong> — the base is there, and a group at this level is already running.</p>`;

    const scoreBlock = !ladder ? "" : `
    <h2 style="color:${BRAND_DARK};font-size:16px;margin:0 0 8px;">Why this level?</h2>
    <p style="margin:0 0 12px;color:${BRAND_MUTED};font-size:14px;">The test is 52 questions, easiest first, and every level has a fixed line to clear.</p>
    <table style="width:100%;border-collapse:collapse;margin:0 0 10px;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;">
      ${row("Your score", num(payload.score as number, false))}
      ${row(`${levelLabel(ladder.passed.key, lang)} line`, `${ladder.passed.min} — passed ✅`, !ladder.next)}
      ${ladder.next ? row(`${levelLabel(ladder.next.key, lang)} line`, `${ladder.next.min} — ${ladder.remaining} away`, true) : ""}
    </table>
    <p style="margin:0 0 22px;color:${BRAND_MUTED};font-size:13px;">So the number is not a pass or a fail — it is a starting point on the ladder.</p>`;

    const levelCheck = `
    <div style="background-color:${BRAND_GRAY};border-left:4px solid ${BRAND_BLACK};border-radius:8px 0 0 8px;padding:16px 18px;margin:0 0 22px;">
      <p style="margin:0 0 6px;font-weight:bold;color:${BRAND_DARK};">Not convinced by this level?</p>
      <p style="margin:0 0 8px;color:${BRAND_MUTED};font-size:14px;">The test is a first estimate — the first class is what actually settles it. If the level turns out to be wrong, <strong>moving to another group is available at no cost</strong>.</p>
      <p style="margin:0;color:${BRAND_MUTED};font-size:14px;">To settle it before booking instead — <a href="${askUrl}" style="color:${BRAND_DARK};font-weight:bold;">a quick word with Reham on WhatsApp</a>, and the level gets sorted together.</p>
    </div>`;

    const groupBlock = hasGroup
      ? `
    <h2 style="color:${BRAND_DARK};font-size:16px;margin:26px 0 12px;">Times at this level</h2>
    <table style="width:100%;border-collapse:collapse;margin:0 0 8px;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;">
      ${slotRows(false)}
      ${row("Group", "1 hour per class · 8 students max", true)}
    </table>
    <p style="margin:0 0 22px;color:${BRAND_MUTED};font-size:13px;"><strong>One class a week</strong> — these are alternatives, and one of them is chosen from the account. The group is small on purpose, so there is room for everyone to speak.</p>

    <div style="background-color:${BRAND_GRAY};border-left:4px solid ${BRAND_YELLOW};border-radius:8px 0 0 8px;padding:16px 18px;margin:0 0 20px;">
      <p style="margin:0 0 6px;font-weight:bold;color:${BRAND_DARK};">One step left</p>
      <p style="margin:0;color:${BRAND_MUTED};font-size:14px;">Choosing the time from the account is what holds the seat in the group.</p>
    </div>

    <div style="text-align:center;margin:24px 0 10px;">
      <a href="${scheduleUrl}" style="display:inline-block;background-color:${BRAND_YELLOW} !important;color:${BRAND_BLACK} !important;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;border:2px solid ${BRAND_BLACK};">📅 Choose the time</a>
    </div>
    <p style="margin:0 0 22px;color:${BRAND_MUTED};font-size:13px;text-align:center;">Signing in with this same email brings up the times for this level.</p>
    <p style="margin:0 0 20px;color:${BRAND_MUTED};font-size:14px;">If none of them works — a reply to this email is enough, and another one will be arranged.</p>`
      : `
    <div style="background-color:${BRAND_GRAY};border-left:4px solid ${BRAND_YELLOW};border-radius:8px 0 0 8px;padding:16px 18px;margin:26px 0 20px;">
      <p style="margin:0 0 6px;font-weight:bold;color:${BRAND_DARK};">There is no group running at this level yet</p>
      <p style="margin:0;color:${BRAND_MUTED};font-size:14px;">So this one is handled personally — a message is coming to this address with what is actually available at this level. Nothing to do right now.</p>
    </div>`;

    const profileBlock = payload.needs_profile
      ? `<p style="margin:0 0 20px;color:${BRAND_MUTED};font-size:13px;">A few details are still missing from the account (phone, country, timezone) — <a href="${profileUrl}" style="color:${BRAND_DARK};font-weight:bold;">filling those in</a> makes the times show in the right zone.</p>`
      : "";

    body = `
    <h1 style="color:${BRAND_DARK};font-size:20px;margin:0 0 8px;">Hi ${payload.name} 👋</h1>
    <p style="margin:0 0 20px;color:${BRAND_MUTED};font-size:14px;">Here is the placement test result.</p>
    ${levelBox}
    ${opener}
    ${scoreBlock}
    ${levelCheck}
    ${groupBlock}
    ${profileBlock}
    <p style="margin:22px 0 0;color:#333333;">Reham Elshrkawy</p>
    ${unsubscribeFooter(payload.unsubscribe_token, false)}`;
  }

  const subject = isAr
    ? `نتيجة اختبار تحديد المستوى — ${levelText}`
    : `Your placement result — ${levelText}`;

  return { subject, html: brandWrapper(body, isAr) };
}
