// Sends a linked student her Zoom/meet link about an hour before her private
// lesson starts. Re, 20 Oct 2026: "the attendance what we can add auto as
// well to them ... one hour before send the meet link."
//
// Invoked every 15 minutes by the `telegram-class-reminders` pg_cron job via
// public.trigger_telegram_class_reminders() -> app_private.invoke_edge(). The
// candidate list (public.telegram_class_reminder_candidates()) does the
// "starts within the next ~70 minutes, hasn't been reminded yet, has a
// meeting link, is linked on Telegram" filtering, so this function only has
// to format and send messages.
//
// Unlike telegram-attendance-ask, this is informational only -- no buttons,
// nothing for the student to confirm, nothing for telegram-webhook to handle.
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Inlined rather than imported from ../_shared/authorize.ts: deploying via
// the MCP tool bundles relative to the function's own folder, and a shared
// cross-function import path isn't worth fighting for one check.
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

function timeLabel(sessionDate: string, startTime: string, timezone: string): string {
  // sessionDate "2026-10-22", startTime "19:00:00" -- build a real instant so
  // Intl can render it in the class's own timezone, then just take HH:MM.
  const [h, m] = startTime.split(":");
  const naive = new Date(`${sessionDate}T${h}:${m}:00`);
  try {
    return new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
      hour: "2-digit", minute: "2-digit", timeZone: timezone,
    }).format(naive);
  } catch {
    return `${h}:${m}`;
  }
}

async function sendReminder(
  token: string,
  chatId: number,
  studentName: string,
  meetingUrl: string,
  whenLabel: string,
) {
  const text = studentName
    ? `هاي ${studentName} 👋\nحصتك بعد شوية (حوالين الساعة ${whenLabel}).\nلينك الحصة:\n${meetingUrl}`
    : `حصتك بعد شوية (حوالين الساعة ${whenLabel}) 👋\nلينك الحصة:\n${meetingUrl}`;
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

  let sent = 0;
  for (const row of (candidates ?? []) as {
    session_id: string;
    teacher_student_id: string;
    full_name: string;
    chat_id: number;
    meeting_url: string;
    session_date: string;
    start_time: string;
    timezone: string;
  }[]) {
    const whenLabel = timeLabel(row.session_date, row.start_time, row.timezone);
    const ok = await sendReminder(cfg.bot_token, row.chat_id, row.full_name, row.meeting_url, whenLabel);
    if (ok) {
      const { error: updErr } = await supabase
        .from("student_class_sessions")
        .update({ telegram_reminder_sent_at: new Date().toISOString() })
        .eq("id", row.session_id);
      if (updErr) console.error("failed to mark telegram_reminder_sent_at", row.session_id, updErr);
      else sent++;
    }
  }

  return new Response(JSON.stringify({ sent, candidates: candidates?.length ?? 0 }), {
    headers: { "Content-Type": "application/json" },
  });
});
