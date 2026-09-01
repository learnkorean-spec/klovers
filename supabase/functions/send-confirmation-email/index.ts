import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { authorizationError, authorizeRequest } from "../_shared/authorize.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface EmailPayload {
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
  meeting_url?: string;
  class_language?: string;
  confirmed_count?: number;
  trial_day_name?: string;
  referral_url?: string;
  previous_trial_date?: string;
  booking_url?: string;
}

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = "KLovers <noreply@kloversegy.com>";

// ── Brand constants ──
const BRAND_BLACK = "#000000";
const BRAND_YELLOW = "#FFFF00";
const BRAND_DARK = "#1a1a1a";
const BRAND_GRAY = "#f5f5f5";
const BRAND_TEXT = "#333333";
const BRAND_MUTED = "#666666";
const LOGO_URL = "https://kloversegy.com/klovers-logo.jpg";
const SITE_URL = "https://kloversegy.com";

const FUNCTION_BASE = "https://ewtdgpbybkceokfohhyg.supabase.co/functions/v1";

function unsubscribeFooter(token: string | undefined, isAr: boolean): string {
  // Always include an unsubscribe link — required by CAN-SPAM / PDPL.
  // If no token is available (guest booking), fall back to a contact-based unsubscribe page.
  const url = token
    ? `${FUNCTION_BASE}/unsubscribe-email?token=${token}&lang=${isAr ? "ar" : "en"}`
    : `${SITE_URL}/unsubscribe`;
  return isAr
    ? `<p style="text-align:center;margin-top:24px;font-size:11px;color:#999">لا تريد استلام هذه الرسائل؟ <a href="${url}" style="color:#999">إلغاء الاشتراك</a></p>`
    : `<p style="text-align:center;margin-top:24px;font-size:11px;color:#999">Don't want these emails? <a href="${url}" style="color:#999">Unsubscribe</a></p>`;
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

async function logEmail(opts: {
  template: string;
  toEmail: string;
  toName?: string;
  status: "sent" | "failed";
  resendId?: string;
  error?: string;
}) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/email_logs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({
        template: opts.template,
        to_email: opts.toEmail,
        to_name: opts.toName,
        status: opts.status,
        resend_id: opts.resendId,
        error: opts.error,
      }),
    });
  } catch {
    // never throw from logging
  }
}

function brandWrapper(content: string, isRtl: boolean) {
  const dir = isRtl ? 'direction: rtl; text-align: right;' : '';
  return `
  <div translate="no" class="notranslate" style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden;">
    <!-- Header -->
    <div style="background: ${BRAND_BLACK}; padding: 24px; text-align: center;">
      <img src="${LOGO_URL}" alt="KLovers" style="width: 60px; height: 60px; border-radius: 50%; border: 3px solid ${BRAND_YELLOW};" />
      <h2 translate="no" class="notranslate" style="color: ${BRAND_YELLOW}; margin: 12px 0 0; font-size: 22px; letter-spacing: 1px;">KLovers</h2>
      <p style="color: #cccccc; margin: 4px 0 0; font-size: 12px;">Korean Language Academy</p>
    </div>
    <!-- Body -->
    <div style="padding: 28px 24px; ${dir} color: ${BRAND_TEXT};">
      ${content}
    </div>
    <!-- Footer -->
    <div style="background: ${BRAND_BLACK}; padding: 20px 24px; text-align: center;">
      <p translate="no" class="notranslate" style="color: ${BRAND_YELLOW}; font-size: 13px; margin: 0 0 8px;">— The KLovers Team</p>
      <a href="https://kloversegy.com" style="color: #cccccc; font-size: 11px; text-decoration: none;">kloversegy.com</a>
    </div>
  </div>`;
}

function brandButton(text: string, href: string) {
  return `<a href="${href}" style="display: inline-block; background: ${BRAND_YELLOW}; color: ${BRAND_BLACK}; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; border: 2px solid ${BRAND_BLACK};">${text}</a>`;
}

function brandTable(rows: [string, string][]) {
  return `<table style="width: 100%; border-collapse: collapse; margin: 16px 0; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
    ${rows.map(([label, value]) => `
      <tr>
        <td style="padding: 10px 14px; border-bottom: 1px solid #f0f0f0; color: ${BRAND_MUTED}; font-size: 13px; width: 40%;">${label}</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #f0f0f0; font-weight: bold; color: ${BRAND_DARK}; font-size: 14px;">${value}</td>
      </tr>`).join("")}
  </table>`;
}

function generateICS(opts: {
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
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");
}

// Convert a local date+time string to UTC ISO, given an IANA timezone.
function localToUTCISO(dateStr: string, timeStr: string, tz: string): string {
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

/** "Asia/Muscat" → "Muscat". The reader recognises the city, not the zone id. */
function tzCity(tz: string): string {
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
 * not guess — no country fallback, no phone-prefix fallback. We fall back to
 * the slot's own time paired with GMT, which claims to know nothing about
 * where the reader is.
 *
 * When the student is already in the slot's zone the bracket is dropped: an
 * Egyptian student should read Cairo once, not twice.
 *
 * The date is returned alongside the time because the two travel together —
 * a Cairo evening slot is the next calendar day in Manila, and showing the
 * Cairo date next to a Manila time would send someone on the wrong day.
 */
function renderClassTime(opts: {
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
    slotPart = `${fmtTime(instant, slotTz)} ${tzCity(slotTz)}`;
  } catch {
    return { dateLabel: fallbackDate, timeLine: fallbackTime };
  }

  const studentTz = opts.studentTz && opts.studentTz !== slotTz ? opts.studentTz : null;
  if (studentTz) {
    try {
      return {
        dateLabel: fmtDate(instant, studentTz),
        timeLine: `${fmtTime(instant, studentTz)} ${tzCity(studentTz)} <span style="color:${BRAND_MUTED};font-weight:400;">(${slotPart})</span>`,
      };
    } catch {
      // A zone Intl will not accept. Fall through to the GMT pair rather than
      // showing a time we cannot stand behind.
    }
  }

  return {
    dateLabel: fmtDate(instant, slotTz),
    timeLine: `${slotPart} <span style="color:${BRAND_MUTED};font-weight:400;">(${fmtTime(instant, "UTC")} GMT)</span>`,
  };
}

async function sendEmail(
  to: string, subject: string, html: string,
  attachments?: Array<{ filename: string; content: string; content_type?: string }>
) {
  const body: Record<string, unknown> = { from: FROM_EMAIL, to: [to], subject, html };
  if (attachments?.length) body.attachments = attachments;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend error: ${err}`);
  }
  return await res.json();
}

// ── Templates ──

function buildWelcomeEmail(name: string, lang: string) {
  const isAr = lang === "ar";
  if (isAr) {
    return {
      subject: "مرحباً بك في KLovers! 🎉",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 22px;">مرحباً ${name}! 🎉</h1>
        <p>تم تسجيلك بنجاح في KLovers!</p>
        <p>يمكنك الآن:</p>
        <ul style="padding-right: 20px; line-height: 2;">
          <li>📖 قراءة مقالاتنا عن اللغة الكورية</li>
          <li>📚 التسجيل في دوراتنا الجماعية أو الخاصة</li>
          <li>🎯 بدء رحلتك في تعلم اللغة الكورية</li>
        </ul>
        <div style="margin: 24px 0; text-align: center;">
          ${brandButton("اقرأ المدونة", "https://kloversegy.com/blog")}
          &nbsp;&nbsp;
          ${brandButton("سجّل الآن", "https://kloversegy.com/enroll-now")}
        </div>
      `, true),
    };
  }
  return {
    subject: "Welcome to KLovers! 🎉",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Welcome ${name}! 🎉</h1>
      <p>You've successfully registered with KLovers!</p>
      <p>You can now:</p>
      <ul style="line-height: 2;">
        <li>📖 Read our blog articles about Korean language & culture</li>
        <li>📚 Enroll in our Group or Private Korean classes</li>
        <li>🎯 Start your Korean learning journey</li>
      </ul>
      <div style="margin: 24px 0; text-align: center;">
        ${brandButton("Read the Blog", "https://kloversegy.com/blog")}
        &nbsp;&nbsp;
        ${brandButton("Enroll Now", "https://kloversegy.com/enroll-now")}
      </div>
    `, false),
  };
}

function buildEnrollmentEmail(p: EmailPayload) {
  const isAr = p.language === "ar";
  const amountStr = p.currency === "EGP" ? `${p.amount?.toLocaleString()} EGP` : `$${p.amount}`;
  if (isAr) {
    return {
      subject: "KLovers — تم تأكيد التسجيل! 🎉",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 22px;">مرحباً بك في KLovers، ${p.name}!</h1>
        <p>تم تأكيد تسجيلك. إليك التفاصيل:</p>
        ${brandTable([
          ["الخطة", p.plan_type === "group" ? "حصص جماعية" : "حصص خاصة"],
          ["المدة", `${p.duration} ${p.duration === 1 ? "شهر" : "أشهر"}`],
          ["الحصص", `${p.sessions_total} حصة`],
          ["المبلغ المدفوع", amountStr],
        ])}
        <p>يمكنك الآن تسجيل الدخول إلى لوحة الطالب لإدارة حصصك.</p>
        <div style="margin: 24px 0; text-align: center;">
          ${brandButton("لوحة الطالب", "https://kloversegy.com/dashboard")}
        </div>
      `, true),
    };
  }
  return {
    subject: "KLovers — Enrollment Confirmed! 🎉",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Welcome to KLovers, ${p.name}!</h1>
      <p>Your enrollment has been confirmed. Here are your details:</p>
      ${brandTable([
        ["Plan", `${p.plan_type === "group" ? "Group" : "Private"} Classes`],
        ["Duration", `${p.duration} ${p.duration === 1 ? "Month" : "Months"}`],
        ["Sessions", `${p.sessions_total} classes`],
        ["Amount Paid", amountStr],
      ])}
      <p>You can now log in to your Student Dashboard to manage your sessions.</p>
      <div style="margin: 24px 0; text-align: center;">
        ${brandButton("Go to Dashboard", "https://kloversegy.com/dashboard")}
      </div>
    `, false),
  };
}

function buildGroupMatchEmail(p: EmailPayload) {
  const isAr = p.language === "ar";
  const levelLabel = p.group_level ? (isAr ? `📚 المستوى: ${p.group_level}` : `📚 Level: ${p.group_level}`) : "";
  const timeLabel = p.group_time ? `🕐 ${p.group_time}${p.group_timezone ? ` (${p.group_timezone.replace(/_/g, " ")})` : ""}` : "";
  const membersHtml = (p.group_members && p.group_members.length > 0)
    ? `<div style="margin: 12px 0 0;">
        <p style="margin: 0 0 6px; font-weight: bold; color: ${BRAND_MUTED};">${isAr ? "زملاؤك:" : "Your classmates:"}</p>
        <ul style="margin: 0; padding-${isAr ? "right" : "left"}: 18px; color: ${BRAND_TEXT};">
          ${p.group_members.slice(0, 8).map(n => `<li>${n}</li>`).join("")}
          ${p.group_members.length > 8 ? `<li style="color:${BRAND_MUTED};">+${p.group_members.length - 8} ${isAr ? "آخرين" : "more"}</li>` : ""}
        </ul>
      </div>` : "";
  const customHtml = p.custom_message
    ? `<div style="background: ${BRAND_GRAY}; border-left: 4px solid ${BRAND_YELLOW}; padding: 12px 16px; border-radius: 4px; margin: 16px 0; color: ${BRAND_TEXT};">
        <p style="margin: 0; white-space: pre-wrap;">${p.custom_message}</p>
      </div>` : "";

  if (isAr) {
    return {
      subject: "KLovers — تم تكوين مجموعتك! 🎓",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 22px;">أخبار رائعة يا ${p.name}! 🎉</h1>
        <p>تم تكوين مجموعتك الدراسية!</p>
        <div style="background: ${BRAND_GRAY}; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid ${BRAND_YELLOW};">
          <p style="margin: 0; font-weight: bold;">📚 المجموعة: ${p.group_name}</p>
          <p style="margin: 8px 0 0;">📅 الأيام: ${p.group_days}</p>
          ${levelLabel ? `<p style="margin: 8px 0 0;">${levelLabel}</p>` : ""}
          ${timeLabel ? `<p style="margin: 8px 0 0;">${timeLabel}</p>` : ""}
          ${membersHtml}
        </div>
        ${customHtml}
        <p>سنتواصل معك قريباً بخصوص موعد أول حصة.</p>
        <div style="margin: 24px 0; text-align: center;">
          ${brandButton("لوحة الطالب", "https://kloversegy.com/dashboard")}
        </div>
      `, true),
    };
  }
  return {
    subject: "KLovers — Your Group is Formed! 🎓",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Great news, ${p.name}! 🎉</h1>
      <p>Your study group has been formed!</p>
      <div style="background: ${BRAND_GRAY}; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid ${BRAND_YELLOW};">
        <p style="margin: 0; font-weight: bold;">📚 Group: ${p.group_name}</p>
        <p style="margin: 8px 0 0;">📅 Days: ${p.group_days}</p>
        ${levelLabel ? `<p style="margin: 8px 0 0;">${levelLabel}</p>` : ""}
        ${timeLabel ? `<p style="margin: 8px 0 0;">${timeLabel}</p>` : ""}
        ${membersHtml}
      </div>
      ${customHtml}
      <p>We'll contact you shortly with details about your first class.</p>
      <div style="margin: 24px 0; text-align: center;">
        ${brandButton("Go to Dashboard", "https://kloversegy.com/dashboard")}
      </div>
    `, false),
  };
}

function buildSlotConfirmedEmail(p: EmailPayload) {
  const isAr = p.language === "ar";
  if (isAr) {
    return {
      subject: "KLovers — تم تأكيد مجموعتك! 🎓",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 22px;">أخبار رائعة يا ${p.name}! 🎉</h1>
        <p>تم تأكيد مجموعتك الدراسية!</p>
        <div style="background: ${BRAND_GRAY}; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid ${BRAND_YELLOW};">
          <p style="margin: 0; font-weight: bold;">📅 ${p.slot_day} - ${p.slot_time}</p>
          <p style="margin: 8px 0 0;">🌍 ${p.slot_timezone || "Africa/Cairo"}</p>
          <p style="margin: 8px 0 0;">📚 المستوى: ${p.slot_level}</p>
        </div>
        <p>سنتواصل معك قريباً بخصوص موعد أول حصة.</p>
        <div style="margin: 24px 0; text-align: center;">
          ${brandButton("لوحة الطالب", "https://kloversegy.com/dashboard")}
        </div>
      `, true),
    };
  }
  return {
    subject: "KLovers — Your Group is Confirmed! 🎓",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Great news, ${p.name}! 🎉</h1>
      <p>Your study group has been confirmed and is ready to start!</p>
      <div style="background: ${BRAND_GRAY}; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid ${BRAND_YELLOW};">
        <p style="margin: 0; font-weight: bold;">📅 ${p.slot_day} at ${p.slot_time}</p>
        <p style="margin: 8px 0 0;">🌍 ${(p.slot_timezone || "Africa/Cairo").replace(/_/g, " ")}</p>
        <p style="margin: 8px 0 0;">📚 Level: ${p.slot_level}</p>
      </div>
      <p>We'll contact you shortly with details about your first class.</p>
      <div style="margin: 24px 0; text-align: center;">
        ${brandButton("Go to Dashboard", "https://kloversegy.com/dashboard")}
      </div>
    `, false),
  };
}

function buildApprovalEmail(p: EmailPayload) {
  const isAr = p.language === "ar";
  const amountStr = p.currency === "EGP" ? `${p.amount?.toLocaleString()} EGP` : `$${p.amount}`;
  const levelLabel = p.level ? p.level.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) : "";
  const dayLabel = p.preferred_day || "";
  const timeLabel = p.preferred_time || "";
  const tzLabel = (p.timezone || "Africa/Cairo").replace(/_/g, " ");

  const rows: [string, string][] = [
    [isAr ? "الخطة" : "Plan", isAr ? (p.plan_type === "group" ? "حصص جماعية" : "حصص خاصة") : `${p.plan_type === "group" ? "Group" : "Private"} Classes`],
    [isAr ? "المدة" : "Duration", `${p.duration} ${isAr ? (p.duration === 1 ? "شهر" : "أشهر") : (p.duration === 1 ? "Month" : "Months")}`],
    [isAr ? "الحصص" : "Sessions", `${p.sessions_total} ${isAr ? "حصة" : "classes"}`],
    [isAr ? "المبلغ" : "Amount", amountStr],
  ];
  if (levelLabel) rows.push([isAr ? "المستوى" : "Level", levelLabel]);
  if (dayLabel) rows.push([isAr ? "اليوم المفضل" : "Preferred Day", dayLabel]);
  if (timeLabel) rows.push([isAr ? "الوقت المفضل" : "Preferred Time", timeLabel]);
  rows.push([isAr ? "المنطقة الزمنية" : "Timezone", tzLabel]);

  if (isAr) {
    return {
      subject: "KLovers — تمت الموافقة على تسجيلك! ✅",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 22px;">تهانينا يا ${p.name}! ✅</h1>
        <p>تمت الموافقة على تسجيلك وتفعيل حسابك بنجاح!</p>
        ${brandTable(rows)}
        <p>يمكنك الآن تسجيل الدخول إلى لوحة الطالب لمتابعة حصصك.</p>
        <div style="margin: 24px 0; text-align: center;">
          ${brandButton("لوحة الطالب", "https://kloversegy.com/dashboard")}
        </div>
        <p style="color: ${BRAND_MUTED}; font-size: 13px; margin-top: 16px; text-align: center;">انضم إلى أكثر من 200 طالب عربي يتعلمون الكورية مع KLovers 🌟</p>
        <p style="color: ${BRAND_MUTED}; font-size: 12px; margin-top: 12px; border-top: 1px solid #e0e0e0; padding-top: 16px;">🎁 <strong>بتحب KLovers؟</strong> ادعُ صديقاً وتحصلوا كلاكما على حصة مجانية. <a href="https://wa.me/201010003084?text=أهلاً%2C+بدي+أعرف+أكثر+عن+KLovers+الكورية" style="color: ${BRAND_DARK}; font-weight: bold;">شارك رابطك ←</a></p>
      `, true),
    };
  }
  return {
    subject: "KLovers — Your Enrollment is Approved! ✅",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Congratulations, ${p.name}! ✅</h1>
      <p>Your enrollment has been approved and your account is now active!</p>
      ${brandTable(rows)}
      <p>You can now log in to your Student Dashboard to track your classes.</p>
      <div style="margin: 24px 0; text-align: center;">
        ${brandButton("Go to Dashboard", "https://kloversegy.com/dashboard")}
      </div>
      <p style="color: ${BRAND_MUTED}; font-size: 13px; margin-top: 16px; text-align: center;">Join 200+ Arabic speakers learning Korean with KLovers 🌟</p>
      <p style="color: ${BRAND_MUTED}; font-size: 12px; margin-top: 12px; border-top: 1px solid #e0e0e0; padding-top: 16px;">🎁 <strong>Loving KLovers?</strong> Refer a friend and you both get a free class. <a href="https://wa.me/201010003084?text=Hi%2C+I%27d+love+to+learn+more+about+KLovers+Korean+classes" style="color: ${BRAND_DARK}; font-weight: bold;">Share your link →</a></p>
    `, false),
  };
}

function buildPendingReviewEmail(p: EmailPayload) {
  const isAr = p.language === "ar";
  const amountStr = p.currency === "EGP" ? `${p.amount?.toLocaleString()} EGP` : `$${p.amount}`;
  const levelLabel = p.level ? p.level.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) : "";
  const tzLabel = (p.timezone || "Africa/Cairo").replace(/_/g, " ");

  const rows: [string, string][] = [
    [isAr ? "الخطة" : "Plan", isAr ? (p.plan_type === "group" ? "حصص جماعية" : "حصص خاصة") : `${p.plan_type === "group" ? "Group" : "Private"} Classes`],
    [isAr ? "المدة" : "Duration", `${p.duration} ${isAr ? (p.duration === 1 ? "شهر" : "أشهر") : (p.duration === 1 ? "Month" : "Months")}`],
    [isAr ? "الحصص" : "Sessions", `${p.sessions_total} ${isAr ? "حصة" : "Classes"}`],
    [isAr ? "المبلغ" : "Amount", amountStr],
  ];
  if (levelLabel) rows.push([isAr ? "المستوى" : "Level", levelLabel]);
  rows.push([isAr ? "المنطقة الزمنية" : "Timezone", tzLabel]);

  if (isAr) {
    return {
      subject: "KLovers — تم استلام طلبك! ⏳",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 22px;">شكراً لطلبك يا ${p.name}! ⏳</h1>
        <p>لقد استلمنا طلب تسجيلك بنجاح.</p>
        <p>طلبك قيد المراجعة حالياً بينما نقوم بمطابقتك مع المعلم المناسب ومجموعة الدراسة بناءً على مستواك وجدولك.</p>
        <h3 style="color: ${BRAND_DARK}; border-bottom: 3px solid ${BRAND_YELLOW}; display: inline-block; padding-bottom: 4px;">تفاصيل الخطة المختارة</h3>
        ${brandTable(rows)}
        <p>بمجرد الانتهاء من الجدولة وتأكيد الحصة، ستتلقى بريداً إلكترونياً بتفاصيل حصتك ورابط الانضمام.</p>
        <p>يرجى مراقبة بريدك الوارد لرسالة التأكيد.</p>
        <p style="color: ${BRAND_MUTED};">إذا كان لديك أي أسئلة، لا تتردد في التواصل معنا.</p>
      `, true),
    };
  }
  return {
    subject: "KLovers — We've Received Your Request! ⏳",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Thank you for your request, ${p.name}! ⏳</h1>
      <p>We have received your enrollment request successfully.</p>
      <p>Your request is currently under review while we match you with the appropriate teacher and class group based on your level and schedule.</p>
      <h3 style="color: ${BRAND_DARK}; border-bottom: 3px solid ${BRAND_YELLOW}; display: inline-block; padding-bottom: 4px;">Selected Plan Details</h3>
      ${brandTable(rows)}
      <p>Once the scheduling is finalized and the class is confirmed, you will receive a confirmation email with your class details and the link to join your lessons.</p>
      <p>Please keep an eye on your inbox for the confirmation message.</p>
      <p style="color: ${BRAND_MUTED};">If you have any questions, feel free to contact us.</p>
    `, false),
  };
}

function buildRejectionEmail(p: EmailPayload) {
  const isAr = p.language === "ar";
  const reason = p.rejection_reason ?? "other";

  let bodyEn = "";
  let bodyAr = "";
  let subjectEn = "KLovers — Enrollment Update";
  let subjectAr = "KLovers — تحديث حول تسجيلك";

  if (reason === "payment_not_received") {
    subjectEn = "KLovers — Enrollment Rejected: Payment Not Confirmed";
    subjectAr = "KLovers — تم رفض التسجيل: لم يتم تأكيد الدفع";
    bodyEn = `
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Hi ${p.name},</h1>
      <p>We're sorry, but your enrollment has been <strong>rejected</strong> because we were unable to confirm that the payment was received.</p>
      <div style="background: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; padding: 14px 18px; margin: 16px 0;">
        <p style="margin: 0; color: #991b1b; font-size: 13px;">💳 <strong>Reason:</strong> Payment transfer could not be confirmed.</p>
      </div>
      <p>Please re-enroll and make sure to transfer the correct amount and upload a clear receipt.</p>
      <div style="margin: 24px 0; text-align: center;">
        ${brandButton("Re-Enroll Now", "https://kloversegy.com/enroll-now")}
      </div>
      ${p.rejection_note ? `<p style="color: ${BRAND_MUTED}; font-size: 13px;"><strong>Note from admin:</strong> ${p.rejection_note}</p>` : ""}
      <p style="color: ${BRAND_MUTED}; font-size: 13px;">Need help? Contact us on WhatsApp.</p>
    `;
    bodyAr = `
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">مرحباً ${p.name}،</h1>
      <p>نأسف لإبلاغك بأنه تم <strong>رفض</strong> طلب تسجيلك لعدم تمكننا من تأكيد استلام الدفعة.</p>
      <div style="background: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; padding: 14px 18px; margin: 16px 0;">
        <p style="margin: 0; color: #991b1b; font-size: 13px;">💳 <strong>السبب:</strong> لم يتم التحقق من تحويل الدفعة.</p>
      </div>
      <p>يرجى إعادة التسجيل مع التأكد من تحويل المبلغ الصحيح ورفع إيصال واضح.</p>
      <div style="margin: 24px 0; text-align: center;">
        ${brandButton("إعادة التسجيل", "https://kloversegy.com/enroll-now")}
      </div>
      ${p.rejection_note ? `<p style="color: ${BRAND_MUTED}; font-size: 13px;"><strong>ملاحظة:</strong> ${p.rejection_note}</p>` : ""}
      <p style="color: ${BRAND_MUTED}; font-size: 13px;">تواصل معنا عبر واتساب إذا احتجت مساعدة.</p>
    `;
  } else if (reason === "time_slots_unavailable") {
    subjectEn = "KLovers — No Available Time Slots — Choose a New Time";
    subjectAr = "KLovers — لا توجد مواعيد متاحة — اختر موعداً جديداً";
    const ctaBtn = p.resubmit_link ? brandButton(isAr ? "اختر موعدك المناسب" : "Choose Your Preferred Slot", p.resubmit_link) : "";
    bodyEn = `
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Hi ${p.name},</h1>
      <p>Unfortunately, there are currently <strong>no available time slots</strong> that match your preferred schedule.</p>
      <div style="background: #fffbeb; border: 1px solid #f59e0b; border-radius: 8px; padding: 14px 18px; margin: 16px 0;">
        <p style="margin: 0; color: #92400e; font-size: 13px;">📅 Please use the button below to view available slots and select a new time that works for you.</p>
      </div>
      ${ctaBtn ? `<div style="margin: 24px 0; text-align: center;">${ctaBtn}</div>` : ""}
      ${p.rejection_note ? `<p style="color: ${BRAND_MUTED}; font-size: 13px;"><strong>Note:</strong> ${p.rejection_note}</p>` : ""}
      <p style="color: ${BRAND_MUTED}; font-size: 13px;">The link expires in 48 hours. Need help? Contact us on WhatsApp.</p>
    `;
    bodyAr = `
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">مرحباً ${p.name}،</h1>
      <p>للأسف، <strong>لا توجد مواعيد متاحة</strong> حالياً تتناسب مع جدولك المفضل.</p>
      <div style="background: #fffbeb; border: 1px solid #f59e0b; border-radius: 8px; padding: 14px 18px; margin: 16px 0;">
        <p style="margin: 0; color: #92400e; font-size: 13px;">📅 يرجى استخدام الزر أدناه لعرض المواعيد المتاحة واختيار وقت يناسبك.</p>
      </div>
      ${ctaBtn ? `<div style="margin: 24px 0; text-align: center;">${ctaBtn}</div>` : ""}
      ${p.rejection_note ? `<p style="color: ${BRAND_MUTED}; font-size: 13px;"><strong>ملاحظة:</strong> ${p.rejection_note}</p>` : ""}
      <p style="color: ${BRAND_MUTED}; font-size: 13px;">الرابط صالح لمدة 48 ساعة. تواصل معنا عبر واتساب إذا احتجت مساعدة.</p>
    `;
  } else {
    bodyEn = `
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Hi ${p.name},</h1>
      <p>We're sorry, but your enrollment has been <strong>rejected</strong>.</p>
      ${p.rejection_note ? `<div style="background: ${BRAND_GRAY}; border-left: 4px solid ${BRAND_YELLOW}; padding: 12px 16px; border-radius: 4px; margin: 16px 0;"><p style="margin: 0; color: ${BRAND_TEXT};">${p.rejection_note}</p></div>` : ""}
      <p>Please contact us if you have any questions.</p>
      <div style="margin: 24px 0; text-align: center;">
        ${brandButton("Contact Us on WhatsApp", "https://wa.me/201010003084")}
      </div>
    `;
    bodyAr = `
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">مرحباً ${p.name}،</h1>
      <p>نأسف لإبلاغك بأنه تم <strong>رفض</strong> طلب تسجيلك.</p>
      ${p.rejection_note ? `<div style="background: ${BRAND_GRAY}; border-right: 4px solid ${BRAND_YELLOW}; padding: 12px 16px; border-radius: 4px; margin: 16px 0;"><p style="margin: 0; color: ${BRAND_TEXT};">${p.rejection_note}</p></div>` : ""}
      <p>تواصل معنا إذا كان لديك أي استفسار.</p>
      <div style="margin: 24px 0; text-align: center;">
        ${brandButton("تواصل معنا عبر واتساب", "https://wa.me/201010003084")}
      </div>
    `;
  }

  return {
    subject: isAr ? subjectAr : subjectEn,
    html: brandWrapper(isAr ? bodyAr : bodyEn, isAr),
  };
}

function buildPaymentMethodReminderEmail(name: string, enrollmentId: string, lang: string) {
  const isAr = lang === "ar";
  const payUrl = `https://kloversegy.com/pay/${enrollmentId}`;
  if (isAr) {
    return {
      subject: "مطلوب: تأكيد طريقة الدفع الخاصة بك ⚠️",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 22px;">مرحباً ${name}!</h1>
        <p>لاحظنا أنك أرسلت إيصال الدفع، لكن لم يتم تحديد <strong>طريقة الدفع</strong> بعد.</p>
        <p>يرجى زيارة صفحة الدفع الخاصة بك لإكمال هذه الخطوة حتى يتمكن فريقنا من مراجعة طلبك والموافقة عليه.</p>
        <div style="background: #fffbeb; border: 1px solid #f59e0b; border-radius: 8px; padding: 14px 18px; margin: 16px 0;">
          <p style="margin: 0; color: #92400e; font-size: 13px;">⚠️ لن يتم الموافقة على تسجيلك حتى يتم تأكيد طريقة الدفع.</p>
        </div>
        <div style="margin: 24px 0; text-align: center;">
          ${brandButton("تأكيد طريقة الدفع", payUrl)}
        </div>
        <p style="color: ${BRAND_MUTED}; font-size: 13px;">إذا كنت بحاجة إلى مساعدة، تواصل معنا عبر واتساب.</p>
      `, true),
    };
  }
  return {
    subject: "Action Required: Confirm your payment method ⚠️",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Hi ${name}!</h1>
      <p>We noticed you submitted a payment receipt, but your <strong>payment method</strong> wasn't confirmed.</p>
      <p>Please visit your payment page to complete this step so our team can review and approve your enrollment.</p>
      <div style="background: #fffbeb; border: 1px solid #f59e0b; border-radius: 8px; padding: 14px 18px; margin: 16px 0;">
        <p style="margin: 0; color: #92400e; font-size: 13px;">⚠️ Your enrollment won't be approved until the payment method is confirmed.</p>
      </div>
      <div style="margin: 24px 0; text-align: center;">
        ${brandButton("Confirm Payment Method", payUrl)}
      </div>
      <p style="color: ${BRAND_MUTED}; font-size: 13px;">Need help? Contact us on WhatsApp.</p>
    `, false),
  };
}
