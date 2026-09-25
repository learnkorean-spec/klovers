// Teacher brief — the email Re gets the day before she teaches.
//
// Re, 25 Sep 2026: "as a teacher why i dont get a reminding email 1 day before
// the class with the book and link and all who will be in the class, small
// report that i have the class and we r in this class".
//
// The answer was that no such email existed. There are twenty email templates
// in this system and every one of them points at a student. Nothing has ever
// pointed at the teacher. On 25 Sep she walked into a trial with 13 people
// booked having had to ask, in chat, who was coming — that is the gap this
// closes.
//
// WHAT IT COVERS
// --------------
// Every class tomorrow, not trials only:
//   - trial classes   (trial_slots + trial_bookings)
//   - private/group   (v_teacher_schedule_admin)
//
// For each one: the time in her own timezone AND in Cairo, the meeting link,
// who is booked with their level, who has actually confirmed attendance, and
// the book for that class.
//
// THE BOOK
// --------
// class_books is a small table keyed by (level, language). It is deliberately
// the seed of the admin books library Re wants next, where a student sees the
// book on their dashboard and this brief reads the SAME row — one source, so
// the two can never drift. Until that library is built, a level with no row
// simply shows "—" here; nothing breaks and nothing is invented.
//
// CONFIRMED vs BOOKED
// -------------------
// These are shown as separate numbers on purpose. For the 25 Sep trial, 13
// were booked and 0 had confirmed. A brief that reported "13" alone would have
// been misleading in exactly the way that costs a teacher her preparation.
//
// verify_jwt MUST stay false (supabase/config.toml) — the same trap
// send-trial-guide hit on 15 Sep 2026 and send-weekly-report documents: with
// the default true, the gateway answers 401 UNAUTHORIZED_INVALID_JWT_FORMAT to
// pg_cron's Bearer <service_role_key> before a line of this file runs.
// isCronOrAdmin() below does the real authorisation, which is why the gateway
// must not second-guess it — this response carries student names and emails.

import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { cairoDateKey, cairoHour, shiftDateKey, zonedMidnightUtc } from "../_shared/cairoTime.ts";
import { adminRecipients } from "../_shared/adminRecipients.ts";
import { FROM_EMAIL, REPLY_TO_EMAIL } from "../_shared/sender.ts";
import { isCronOrAdmin } from "../_shared/cronAuth.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";

/** Re teaches from Bangkok. TEACHER_TZ moves it with no redeploy if she moves. */
const TEACHER_TZ = Deno.env.get("TEACHER_TZ") || "Asia/Bangkok";

/** The Cairo hour this is sent at. 09:00 Cairo is early afternoon in Bangkok. */
const SEND_HOUR_CAIRO = Number(Deno.env.get("TEACHER_BRIEF_HOUR_CAIRO") ?? "9");

/** TEACHER_BRIEF_TO overrides the recipients, same pattern as WEEKLY_REPORT_TO. */
function briefRecipients(): string[] {
  const override = Deno.env.get("TEACHER_BRIEF_TO");
  if (override) {
    const list = override.split(",").map((s) => s.trim()).filter((s) => s.includes("@"));
    if (list.length > 0) return list;
  }
  return adminRecipients();
}

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function esc(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** "level_1" -> "Level 1", "hangul" -> "Hangul". Display only. */
function prettyLevel(level: string | null): string {
  if (!level) return "—";
  if (level === "hangul") return "Hangul";
  const m = level.match(/^level_(\d+)$/);
  return m ? `Level ${m[1]}` : level;
}

function timeIn(tz: string, at: Date): string {
  return at.toLocaleTimeString("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit" });
}

interface Attendee { name: string; level: string | null; confirmed: boolean; response: string | null }
interface ClassBlock {
  kind: "trial" | "scheduled";
  title: string;
  startCairo: string;
  startTeacher: string;
  language: string | null;
  meetingUrl: string | null;
  bookTitle: string | null;
  bookUrl: string | null;
  attendees: Attendee[];
  confirmedCount: number;
}

const STYLE = `
  :root { color-scheme: light dark; supported-color-schemes: light dark; }
  @media (prefers-color-scheme: dark) {
    .page   { background: #0f0f0f !important; }
    .card   { background: #1b1b1b !important; border-color: #333333 !important; }
    .band   { background: #242424 !important; }
    .cell   { border-bottom-color: #333333 !important; }
    .t-body { color: #e4e4e4 !important; }
    .t-mut  { color: #9a9a9a !important; }
    .t-warn { color: #ffb86b !important; }
  }
`;

function buildHtml(dateLabel: string, blocks: ClassBlock[]): string {
  const td = `padding:6px 10px;border-bottom:1px solid #eeeeee;`;

  const sections = blocks.map((b) => {
    const rows = b.attendees.length === 0
      ? `<tr><td colspan="3" class="t-mut" style="padding:10px;color:#666666;text-align:center;">Nobody booked yet</td></tr>`
      : b.attendees.map((a) =>
          `<tr>` +
          `<td class="cell t-body" style="${td}color:#222222;">${esc(a.name)}</td>` +
          `<td class="cell t-mut" style="${td}color:#666666;">${esc(prettyLevel(a.level))}</td>` +
          `<td class="cell ${a.confirmed ? "t-body" : "t-mut"}" style="${td}color:${a.confirmed ? "#0a7d3f" : "#999999"};">${a.confirmed ? "confirmed" : "no reply"}</td>` +
          `</tr>`
        ).join("");

    const unconfirmed = b.attendees.length - b.confirmedCount;
    const warn = b.attendees.length > 0 && b.confirmedCount === 0
      ? `<p class="t-warn" style="margin:8px 0 0;color:#b35c00;font-size:12px;">None of them has confirmed yet — treat the count as booked, not expected.</p>`
      : "";

    const book = b.bookTitle
      ? (b.bookUrl
          ? `<a href="${esc(b.bookUrl)}" style="color:#111111;">${esc(b.bookTitle)}</a>`
          : esc(b.bookTitle))
      : `<span class="t-mut" style="color:#999999;">— not set</span>`;

    const link = b.meetingUrl
      ? `<a href="${esc(b.meetingUrl)}" style="color:#111111;">${esc(b.meetingUrl)}</a>`
      : `<span class="t-warn" style="color:#b35c00;">no meeting link</span>`;

    return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="band" bgcolor="#fafafa" style="background:#fafafa;border-radius:8px;margin-bottom:20px;">
      <tr><td style="padding:16px;">
        <div class="t-body" style="font-size:15px;font-weight:bold;color:#111111;margin-bottom:2px;">${esc(b.title)}</div>
        <div class="t-body" style="font-size:20px;font-weight:bold;color:#111111;">${b.startTeacher} <span class="t-mut" style="font-size:12px;font-weight:normal;color:#666666;">your time</span></div>
        <div class="t-mut" style="font-size:12px;color:#666666;margin-bottom:10px;">${b.startCairo} Cairo${b.language ? " · " + esc(b.language) : ""}</div>

        <div style="font-size:12px;margin-bottom:4px;"><strong class="t-body" style="color:#111111;">Link:</strong> ${link}</div>
        <div style="font-size:12px;margin-bottom:12px;"><strong class="t-body" style="color:#111111;">Book:</strong> ${book}</div>

        <div class="t-body" style="font-size:13px;font-weight:bold;color:#111111;margin-bottom:4px;">
          ${b.attendees.length} booked · ${b.confirmedCount} confirmed · ${unconfirmed} no reply
        </div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:13px;">
          ${rows}
        </table>
        ${warn}
      </td></tr>
    </table>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>Your classes tomorrow — ${dateLabel}</title>
<style>${STYLE}</style>
</head>
<body class="page" bgcolor="#f5f5f5" style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="page" bgcolor="#f5f5f5" style="background:#f5f5f5;">
<tr><td align="center" style="padding:20px;">

<table role="presentation" width="640" cellpadding="0" cellspacing="0" border="0" class="card" bgcolor="#ffffff" style="max-width:640px;width:100%;background:#ffffff;border-radius:12px;border:1px solid #dddddd;">
  <tr><td bgcolor="#000000" style="background:#000000;padding:18px 24px;color:#FFFF00;font-weight:bold;font-size:16px;border-radius:12px 12px 0 0;">📕 Your classes tomorrow — ${dateLabel}</td></tr>
  <tr><td style="padding:24px;">
    ${sections}
  </td></tr>
  <tr><td bgcolor="#000000" style="background:#000000;padding:14px 24px;color:#999999;font-size:11px;border-radius:0 0 12px 12px;">Sent the day before you teach · <a href="https://kloversegy.com/admin" style="color:#FFFF00;">Open admin</a></td></tr>
</table>

</td></tr>
</table>
</body>
</html>`;
}

function buildText(dateLabel: string, blocks: ClassBlock[]): string {
  const lines: string[] = [`YOUR CLASSES TOMORROW — ${dateLabel}`, ""];
  for (const b of blocks) {
    lines.push(`${b.title}`);
    lines.push(`  ${b.startTeacher} your time / ${b.startCairo} Cairo${b.language ? " — " + b.language : ""}`);
    lines.push(`  Link: ${b.meetingUrl ?? "NO MEETING LINK"}`);
    lines.push(`  Book: ${b.bookTitle ?? "not set"}`);
    lines.push(`  ${b.attendees.length} booked, ${b.confirmedCount} confirmed`);
    for (const a of b.attendees) {
      lines.push(`    - ${a.name} (${prettyLevel(a.level)}) ${a.confirmed ? "[confirmed]" : "[no reply]"}`);
    }
    lines.push("");
  }
  lines.push("Open admin: https://kloversegy.com/admin");
  return lines.join("\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !RESEND_API_KEY) {
      throw new Error("missing env (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / RESEND_API_KEY)");
    }
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    if (!(await isCronOrAdmin(req, supabase))) {
      return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
        status: 401, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Cron fires hourly; only the SEND_HOUR_CAIRO tick proceeds, so the brief
    // arrives once. ?force=1 bypasses it for a manual send or a test.
    const url = new URL(req.url);
    const force = url.searchParams.get("force") === "1";
    const now = new Date();
    if (!force && cairoHour(now) !== SEND_HOUR_CAIRO) {
      return new Response(JSON.stringify({ ok: true, skipped: "wrong hour", hourCairo: cairoHour(now) }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // "Tomorrow" is tomorrow in Cairo, because that is the timezone every
    // class time in this database is stored against.
    const tomorrow = shiftDateKey(cairoDateKey(now), 1);
    const midnightUtc = zonedMidnightUtc(tomorrow).getTime();

    // Books, once, for the whole brief.
    const { data: bookRows } = await supabase
      .from("class_books")
      .select("level, language, title, url")
      .eq("is_active", true);
    const bookFor = (level: string | null, language: string | null) => {
      if (!bookRows) return { title: null, url: null };
      const exact = bookRows.find((b) => b.level === level && b.language === language);
      const any = bookRows.find((b) => b.level === level && b.language === "any");
      const hit = exact ?? any;
      return { title: hit?.title ?? null, url: hit?.url ?? null };
    };

    const blocks: ClassBlock[] = [];

    // ── Trial classes ───────────────────────────────────────────────────
    const { data: slots } = await supabase
      .from("trial_slots")
      .select("trial_date, start_time, class_language, meeting_url")
      .eq("is_active", true)
      .eq("trial_date", tomorrow);

    for (const s of slots ?? []) {
      const { data: bookings } = await supabase
        .from("trial_bookings")
        .select("name, level, attendance_response, attendance_confirmed_at")
        .eq("trial_date", tomorrow)
        .eq("class_language", s.class_language)
        .neq("status", "cancelled");

      const attendees: Attendee[] = (bookings ?? []).map((b) => ({
        name: b.name || "no name",
        level: b.level,
        confirmed: b.attendance_confirmed_at != null,
        response: b.attendance_response,
      })).sort((a, b) => a.name.localeCompare(b.name));

      // start_time is "HH:MM[:SS]" Cairo-local; Cairo midnight + that offset is
      // the real instant. Exact except across a Cairo DST switch at midnight.
      const [hh, mm] = String(s.start_time).split(":").map(Number);
      const at = new Date(midnightUtc + ((hh * 60 + mm) * 60_000));
      const book = bookFor("trial", s.class_language);

      blocks.push({
        kind: "trial",
        title: `Trial class (${s.class_language})`,
        startCairo: timeIn("Africa/Cairo", at),
        startTeacher: timeIn(TEACHER_TZ, at),
        language: s.class_language,
        meetingUrl: s.meeting_url,
        bookTitle: book.title,
        bookUrl: book.url,
        attendees,
        confirmedCount: attendees.filter((a) => a.confirmed).length,
      });
    }

    // ── Private and group sessions ──────────────────────────────────────
    const { data: sessions } = await supabase
      .from("v_teacher_schedule_admin")
      .select("slot_date, start_time, timezone, label, notes, student_name, status, starts_at")
      .eq("slot_date", tomorrow);

    for (const s of sessions ?? []) {
      if ((s.status ?? "").toLowerCase() === "cancelled") continue;
      const [hh, mm] = String(s.start_time).split(":").map(Number);
      const at = s.starts_at ? new Date(s.starts_at) : new Date(midnightUtc + ((hh * 60 + mm) * 60_000));

      blocks.push({
        kind: "scheduled",
        title: s.label || (s.student_name ? `Class — ${s.student_name}` : "Class"),
        startCairo: timeIn("Africa/Cairo", at),
        startTeacher: timeIn(TEACHER_TZ, at),
        language: null,
        meetingUrl: null,
        bookTitle: null,
        bookUrl: null,
        attendees: s.student_name
          ? [{ name: s.student_name, level: null, confirmed: true, response: null }]
          : [],
        confirmedCount: s.student_name ? 1 : 0,
      });
    }

    // Nothing tomorrow means no email. A brief that arrives on empty days is
    // a brief that stops being read.
    if (blocks.length === 0) {
      return new Response(JSON.stringify({ ok: true, sent: false, reason: "no classes tomorrow", tomorrow }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    blocks.sort((a, b) => a.startCairo.localeCompare(b.startCairo));

    const dateLabel = new Date(midnightUtc).toLocaleDateString("en-GB", {
      timeZone: "Africa/Cairo", weekday: "long", day: "numeric", month: "long",
    });

    const to = briefRecipients();
    const totalBooked = blocks.reduce((n, b) => n + b.attendees.length, 0);
    const subject = `📕 Tomorrow: ${blocks.length} class${blocks.length === 1 ? "" : "es"}, ${totalBooked} booked — ${dateLabel}`;

    const sent = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: FROM_EMAIL, reply_to: REPLY_TO_EMAIL, to, subject,
        html: buildHtml(dateLabel, blocks), text: buildText(dateLabel, blocks),
      }),
    });
    if (!sent.ok) {
      const errText = await sent.text();
      throw new Error(`Resend ${sent.status}: ${errText}`);
    }

    return new Response(JSON.stringify({ ok: true, sent: true, to, tomorrow, classes: blocks.length, totalBooked }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("send-teacher-brief error:", msg);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
