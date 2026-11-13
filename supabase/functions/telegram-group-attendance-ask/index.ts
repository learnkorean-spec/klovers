// Asks every linked member of a group class, on Telegram, whether she
// attended the class that just finished -- group-student equivalent of
// telegram-attendance-ask, which only ever covered private 1-on-1 students.
//
// Added 2 Nov 2026: Re: "group classes must be auto as well same like
// private". Group students (Aya, etc.) were already getting the 15-minute
// class-link reminder (telegram-group-class-reminder), but nothing asked
// them afterward whether they actually showed up -- that self-report only
// existed for private students. Same cadence (every 15 min), same
// "class has actually ended, own timezone/duration" gating, same claim-only
// semantics: tapping Yes/No never bills anything by itself.
//
// Tapping Yes/No is a CLAIM, same as the private flow
// (telegram_confirm_private_session): it inserts an UNAPPROVED
// public.pkg_attendance row (admin_approved = false), which
// trg_pkg_attendance_approval does NOT bill. Re still has to approve it in
// GroupAttendanceManager for it to actually count toward the student's
// enrollment balance. The reply is handled by telegram-webhook
// (callback_query branch, "gatt:" prefix), not here.
//
// Candidates (public.telegram_group_attendance_ask_candidates()) already
// excludes anyone already asked, and anyone Re (or an earlier claim) has
// already recorded a pkg_attendance row for -- so this function only has to
// send messages.
//
// 13 Nov 2026: the button payload used to be `gatt:<yes|no>:<session_id>:
// <user_id>` -- two full UUIDs, 82 bytes. Telegram caps callback_data at 64
// bytes and silently rejects the whole sendMessage with BUTTON_DATA_INVALID
// (confirmed live: every single group attendance-ask send had been failing
// with this error). Dropped user_id from the button; telegram-webhook now
// resolves which member tapped from who she actually is on Telegram
// (chat_id + her own tg_user_id), not from a value baked into the button.
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
          { text: yesLabel, callback_data: `gatt:yes:${sessionId}` },
          { text: noLabel, callback_data: `gatt:no:${sessionId}` },
        ]],
      },
    }),
  });
  if (!res.ok) {
    console.error("telegram sendMessage (group attendance ask) failed", res.status, await res.text());
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

  const { data: candidates, error } = await supabase.rpc("telegram_group_attendance_ask_candidates");
  if (error) {
    console.error("telegram_group_attendance_ask_candidates failed", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
  const rows = (candidates ?? []) as {
    session_id: string; user_id: string; full_name: string; chat_id: number; language: string;
  }[];

  let asked = 0;
  for (const row of rows) {
    const sent = await askAttendance(
      cfg.bot_token, row.chat_id, row.session_id, row.full_name, row.language ?? "ar",
    );
    if (sent) {
      const { error: insErr } = await supabase
        .from("telegram_group_attendance_ask_log")
        .insert({ session_id: row.session_id, user_id: row.user_id });
      if (insErr) console.error("failed to log telegram_group_attendance_ask_log", row.session_id, row.user_id, insErr);
      else asked++;
    }
  }

  return new Response(JSON.stringify({ asked, candidates: rows.length }), {
    headers: { "Content-Type": "application/json" },
  });
});
