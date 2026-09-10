// The letter a student gets the moment the placement test is finished.
//
// Until now the placement test sent NOTHING. Someone answered every question,
// saw a level on the screen, and that was the end of it — no letter, no times,
// no way back in. The whole point of the test is to end with a seat, so this
// letter carries the three things that turn a result into one: the level, the
// times of the group at that level, and one link that books the place.
//
// TWO THINGS THIS TEMPLATE DOES NOT DO
// ------------------------------------
// 1. It never addresses the reader as male or female. Klovers does not record
//    anyone's gender and must not guess it from a name, so every sentence that
//    wanted a verb aimed at the reader uses a VERBAL NOUN (مصدر) instead —
//    "تأكيد الميعاد", not "أكّدي ميعادك". Arabic verbal nouns carry no gender.
//    If a line is ever added here, it has to pass the same test.
// 2. It never invents a group. Levels 4-6 have no group running, and the honest
//    version of that is to say so and promise a personal message — not to show
//    a booking button that leads to an empty list. The trigger raises an admin
//    notification in the same breath, so the promise is one Re actually sees.
import {
  BRAND_BLACK, BRAND_YELLOW, BRAND_DARK, BRAND_GRAY, BRAND_MUTED,
  SITE_URL, brandWrapper, unsubscribeFooter,
  type EmailPayload,
} from "./common.ts";

/**
 * The two fields this template needs that no other template does.
 *
 * They are declared here rather than added to `EmailPayload` in common.ts on
 * purpose: common.ts is 18 KB and is the single import of all 25 existing
 * templates, and the assistant's only write path is a whole-file rewrite. A
 * transcription slip in that file breaks every letter Klovers sends. Two
 * optional fields in the one file that reads them costs nothing and risks
 * nothing. Both are optional, so a plain `EmailPayload` still satisfies this.
 */
export type PlacementResultPayload = EmailPayload & {
  /** schedule_packages.day_of_week for the group at this level. 0 = Sunday. */
  group_days_dow?: number[];
  /** Phone, country or timezone still missing from the profile. */
  needs_profile?: boolean;
};

// 0 = Sunday, the convention used by schedule_packages.day_of_week.
const DAY_AR = ["الأحد", "الاتنين", "التلات", "الأربع", "الخميس", "الجمعة", "السبت"];
const DAY_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function toArabicDigits(s: string): string {
  return s.replace(/[0-9]/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
}

function dayList(dows: number[], isAr: boolean): string {
  const names = dows
    .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
    .map((d) => (isAr ? DAY_AR : DAY_EN)[d]);
  if (names.length === 0) return "";
  if (names.length === 1) return names[0];
  const last = names.pop()!;
  return isAr ? `${names.join("، ")} و${last}` : `${names.join(", ")} & ${last}`;
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

export function buildPlacementResultEmail(payload: PlacementResultPayload): { subject: string; html: string } {
  const isAr = payload.language === "ar";
  // index.ts has already turned `level` into a label a student can read.
  // `slot_level` still holds the raw key, which is what tells us whether this
  // is the from-the-alphabet group rather than a continuing one.
  const levelLabel = payload.level || "";
  const isHangul = HANGUL_KEYS.has((payload.slot_level || "").toLowerCase());

  const dows = Array.isArray(payload.group_days_dow) ? payload.group_days_dow : [];
  const hasGroup = dows.length > 0 && !!payload.group_time;
  const days = dayList([...dows], isAr);
  const time = timeLabel(payload.group_time || "", isAr);
  const cityAr = !payload.group_timezone || payload.group_timezone === "Africa/Cairo"
    ? "القاهرة"
    : payload.group_timezone.split("/").pop()!.replace(/_/g, " ");
  const cityEn = (payload.group_timezone || "Africa/Cairo").split("/").pop()!.replace(/_/g, " ");

  const scheduleUrl = `${SITE_URL}/dashboard/schedule`;
  const profileUrl = `${SITE_URL}/complete-profile?email=${encodeURIComponent(payload.email || "")}`;

  const levelBox = `
    <div style="background-color:${BRAND_YELLOW};border:2px solid ${BRAND_BLACK};border-radius:10px;padding:22px;margin:0 0 20px;text-align:center;">
      <p style="margin:0 0 4px;color:${BRAND_DARK};font-size:13px;font-weight:600;">${isAr ? "المستوى" : "Level"}</p>
      <p style="margin:0;font-size:26px;font-weight:bold;color:${BRAND_BLACK};">${levelLabel}</p>
    </div>`;

  let body: string;

  if (isAr) {
    const opener = isHangul
      ? `<p style="margin:0 0 18px;">يعني <strong>البداية من الأساس</strong> — من الحروف الكورية نفسها، وفيه مجموعة تأسيس جاهزة.</p>`
      : `<p style="margin:0 0 18px;">يعني <strong>البداية مش من الصفر</strong> — الأساس موجود، وفيه مجموعة في نفس المستوى جاهزة.</p>`;

    const groupBlock = hasGroup
      ? `
    <h2 style="color:${BRAND_DARK};font-size:16px;margin:26px 0 12px;">مواعيد المجموعة</h2>
    <table style="width:100%;border-collapse:collapse;margin:0 0 8px;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;">
      <tr>
        <td style="padding:11px 14px;border-bottom:1px solid #f0f0f0;color:${BRAND_MUTED};font-size:13px;width:38%;">الأيام</td>
        <td style="padding:11px 14px;border-bottom:1px solid #f0f0f0;font-weight:bold;color:${BRAND_DARK};font-size:14px;">${days}</td>
      </tr>
      <tr>
        <td style="padding:11px 14px;border-bottom:1px solid #f0f0f0;color:${BRAND_MUTED};font-size:13px;">الميعاد</td>
        <td style="padding:11px 14px;border-bottom:1px solid #f0f0f0;font-weight:bold;color:${BRAND_DARK};font-size:14px;">${time} — بتوقيت ${cityAr}</td>
      </tr>
      <tr>
        <td style="padding:11px 14px;color:${BRAND_MUTED};font-size:13px;">المجموعة</td>
        <td style="padding:11px 14px;font-weight:bold;color:${BRAND_DARK};font-size:14px;">ساعة للحصة · ٨ طلاب بالكتير</td>
      </tr>
    </table>
    <p style="margin:0 0 22px;color:${BRAND_MUTED};font-size:13px;">المجموعة صغيرة عن قصد — عشان يبقى فيه وقت لكل حد يتكلم.</p>

    <div style="background-color:${BRAND_GRAY};border-right:4px solid ${BRAND_YELLOW};border-radius:0 8px 8px 0;padding:16px 18px;margin:0 0 20px;">
      <p style="margin:0 0 6px;font-weight:bold;color:${BRAND_DARK};">فاضل خطوة واحدة</p>
      <p style="margin:0;color:${BRAND_MUTED};font-size:14px;">تأكيد الميعاد من الحساب، عشان المكان يتحجز في المجموعة.</p>
    </div>

    <div style="text-align:center;margin:24px 0 10px;">
      <a href="${scheduleUrl}" style="display:inline-block;background-color:${BRAND_YELLOW} !important;color:${BRAND_BLACK} !important;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;border:2px solid ${BRAND_BLACK};">📅 تأكيد الميعاد</a>
    </div>
    <p style="margin:0 0 22px;color:${BRAND_MUTED};font-size:13px;text-align:center;">الدخول بنفس الإيميل ده — والمواعيد المتاحة للمستوى هتكون جاهزة.</p>
    <p style="margin:0 0 20px;color:${BRAND_MUTED};font-size:14px;">ولو الميعاد ده مش مناسب — الرد على الإيميل ده كفاية، وهنرتّب ميعاد تاني.</p>`
      : `
    <div style="background-color:${BRAND_GRAY};border-right:4px solid ${BRAND_YELLOW};border-radius:0 8px 8px 0;padding:16px 18px;margin:26px 0 20px;">
      <p style="margin:0 0 6px;font-weight:bold;color:${BRAND_DARK};">المستوى ده مالوش مجموعة شغالة دلوقتي</p>
      <p style="margin:0;color:${BRAND_MUTED};font-size:14px;">فالتواصل هيبقى شخصي — رسالة جاية على الإيميل ده بالمتاح للمستوى ده بالظبط، من غير أي خطوة مطلوبة دلوقتي.</p>
    </div>
    <p style="margin:0 0 20px;color:${BRAND_MUTED};font-size:14px;">ولو فيه سؤال قبل كده — الرد على الإيميل ده كفاية.</p>`;

    const profileBlock = payload.needs_profile
      ? `<p style="margin:0 0 20px;color:${BRAND_MUTED};font-size:13px;">وفيه بيانات ناقصة في الحساب (التليفون والدولة والتوقيت) — <a href="${profileUrl}" style="color:${BRAND_DARK};font-weight:bold;">استكمالها من هنا</a> بيخلي المواعيد تظهر بتوقيتك الصح.</p>`
      : "";

    body = `
    <h1 style="color:${BRAND_DARK};font-size:20px;margin:0 0 8px;">أهلاً ${payload.name} 👋</h1>
    <p style="margin:0 0 20px;color:${BRAND_MUTED};font-size:14px;">دي نتيجة اختبار تحديد المستوى.</p>
    ${levelBox}
    ${opener}
    ${groupBlock}
    ${profileBlock}
    <p style="margin:22px 0 0;color:#333333;">ريهام الشرقاوي</p>
    ${unsubscribeFooter(payload.unsubscribe_token, true)}`;
  } else {
    const opener = isHangul
      ? `<p style="margin:0 0 18px;">That means <strong>starting from the alphabet itself</strong> — and there is a foundation group ready to join.</p>`
      : `<p style="margin:0 0 18px;">That means <strong>not starting from zero</strong> — the base is there, and a group at this level is already running.</p>`;

    const groupBlock = hasGroup
      ? `
    <h2 style="color:${BRAND_DARK};font-size:16px;margin:26px 0 12px;">Group times</h2>
    <table style="width:100%;border-collapse:collapse;margin:0 0 8px;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;">
      <tr>
        <td style="padding:11px 14px;border-bottom:1px solid #f0f0f0;color:${BRAND_MUTED};font-size:13px;width:38%;">Days</td>
        <td style="padding:11px 14px;border-bottom:1px solid #f0f0f0;font-weight:bold;color:${BRAND_DARK};font-size:14px;">${days}</td>
      </tr>
      <tr>
        <td style="padding:11px 14px;border-bottom:1px solid #f0f0f0;color:${BRAND_MUTED};font-size:13px;">Time</td>
        <td style="padding:11px 14px;border-bottom:1px solid #f0f0f0;font-weight:bold;color:${BRAND_DARK};font-size:14px;">${time} — ${cityEn} time</td>
      </tr>
      <tr>
        <td style="padding:11px 14px;color:${BRAND_MUTED};font-size:13px;">Group</td>
        <td style="padding:11px 14px;font-weight:bold;color:${BRAND_DARK};font-size:14px;">1 hour per class · 8 students max</td>
      </tr>
    </table>
    <p style="margin:0 0 22px;color:${BRAND_MUTED};font-size:13px;">The group is small on purpose — so there is room for everyone to speak.</p>

    <div style="background-color:${BRAND_GRAY};border-left:4px solid ${BRAND_YELLOW};border-radius:8px 0 0 8px;padding:16px 18px;margin:0 0 20px;">
      <p style="margin:0 0 6px;font-weight:bold;color:${BRAND_DARK};">One step left</p>
      <p style="margin:0;color:${BRAND_MUTED};font-size:14px;">Confirming the time from the account is what holds the seat in the group.</p>
    </div>

    <div style="text-align:center;margin:24px 0 10px;">
      <a href="${scheduleUrl}" style="display:inline-block;background-color:${BRAND_YELLOW} !important;color:${BRAND_BLACK} !important;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;border:2px solid ${BRAND_BLACK};">📅 Confirm the time</a>
    </div>
    <p style="margin:0 0 22px;color:${BRAND_MUTED};font-size:13px;text-align:center;">Signing in with this same email brings up the times for this level.</p>
    <p style="margin:0 0 20px;color:${BRAND_MUTED};font-size:14px;">If this time does not work — a reply to this email is enough, and another one will be arranged.</p>`
      : `
    <div style="background-color:${BRAND_GRAY};border-left:4px solid ${BRAND_YELLOW};border-radius:8px 0 0 8px;padding:16px 18px;margin:26px 0 20px;">
      <p style="margin:0 0 6px;font-weight:bold;color:${BRAND_DARK};">There is no group running at this level yet</p>
      <p style="margin:0;color:${BRAND_MUTED};font-size:14px;">So this one is handled personally — a message is coming to this address with what is actually available at this level. Nothing to do right now.</p>
    </div>
    <p style="margin:0 0 20px;color:${BRAND_MUTED};font-size:14px;">Any question before then — a reply to this email is enough.</p>`;

    const profileBlock = payload.needs_profile
      ? `<p style="margin:0 0 20px;color:${BRAND_MUTED};font-size:13px;">A few details are still missing from the account (phone, country, timezone) — <a href="${profileUrl}" style="color:${BRAND_DARK};font-weight:bold;">filling those in</a> makes the times show in the right zone.</p>`
      : "";

    body = `
    <h1 style="color:${BRAND_DARK};font-size:20px;margin:0 0 8px;">Hi ${payload.name} 👋</h1>
    <p style="margin:0 0 20px;color:${BRAND_MUTED};font-size:14px;">Here is the placement test result.</p>
    ${levelBox}
    ${opener}
    ${groupBlock}
    ${profileBlock}
    <p style="margin:22px 0 0;color:#333333;">Reham Elshrkawy</p>
    ${unsubscribeFooter(payload.unsubscribe_token, false)}`;
  }

  const subject = isAr
    ? `نتيجة اختبار تحديد المستوى — ${levelLabel}`
    : `Your placement result — ${levelLabel}`;

  return { subject, html: brandWrapper(body, isAr) };
}
