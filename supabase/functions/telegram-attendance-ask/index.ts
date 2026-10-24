// Asks a linked student, on Telegram, whether she attended a private lesson
// that has just ended. Re, 19 Oct 2026: "solafa finished a class and
// connected [to] the bot, must get a msg to mark her attendance."
//
// Invoked every 15 minutes (Re, 24 Oct 2026: was once daily at a fixed hour,
// which could leave a student waiting most of a day for the question after
// an evening class -- now on the same cadence as telegram-class-reminders)
// by the `telegram-attendance-asks-daily` pg_cron job via
// public.trigger_telegram_attendance_asks() -> app_private.invoke_edge(). The
// candidate list (public.telegram_attendance_ask_candidates()) already does
// the "has this class actually ended, in its own timezone" math and excludes
// anything asked before, so this function only has to send messages. This
// also covers exception classes added via /newclass (telegram-webhook),
// which are ordinary sessions with class_id = null.
//
// Tapping Yes/No is a CLAIM, same as the student's own "I attended this
// lesson" button on her dashboard (student_confirm_private_session): it sets
// student_confirmed_at only, never outcome/counted. Re still confirms it in
// the admin panel for it to count. The reply is handled by telegram-webhook
// (callback_query branch), not here.
//
// Re, 24 Oct 2026: question and buttons now follow each student's language
// (profiles.language via telegram_student_locale) -- Namy (Malaysia) reads
// English, everyone else Arabic.
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

async function askAttendance(
  token: string,
  chatId: number,
  sessionId: string,
  studentName: string,
  lang: string,
) {
  const text = lang === "en"
    ? (studentName
        ? `Hi ${studentName} 👋\nYour class today has finished.\nDid you attend?`
        : "Hi 👋\nYour class today has finished.\nDid you attend?")
    : (studentName
        ? `هاي ${studentName} 👋\nحصتك النهاردة خلصت وقتها.\nهل حضرتِ الحصة؟`
        : "هاي 👋\nحصتك النهاردة خلصت وقتها.\nهل حضرتِ الحصة؟");
  const yesLabel = lang === "en" ? "✅ Yes, I attended" : "✅ آه، حضرت";
  const noLabel = lang === "en" ? "❌ No, I didn't" : "❌ لأ، ماحضرتش";
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      reply_markup: {
        inline_keyboard: [[
          { text: yesLabel, callback_data: `att:yes:${sessionId}` },
          { text: noLabel, callback_data: `att:no:${sessionId}` },
        ]],
      },
    }),
  });
  if (!res.ok) {
    console.error("telegram sendMessage (attendance ask) failed", res.status, await res.text());
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

  const { data: candidates, error } = await supabase.rpc("telegram_attendance_ask_candidates");
  if (error) {
    console.error("telegram_attendance_ask_candidates failed", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
  const rows = (candidates ?? []) as {
    session_id: string; teacher_student_id: string; full_name: string; chat_id: number;
  }[];

  const lang = new Map<string, string>();
  const ids = [...new Set(rows.map((r) => r.teacher_student_id).filter(Boolean))];
  if (ids.length) {
    const { data: rowsLoc } = await supabase.rpc("telegram_student_locale", { p_ids: ids });
    for (const l of (rowsLoc ?? []) as { teacher_student_id: string; language: string }[]) {
      lang.set(l.teacher_student_id, l.language);
    }
  }

  let asked = 0;
  for (const row of rows) {
    const sent = await askAttendance(cfg.bot_token, row.chat_id, row.session_id, row.full_name, lang.get(row.teacher_student_id) ?? "ar");
    if (sent) {
      const { error: updErr } = await supabase
        .from("student_class_sessions")
        .update({ telegram_asked_at: new Date().toISOString() })
        .eq("id", row.session_id);
      if (updErr) console.error("failed to mark telegram_asked_at", row.session_id, updErr);
      else asked++;
    }
  }

  return new Response(JSON.stringify({ asked, candidates: rows.length }), {
    headers: { "Content-Type": "application/json" },
  });
});
