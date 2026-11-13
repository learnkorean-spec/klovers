// Shared pieces every email template uses: the payload shape, the brand
// constants, the HTML wrapper and table helpers, the .ics builder, and the
// timezone helpers.
//
// Split out of index.ts on 2026-09-01. index.ts had grown to ~128 KB, past
// what the GitHub contents API accepts in a single write, which made the file
// impossible to edit through the assistant's only write path. The split is a
// pure move: every template renders byte-for-byte what it rendered before,
// checked by rendering all 25 of them in both languages, with and without a
// student timezone, and comparing the output.

export interface EmailPayload {
  email: string;
  name: string;
  plan_type?: string;
  duration?: number;
  sessions_total?: number;
  amount?: number;
  language?: string;
  template?: "welcome" | "enrollment" | "group_match" | "slot_confirmed" | "approval" | "pending_review" | "payment_confirmed" | "class_link" | "payment_method_reminder" | "rejection" | "trial_confirmed" | "trial_rebook_request" | "trial_prep" | "trial_followup_day1" | "trial_followup_day3" | "trial_followup_day7" | "group_forming" | "receipt_nudge" | "group_forming_escalation" | "rejection_followup" | "pre_class_reminder" | "class_feedback" | "trial_attendance_confirmation" | "trial_group_full" | "trial_rollover";
  class_link_url?: string;
  tx_ref?: string;
  payment_date?: string;
  slot_day?: string;
  slot_time?: string;
  slot_timezone?: string;
  first_class_date?: string;
  alert_items?: Array<{ name: string; email: string; days_waiting: number }>;
  unsubscribe_token?: string;
  rebook_url?: string;
  available_slots?: Array<{ day_of_week: number; start_time: string; timezone?: string; date?: string }>;
  enrollment_id?: string;
  rejection_reason?: "payment_not_received" | "time_slots_unavailable" | "other";
  rejection_note?: string;
  resubmit_link?: string;
  group_name?: string;
  group_days?: string;
  group_members?: string[];
  group_time?: string;
  group_timezone?: string;
  group_level?: string;
  custom_message?: string;
  slot_level?: string;
  preferred_day?: string;
  preferred_time?: string;
  timezone?: string;
  level?: string;
  currency?: string;
  trial_date?: string;
  trial_time?: string;
  trial_timezone?: string;
  student_timezone?: string | null;
  trial_duration_min?: number;
  calendar_url?: string;
  booking_id?: string;
  confirmation_token?: string;
  /** Her personal bot link (book-trial). The email carries it as a second way
   *  to get the class link, for the day this very email is the one that is lost. */
  telegram_url?: string;
  meeting_url?: string;
  class_language?: string;
  confirmed_count?: number;
  trial_day_name?: string;
  referral_url?: string;
  previous_trial_date?: string;
  booking_url?: string;
}

// ── Brand constants ──
export const BRAND_BLACK = "#000000";
export const BRAND_YELLOW = "#FFFF00";
export const BRAND_DARK = "#1a1a1a";
export const BRAND_GRAY = "#f5f5f5";
export const BRAND_TEXT = "#333333";
export const BRAND_MUTED = "#666666";

/**
 * Kept for other functions that still reference it (send-class-reminders,
 * send-name-collection-email, abandoned-checkout-recovery each hold their own
 * copy of this constant and their own header).
 *
 * `brandWrapper` below no longer uses it. The file it points at is 41,004
 * bytes — byte for byte the size of favicon.ico, i.e. the favicon doing duty
 * as a logo — and a small bitmap cannot be enlarged into a large sharp one.
 * The mark is drawn now instead. See `brandMark`.
 */
export const LOGO_URL = "https://kloversegy.com/klovers-logo.jpg";
export const SITE_URL = "https://kloversegy.com";
export const WHATSAPP_URL = "https://wa.me/201010003084";
export const FUNCTION_BASE = "https://ewtdgpbybkceokfohhyg.supabase.co/functions/v1";

// City names in Arabic for the zones our students actually book from. A zone
// that is not here falls back to the Latin city name, which is still readable
// - better a Latin "Muscat" than a wrong Arabic guess.
export const TZ_CITY_AR: Record<string, string> = {
  "Africa/Cairo": "القاهرة", "Asia/Muscat": "مسقط", "Asia/Dubai": "دبي",
  "Asia/Riyadh": "الرياض", "Asia/Kuwait": "الكويت", "Asia/Qatar": "الدوحة",
  "Asia/Bahrain": "المنامة", "Asia/Amman": "عمّان", "Asia/Beirut": "بيروت",
  "Asia/Baghdad": "بغداد", "Asia/Damascus": "دمشق", "Asia/Aden": "عدن",
  "Africa/Khartoum": "الخرطوم", "Africa/Tripoli": "طرابلس",
  "Africa/Tunis": "تونس", "Africa/Algiers": "الجزائر",
  "Africa/Casablanca": "الدار البيضاء", "Europe/Istanbul": "إسطنبول",
  "Asia/Kuala_Lumpur": "كوالالمبور", "Asia/Singapore": "سنغافورة",
  "Asia/Jakarta": "جاكرتا", "Asia/Manila": "مانيلا", "Asia/Bangkok": "بانكوك",
  "Asia/Ho_Chi_Minh": "هوشي منه", "Asia/Kolkata": "الهند", "Asia/Karachi": "كراتشي",
  "Asia/Seoul": "سيول", "Asia/Tokyo": "طوكيو", "Asia/Shanghai": "شنغهاي",
  "Europe/London": "لندن", "Europe/Paris": "باريس", "Europe/Berlin": "برلين",
  "America/New_York": "نيويورك", "America/Chicago": "شيكاغو",
  "America/Los_Angeles": "لوس أنجلوس", "America/Toronto": "تورونتو",
  "Australia/Sydney": "سيدني", "UTC": "جرينتش",
};

export function unsubscribeFooter(token: string | undefined, isAr: boolean): string {
  // Always include an unsubscribe link — required by CAN-SPAM / PDPL.
  // If no token is available (guest booking), fall back to a contact-based unsubscribe page.
  const url = token
    ? `${FUNCTION_BASE}/unsubscribe-email?token=${token}&lang=${isAr ? "ar" : "en"}`
    : `${SITE_URL}/unsubscribe`;
  return isAr
    ? `<p style="text-align:center;margin-top:24px;font-size:11px;color:#999">لا تريد استلام هذه الرسائل؟ <a href="${url}" style="color:#999">إلغاء الاشتراك</a></p>`
    : `<p style="text-align:center;margin-top:24px;font-size:11px;color:#999">Don't want these emails? <a href="${url}" style="color:#999">Unsubscribe</a></p>`;
}

/**
 * The Klovers mark, DRAWN rather than loaded.
 *
 * The logo is a yellow disc with a black K on it. That is two HTML elements,
 * and drawing it beats fetching a JPEG on every count that matters in email:
 *
 *  • Sharp at any pixel density. There is no source resolution to outgrow, and
 *    nothing to re-export if the header size ever changes.
 *  • Survives image blocking. Outlook blocks remote images by default and
 *    Gmail's promotions tab frequently does — for those readers the mark was
 *    simply absent. Now it is always there.
 *  • Costs no bytes and no round trip.
 *
 * A table, not a div, because Outlook renders through Word: it sizes a cell
 * from the width/height ATTRIBUTES, and ignores border-radius entirely. There
 * the disc becomes a yellow square with a black K — still the brand, still
 * legible, which is more than a broken-image icon managed.
 *
 * ⚠ `brandWrapper` no longer calls this. Its header is now a one-line lockup
 * (see below) in which the disc has to BE a `<td>` in the same row as the
 * wordmark, not a centred table of its own, so the cell is written inline
 * there. Kept exported, and kept correct, because it is the standalone form
 * of the mark and the three functions that hold their own headers
 * (send-class-reminders, send-name-collection-email,
 * abandoned-checkout-recovery) are the obvious next things to move onto it.
 * If it is still unused when one of those is next opened, delete it then.
 */
export function brandMark(size = 64): string {
  const font = Math.round(size * 0.58);
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 0 auto;">
    <tr>
      <td width="${size}" height="${size}" align="center" valign="middle" style="width: ${size}px; height: ${size}px; background-color: ${BRAND_YELLOW}; border-radius: 50%; font-family: Arial, Helvetica, sans-serif; font-size: ${font}px; font-weight: bold; line-height: ${size}px; color: ${BRAND_BLACK}; text-align: center;">K</td>
    </tr>
  </table>`;
}

/**
 * The frame every email is rendered inside.
 *
 * Design notes, because email is not the web:
 *  • The mark is drawn (see brandMark) and the wordmark is type. Nothing in
 *    this header depends on an image loading.
 *  • Everything is inline styles and simple elements. No flexbox, no CSS grid,
 *    no <style> block: Outlook's rendering engine is Word and supports none
 *    of them.
 *  • The header is black, so a client that strips backgrounds still leaves
 *    yellow type on white rather than yellow on yellow.
 *
 * THE HEADER IS A LOCKUP, NOT A SPLASH SCREEN
 * -------------------------------------------
 * It used to stack four centred things — a 64px disc, then KLOVERS at 26px
 * with 5px of tracking, then a small rule, then the tagline — over 180px of
 * black. On a phone that is most of the first screen spent before the reader
 * reaches a single word that is addressed to them, and it said the brand
 * twice: a disc whose only content is "K", directly above the word KLOVERS.
 *
 * Now the mark and the wordmark sit on ONE line, as a letterhead does, with
 * the tagline tucked under the wordmark. Same four elements of brand, about
 * half the height, and the greeting is visible without scrolling.
 *
 * The 5px yellow strip along the top replaces the height that was carrying
 * the colour. It costs 5px instead of 90 and survives Outlook, which honours
 * a background-color on a block but not much else.
 *
 * Centred rather than left-aligned on purpose: this wrapper renders both the
 * Arabic and English letters, and a lockup pinned to the left edge reads as
 * misplaced in an RTL layout. Centred is correct in both directions.
 *
 * The tagline is #9a9a9a, not #b8b8b8: on black that is a deliberate step
 * back so the wordmark leads. Both clear 4.5:1 against #000.
 */
export function brandWrapper(content: string, isRtl: boolean) {
  const dir = isRtl ? 'direction: rtl; text-align: right;' : '';
  return `
  <div translate="no" class="notranslate" style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 14px; overflow: hidden;">
    <!-- Brand edge: the colour the old header spent 90px of black to carry. -->
    <div style="height: 5px; background-color: ${BRAND_YELLOW}; font-size: 0; line-height: 0;">&nbsp;</div>
    <!-- Header -->
    <div style="background-color: ${BRAND_BLACK}; padding: 20px 24px; text-align: center;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 0 auto;">
        <tr>
          <td width="42" height="42" align="center" valign="middle" style="width: 42px; height: 42px; background-color: ${BRAND_YELLOW}; border-radius: 50%; font-family: Arial, Helvetica, sans-serif; font-size: 25px; font-weight: bold; line-height: 42px; color: ${BRAND_BLACK}; text-align: center;">K</td>
          <td width="12" style="width: 12px; font-size: 0; line-height: 0;">&nbsp;</td>
          <td align="left" valign="middle" style="text-align: left;">
            <div translate="no" class="notranslate" style="color: ${BRAND_YELLOW}; font-size: 23px; font-weight: 700; letter-spacing: 2.5px; line-height: 1.1;">KLOVERS</div>
            <div style="color: #9a9a9a; font-size: 9px; letter-spacing: 2.4px; text-transform: uppercase; padding-top: 4px;">Korean Language Academy</div>
          </td>
        </tr>
      </table>
    </div>
    <!-- Body -->
    <div style="padding: 32px 28px; ${dir} color: ${BRAND_TEXT}; font-size: 15px; line-height: 1.75;">
      ${content}
    </div>
    <!-- Footer -->
    <div style="background-color: ${BRAND_BLACK}; padding: 22px 24px; text-align: center;">
      <p translate="no" class="notranslate" style="color: ${BRAND_YELLOW}; font-size: 13px; margin: 0 0 10px; font-weight: 600;">— The KLovers Team</p>
      <a href="${SITE_URL}" style="color: #cccccc; font-size: 11px; text-decoration: none;">kloversegy.com</a>
      <span style="color: #555555; font-size: 11px;"> &nbsp;·&nbsp; </span>
      <a href="${WHATSAPP_URL}" style="color: #cccccc; font-size: 11px; text-decoration: none;">WhatsApp</a>
    </div>
  </div>`;
}

export function brandButton(text: string, href: string) {
  return `<a href="${href}" style="display: inline-block; background-color: ${BRAND_YELLOW} !important; color: ${BRAND_BLACK} !important; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; border: 2px solid ${BRAND_BLACK};">${text}</a>`;
}

export function brandTable(rows: [string, string][]) {
  return `<table style="width: 100%; border-collapse: collapse; margin: 16px 0; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
    ${rows.map(([label, value]) => `
      <tr>
        <td style="padding: 10px 14px; border-bottom: 1px solid #f0f0f0; color: ${BRAND_MUTED}; font-size: 13px; width: 40%;">${label}</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #f0f0f0; font-weight: bold; color: ${BRAND_DARK}; font-size: 14px;">${value}</td>
      </tr>`).join("")}
  </table>`;
}

export function generateICS(opts: {
  summary: string;
  description: string;
  dtstart: string;
  durationMinutes: number;
  url?: string;
}): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const start = new Date(opts.dtstart);
  const end = new Date(start.getTime() + opts.durationMinutes * 60000);
  const fmt = (d: Date) =>
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
  // LOCATION, not just URL: Google Calendar's own event view (and its "Join"
  // affordance) reads LOCATION, not the VEVENT URL property, so without it
  // the room this .ics carries can be invisible in the very apps students
  // actually open it in.
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//KLovers//Korean Class//EN",
    "BEGIN:VEVENT",
    `UID:klovers-${start.getTime()}@kloversegy.com`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${opts.summary}`,
    `DESCRIPTION:${opts.description.replace(/\n/g, "\\n")}`,
    opts.url ? `URL:${opts.url}` : "",
    opts.url ? `LOCATION:${opts.url}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");
}

// Convert a local date+time string to UTC ISO, given an IANA timezone.
export function localToUTCISO(dateStr: string, timeStr: string, tz: string): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const [hStr, mStr] = timeStr.split(":");
  const h = pad(parseInt(hStr ?? "0", 10));
  const m = pad(parseInt(mStr ?? "0", 10));
  // Treat the desired local time as UTC first, then measure the offset.
  const fakeUTC = new Date(`${dateStr}T${h}:${m}:00Z`);
  if (isNaN(fakeUTC.getTime())) return new Date().toISOString();
  const formatted = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  }).format(fakeUTC).replace(", ", "T").replace("T24:", "T00:");
  const localTime = new Date(formatted + "Z");
  const offsetMs = localTime.getTime() - fakeUTC.getTime();
  return new Date(fakeUTC.getTime() - offsetMs).toISOString();
}

/**
 * "Asia/Muscat" -> "Muscat" (or "مسقط"). The reader recognises the city, not
 * the zone id.
 */
export function tzCity(tz: string, isAr = false): string {
  if (isAr && TZ_CITY_AR[tz]) return TZ_CITY_AR[tz];
  const last = tz.includes("/") ? tz.split("/").pop()! : tz;
  return last.replace(/_/g, " ");
}

/**
 * Render one class time the way the reader actually needs it: their OWN
 * country's time as the headline, and the class's home time in brackets
 * beside it.
 *
 * `studentTz` is the zone the student's browser reported when they booked.
 * It is null for every booking made before that capture shipped, and null
 * whenever the browser gave a zone we could not verify. In that case we do
 * not guess - no country fallback, no phone-prefix fallback. We fall back to
 * the slot's own time paired with GMT, which claims to know nothing about
 * where the reader is.
 *
 * When the student is already in the slot's zone the bracket is dropped: an
 * Egyptian student should read Cairo once, not twice.
 *
 * The date is returned alongside the time because the two travel together -
 * a Cairo evening slot is the next calendar day in Manila, and showing the
 * Cairo date next to a Manila time would send someone on the wrong day.
 */
export function renderClassTime(opts: {
  date?: string | null;
  time?: string | null;
  slotTz: string;
  studentTz?: string | null;
  isAr: boolean;
}): { dateLabel: string; timeLine: string } {
  const { date, time, slotTz, isAr } = opts;
  const fallbackDate = date || "";
  const fallbackTime = time || "";
  if (!date || !time) return { dateLabel: fallbackDate, timeLine: fallbackTime };

  const locale = isAr ? "ar-EG" : "en-US";
  const fmtTime = (d: Date, tz: string) =>
    new Intl.DateTimeFormat(locale, {
      timeZone: tz, hour: "numeric", minute: "2-digit", hour12: true,
    }).format(d);
  const fmtDate = (d: Date, tz: string) =>
    new Intl.DateTimeFormat(locale, {
      timeZone: tz, weekday: "long", month: "long", day: "numeric",
    }).format(d);

  let instant: Date;
  try {
    instant = new Date(localToUTCISO(date, time, slotTz));
  } catch {
    return { dateLabel: fallbackDate, timeLine: fallbackTime };
  }
  if (isNaN(instant.getTime())) return { dateLabel: fallbackDate, timeLine: fallbackTime };

  // An unusable slot zone would poison every branch below, so prove it first.
  let slotPart: string;
  try {
    slotPart = `${fmtTime(instant, slotTz)} ${tzCity(slotTz, isAr)}`;
  } catch {
    return { dateLabel: fallbackDate, timeLine: fallbackTime };
  }

  // Already in the class's own zone: state it once. A student in Cairo does
  // not need Cairo repeated, and does not need GMT either.
  if (opts.studentTz && opts.studentTz === slotTz) {
    return { dateLabel: fmtDate(instant, slotTz), timeLine: slotPart };
  }

  if (opts.studentTz) {
    const studentTz = opts.studentTz;
    try {
      return {
        dateLabel: fmtDate(instant, studentTz),
        timeLine: `${fmtTime(instant, studentTz)} ${tzCity(studentTz, isAr)} <span style="color:${BRAND_MUTED};font-weight:400;">(${slotPart})</span>`,
      };
    } catch {
      // A zone Intl will not accept. Fall through to the GMT pair rather than
      // showing a time we cannot stand behind.
    }
  }

  return {
    dateLabel: fmtDate(instant, slotTz),
    timeLine: `${slotPart} <span style="color:${BRAND_MUTED};font-weight:400;">(${fmtTime(instant, "UTC")} ${isAr ? "جرينتش" : "GMT"})</span>`,
  };
}
