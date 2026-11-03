// Sends a linked student her Zoom/meet link about an hour before her private
// lesson starts. Re, 20 Oct 2026: "the attendance what we can add auto as
// well to them ... one hour before send the meet link."
//
// Invoked every 15 minutes by the `telegram-class-reminders` pg_cron job via
// public.trigger_telegram_class_reminders() -> app_private.invoke_edge(). The
// candidate list (public.telegram_class_reminder_candidates()) does the
// "starts within the next ~70 minutes, hasn't been reminded yet, has a
// meeting link, is linked on Telegram" filtering, so this function only has
// to format and send messages. Also covers exception classes added via the
// /newclass admin command (telegram-webhook) -- those are ordinary sessions
// with class_id = null, which this candidate list already includes.
//
// Re, 24 Oct 2026: Menna (in Oman) was told her class was at "10 pm" --
// timeLabel used to build `new Date("2026-10-24T15:00")`, read as UTC, then
// rendered in Asia/Bangkok: +7h on every reminder. Fixed by resolving the
// wall-clock time in the class's own timezone first. Shown in the STUDENT's
// own country/time (teacher_students.country) and language
// (profiles.language, via telegram_student_locale) -- Namy (Malaysia) reads
// English, everyone else Arabic.
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const COUNTRY_TZ: Record<string, { tz: string; ar: string; en: string }> = {
  egypt: { tz: "Africa/Cairo", ar: "بتوقيت مصر", en: "Cairo time" },
  oman: { tz: "Asia/Muscat", ar: "بتوقيت عُمان", en: "Oman time" },
  malaysia: { tz: "Asia/Kuala_Lumpur", ar: "بتوقيت ماليزيا", en: "Malaysia time" },
  "saudi arabia": { tz: "Asia/Riyadh", ar: "بتوقيت السعودية", en: "Saudi time" },
  "united arab emirates": { tz: "Asia/Dubai", ar: "بتوقيت الإمارات", en: "UAE time" },
  uae: { tz: "Asia/Dubai", ar: "بتوقيت الإمارات", en: "UAE time" },
  kuwait: { tz: "Asia/Kuwait", ar: "بتوقيت الكويت", en: "Kuwait time" },
  qatar: { tz: "Asia/Qatar", ar: "بتوقيت قطر", en: "Qatar time" },
  jordan: { tz: "Asia/Amman", ar: "بتوقيت الأردن", en: "Jordan time" },
};
const DEFAULT_ZONE = COUNTRY_TZ.egypt;

function zoneFor(country: string | null | undefined) {
  return COUNTRY_TZ[(country ?? "").trim().toLowerCase()] ?? DEFAULT_ZONE;
}

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

function timeLabel(sessionDate: string, startTime: string, classTz: string, country: string | null, lang: string): string {
  const zone = zoneFor(country);
  try {
    const at = zonedToInstant(sessionDate, startTime, classTz || "Asia/Bangkok");
    const clock = new Intl.DateTimeFormat(lang === "en" ? "en-US" : "ar-EG-u-nu-latn", {
      hour: "numeric", minute: "2-digit", timeZone: zone.tz,
    }).format(at);
    return lang === "en" ? `${clock} (${zone.en})` : `${clock} ${zone.ar}`;
  } catch {
    const [h, m] = startTime.split(":");
    return `${h}:${m}`;
  }
}

async function sendReminder(
  token: string,
  chatId: number,
  studentName: string,
  meetingUrl: string,
  whenLabel: string,
  lang: string,
) {
  const text = lang === "en"
    ? (studentName
        ? `Hi ${studentName} 👋\nYour class starts in 15 minutes (around ${whenLabel}).\nClass link:\n${meetingUrl}`
        : `Your class starts in 15 minutes (around ${whenLabel}) 👋\nClass link:\n${meetingUrl}`)
    : (studentName
        ? `هاي ${studentName} 👋\nحصتك هتبدأ خلال 15 دقيقة (الساعة ${whenLabel}).\nلينك الحصة:\n${meetingUrl}`
        : `حصتك هتبدأ خلال 15 دقيقة (الساعة ${whenLabel}) 👋\nلينك الحصة:\n${meetingUrl}`);
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
  });
  if (!res.ok) {
    console.error("telegram sendMessage (class reminder) failed", res.status, await res.text());
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

  const { data: candidates, error } = await supabase.rpc("telegram_class_reminder_candidates");
  if (error) {
    console.error("telegram_class_reminder_candidates failed", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
  const rows = (candidates ?? []) as {
    session_id: string;
    teacher_student_id: string;
    full_name: string;
    chat_id: number;
    meeting_url: string;
    session_date: string;
    start_time: string;
    timezone: string;
  }[];

  const locale = new Map<string, { country: string | null; language: string }>();
  const ids = [...new Set(rows.map((r) => r.teacher_student_id).filter(Boolean))];
  if (ids.length) {
    const { data: rowsLoc } = await supabase.rpc("telegram_student_locale", { p_ids: ids });
    for (const l of (rowsLoc ?? []) as { teacher_student_id: string; country: string | null; language: string }[]) {
      locale.set(l.teacher_student_id, { country: l.country, language: l.language });
    }
  }

  let sent = 0;
  for (const row of rows) {
    const loc = locale.get(row.teacher_student_id) ?? { country: null, language: "ar" };
    const whenLabel = timeLabel(row.session_date, row.start_time, row.timezone, loc.country, loc.language);
    const ok = await sendReminder(cfg.bot_token, row.chat_id, row.full_name, row.meeting_url, whenLabel, loc.language);
    if (ok) {
      const { error: updErr } = await supabase
        .from("student_class_sessions")
        .update({ telegram_reminder_sent_at: new Date().toISOString() })
        .eq("id", row.session_id);
      if (updErr) console.error("failed to mark telegram_reminder_sent_at", row.session_id, updErr);
      else sent++;
    }
  }

  return new Response(JSON.stringify({ sent, candidates: rows.length }), {
    headers: { "Content-Type": "application/json" },
  });
});
