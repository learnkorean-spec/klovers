// Asks a linked student, on Telegram, whether she attended a private lesson
// that has just ended. Re, 19 Oct 2026: "solafa finished a class and
// connected [to] the bot, must get a msg to mark her attendance."
//
// Invoked every 15 minutes by the `telegram-attendance-asks` pg_cron job via
// public.trigger_telegram_attendance_asks() -> app_private.invoke_edge(). The
// candidate list (public.telegram_attendance_ask_candidates()) already does
// the "has this class actually ended, in its own timezone" math and excludes
// anything asked before, so this function only has to send messages.
//
// Tapping Yes/No is a CLAIM, same as the student's own "I attended this
// lesson" button on her dashboard (student_confirm_private_session): it sets
// student_confirmed_at only, never outcome/counted. Re still confirms it in
// the admin panel for it to count. The reply is handled by telegram-webhook
// (callback_query branch), not here.
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

async function askAttendance(
  token: string,
  chatId: number,
  sessionId: string,
  studentName: string,
) {
  // Re, 20 Oct 2026: a shared class group (e.g. two sisters who each have
  // their own student record) can have more than one student linked to the
  // SAME chat_id -- without naming her, "did you attend?" is ambiguous to
  // whoever reads it there.
  const text = studentName
    ? `حصة ${studentName} النهاردة خلصت 👋\nهل حضرت الحصة؟`
    : "حصتك النهاردة خلصت 👋\nهل حضرتي الحصة؟";
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      reply_markup: {
        inline_keyboard: [[
          { text: "✅ آه، حضرت", callback_data: `att:yes:${sessionId}` },
          { text: "❌ لأ، معنديش", callback_data: `att:no:${sessionId}` },
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

  let asked = 0;
  for (const row of (candidates ?? []) as {
    session_id: string; teacher_student_id: string; full_name: string; chat_id: number;
  }[]) {
    const sent = await askAttendance(cfg.bot_token, row.chat_id, row.session_id, row.full_name);
    if (sent) {
      const { error: updErr } = await supabase
        .from("student_class_sessions")
        .update({ telegram_asked_at: new Date().toISOString() })
        .eq("id", row.session_id);
      if (updErr) console.error("failed to mark telegram_asked_at", row.session_id, updErr);
      else asked++;
    }
  }

  return new Response(JSON.stringify({ asked, candidates: candidates?.length ?? 0 }), {
    headers: { "Content-Type": "application/json" },
  });
});
