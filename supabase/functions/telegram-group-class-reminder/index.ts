// Sends every linked member of a group class (Hangul, L1..L6, etc.) their
// meeting link about an hour before class starts. Group-student equivalent
// of telegram-class-reminder, which only ever covered private 1-on-1
// students.
//
// Added 2 Nov 2026: Re flagged Aya missing her Hangul class, same week as
// Menna missing hers. Menna's private reminder had gone out correctly and
// on time (she just didn't show up) -- but group/enrollment students like
// Aya had NO reminder mechanism at all, private-only pipeline
// (telegram_class_reminder_candidates / student_class_sessions /
// teacher_students). This is the fix: same cadence (every 15 min), same
// "starts within ~70 minutes" window, same Telegram message pattern, just
// sourced from pkg_group_sessions / pkg_group_members / telegram_links.user_id
// via telegram_group_class_reminder_candidates().
//
// Deliberately reminder-only, not an attendance self-report/confirm flow:
// for group classes Re watches the live class herself and marks attendance
// in the admin dashboard (GroupAttendanceManager -> pkg_attendance), which
// is wired to billing (handle_pkg_attendance_approval). A parallel
// self-report claim path for groups was left out of this pass as a
// separate, billing-adjacent scope question for Re.
//
// 13 Nov 2026: Re flagged that a group with several linked students was
// getting one near-duplicate "Hi <name> ... class link" message per student
// in the SAME chat (everyone shares one group chat_id, and the old code
// looped sendMessage once per candidate row). Attendance-ask is meant to
// stay per-student (separate Yes/No buttons, identity-locked) -- but the
// before-class link reminder has no per-student interaction, so there's no
// reason to repeat it. Fixed: group candidates by session_id/chat_id and
// send exactly ONE combined reminder per group class per session, while
// still writing one telegram_group_reminder_log row per student (so the
// "hasn't been reminded yet" filter in telegram_group_class_reminder_candidates
// still works per student on partial failures/re-runs).
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function isAuthorizedServiceCall(req: Request): boolean {
  const header = req.headers.get("authorization")?.trim();
  const token = header?.startsWith("Bearer ") ? header.slice(7).trim() : null;
  return !!token && token === SERVICE_ROLE_KEY;
}

type Config = { bot_token: string; admin_chat_id: string; webhook_secret: string };

async function getConfig(supabase: ReturnType<typeof createClient>): Promise<Config> {
  const { data, error } = await supabase.rpc("telegram_bot_config");
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.bot_token) throw new Error("telegram config missing from vault");
  return row as Config;
}

// The instant at which the wall clock in `tz` reads `date time`.
function zonedToInstant(date: string, time: string, tz: string): Date {
  const [h, m] = time.split(":");
  const guess = new Date(`${date}T${h}:${m}:00Z`);
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    }).formatToParts(guess).map((x) => [x.type, x.value]),
  );
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return new Date(guess.getTime() - (asUtc - guess.getTime()));
}

function timeLabel(sessionDate: string, startTime: string, tz: string, lang: string): string {
  try {
    const at = zonedToInstant(sessionDate, startTime, tz || "Africa/Cairo");
    const clock = new Intl.DateTimeFormat(lang === "en" ? "en-US" : "ar-EG-u-nu-latn", {
      hour: "numeric", minute: "2-digit", timeZone: tz || "Africa/Cairo",
    }).format(at);
    return lang === "en" ? `${clock} (Cairo time)` : `${clock} بتوقيت مصر`;
  } catch {
    const [h, m] = startTime.split(":");
    return `${h}:${m}`;
  }
}

// One combined message for the whole group chat -- no per-student name,
// since every linked member of this session shares the same chat_id and
// would otherwise see the same link repeated once per classmate.
async function sendGroupReminder(
  token: string,
  chatId: number,
  meetingUrl: string,
  whenLabel: string,
  lang: string,
) {
  const text = lang === "en"
    ? `Hi everyone 👋\nClass starts in 15 minutes (around ${whenLabel}).\nClass link:\n${meetingUrl}`
    : `هاي يا بنات 👋\nالحصة هتبدأ خلال 15 دقيقة (الساعة ${whenLabel}).\nلينك الحصة:\n${meetingUrl}`;
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
  });
  if (!res.ok) {
    console.error("telegram sendMessage (group class reminder) failed", res.status, await res.text());
    return false;
  }
  return true;
}

Deno.serve(async (req) => {
  if (!isAuthorizedServiceCall(req)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { "Content-Type": "application/json" },
    });
  }
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  let cfg: Config;
  try {
    cfg = await getConfig(supabase);
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "config error" }), { status: 500 });
  }

  const { data: candidates, error } = await supabase.rpc("telegram_group_class_reminder_candidates");
  if (error) {
    console.error("telegram_group_class_reminder_candidates failed", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
  const rows = (candidates ?? []) as {
    session_id: string;
    user_id: string;
    full_name: string;
    chat_id: number;
    meeting_url: string;
    session_date: string;
    start_time: string;
    timezone: string;
    language: string;
  }[];

  // One reminder per (session, chat) -- not one per student row.
  const groups = new Map<string, typeof rows>();
  for (const row of rows) {
    const key = `${row.session_id}:${row.chat_id}`;
    const list = groups.get(key) ?? [];
    list.push(row);
    groups.set(key, list);
  }

  let sent = 0;
  for (const group of groups.values()) {
    const first = group[0];
    // Arabic is the default market language; only skip it if every linked
    // student in this chat is explicitly set to English.
    const lang = group.every((r) => r.language === "en") ? "en" : "ar";
    const whenLabel = timeLabel(first.session_date, first.start_time, first.timezone, lang);
    const ok = await sendGroupReminder(cfg.bot_token, first.chat_id, first.meeting_url, whenLabel, lang);
    if (ok) {
      const { error: insErr } = await supabase
        .from("telegram_group_reminder_log")
        .insert(group.map((r) => ({ session_id: r.session_id, user_id: r.user_id })));
      if (insErr) console.error("failed to log telegram_group_reminder_log", first.session_id, insErr);
      else sent += group.length;
    }
  }

  return new Response(JSON.stringify({ sent, groups: groups.size, candidates: rows.length }), {
    headers: { "Content-Type": "application/json" },
  });
});
