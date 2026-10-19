// Tells a linked private student, on Telegram, that she has one class left
// in her current (unpaid) bundle -- the same moment Re would otherwise send
// the email payment-ask letter (send_bundle_payment_ask), but automatic and
// on the channel she actually reads. Re, 20 Oct 2026, combining #2 (payment
// reminder) and #3 (low-balance alert): "2, one class before the bundle
// finishes, 3.1" (i.e. the threshold for both is 1 class remaining).
//
// Invoked once daily by the `telegram-payment-asks-daily` pg_cron job via
// public.trigger_telegram_payment_asks() -> app_private.invoke_edge(). The
// candidate list (public.telegram_payment_ask_candidates()) does the
// "active, unpaid, exactly 1 class left, not yet asked, linked on Telegram"
// filtering, so this function only has to format and send messages.
//
// Deliberately separate from student_bundles.payment_ask_sent_at (the
// existing email flow's own marker) via its own
// telegram_payment_ask_sent_at column, so sending one doesn't silently
// suppress the other.
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

async function sendMessage(token: string, chatId: number | string, text: string) {
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
  });
  if (!res.ok) {
    console.error("telegram sendMessage (payment ask) failed", res.status, await res.text());
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

  const { data: candidates, error } = await supabase.rpc("telegram_payment_ask_candidates");
  if (error) {
    console.error("telegram_payment_ask_candidates failed", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  let sent = 0;
  for (const row of (candidates ?? []) as {
    bundle_id: string;
    teacher_student_id: string;
    full_name: string;
    chat_id: number;
    total_price: number | null;
    currency: string;
    total_classes: number;
    remaining_classes: number;
  }[]) {
    const amountLine = row.total_price != null
      ? `\nقيمة الباقة الجاية: ${row.total_price} ${row.currency}.`
      : "";
    const text = `هاي ${row.full_name} 👋\nده آخر حصة ليكي في الباقة الحالية (${row.total_classes} حصص).${amountLine}\nكلمي المدرّسة عشان تجددي الباقة 🙏`;
    const sentOk = await sendMessage(cfg.bot_token, row.chat_id, text);
    if (sentOk) {
      const { error: updErr } = await supabase
        .from("student_bundles")
        .update({ telegram_payment_ask_sent_at: new Date().toISOString() })
        .eq("id", row.bundle_id);
      if (updErr) {
        console.error("failed to mark telegram_payment_ask_sent_at", row.bundle_id, updErr);
      } else {
        sent++;
        await sendMessage(
          cfg.bot_token,
          cfg.admin_chat_id,
          `💰 اتبعت تذكير دفع لـ ${row.full_name} (آخر حصة في الباقة، عبر تيليجرام)`,
        );
      }
    }
  }

  return new Response(JSON.stringify({ sent, candidates: candidates?.length ?? 0 }), {
    headers: { "Content-Type": "application/json" },
  });
});
