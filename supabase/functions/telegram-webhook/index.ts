// Telegram webhook for @learnkoreanwithkloversbot.
//
// Re, 18 Oct 2026: "we need to connect the students". Each student gets a
// personal link from Admin → My Students:
//
//   https://t.me/learnkoreanwithkloversbot?start=<link_code>
//
// When the student taps it and presses Start, Telegram sends us
// "/start <link_code>". We look the code up in public.telegram_links, store the
// student's chat_id, welcome them in Arabic, and tell Re on Telegram who just
// connected. From then on the bot can message that student directly
// (class reminders, payment reminders — built on top of this table).
//
// Anything else a linked student writes to the bot is forwarded to Re, so a
// reply to a reminder never disappears into a bot nobody reads.
//
// Re, 19 Oct 2026: also handles the inline Yes/No buttons from
// telegram-attendance-ask ("did you attend your lesson?"). That's a
// callback_query update, not a message -- handled in its own branch below.
// Tapping an answer is a CLAIM (see telegram_confirm_private_session): it
// never counts the class itself, it only tells Re what the student says so
// she can confirm it the way she already confirms a web self-service claim.
//
// SECURITY
// --------
// Telegram is registered with a secret_token (setWebhook); every genuine
// update carries it in X-Telegram-Bot-Api-Secret-Token. Anything without it is
// rejected. The bot token, Re's chat id and the webhook secret live in Supabase
// Vault and are read through public.telegram_bot_config(), which only the
// service role can execute — nothing secret is in this file or in env vars.
//
// The bot can only see messages sent TO it. It cannot read Re's own chats or
// any group it has not been added to.

import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

type Config = { bot_token: string; admin_chat_id: string; webhook_secret: string };

let cachedConfig: Config | null = null;

async function getConfig(supabase: ReturnType<typeof createClient>): Promise<Config> {
  if (cachedConfig) return cachedConfig;
  const { data, error } = await supabase.rpc("telegram_bot_config");
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.bot_token || !row?.webhook_secret) throw new Error("telegram config missing from vault");
  cachedConfig = row as Config;
  return cachedConfig;
}

async function sendMessage(token: string, chatId: number | string, text: string) {
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
  });
  if (!res.ok) console.error("telegram sendMessage failed", res.status, await res.text());
}

async function answerCallbackQuery(token: string, callbackQueryId: string, text?: string) {
  const res = await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
  });
  if (!res.ok) console.error("telegram answerCallbackQuery failed", res.status, await res.text());
}

async function editMessageText(token: string, chatId: number, messageId: number, text: string) {
  const res = await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, message_id: messageId, text }),
  });
  if (!res.ok) console.error("telegram editMessageText failed", res.status, await res.text());
}

function displayName(from: { first_name?: string; last_name?: string; username?: string } | undefined) {
  if (!from) return "";
  const full = [from.first_name, from.last_name].filter(Boolean).join(" ");
  return full || (from.username ? `@${from.username}` : "");
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("ok");

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  let cfg: Config;
  try {
    cfg = await getConfig(supabase);
  } catch (e) {
    console.error(e);
    return new Response("config error", { status: 500 });
  }

  if (req.headers.get("x-telegram-bot-api-secret-token") !== cfg.webhook_secret) {
    return new Response("forbidden", { status: 403 });
  }

  // Always answer 200 from here on: a non-2xx makes Telegram retry the same
  // update over and over.
  try {
    const update = await req.json();

    const cb = update?.callback_query;
    if (cb) {
      const chatId: number | undefined = cb.message?.chat?.id;
      const messageId: number | undefined = cb.message?.message_id;
      const match = typeof cb.data === "string" ? cb.data.match(/^att:(yes|no):([0-9a-fA-F-]{36})$/) : null;

      if (!chatId || !messageId || !match) {
        await answerCallbackQuery(cfg.bot_token, cb.id);
        return new Response("ok");
      }

      const attended = match[1] === "yes";
      const sessionId = match[2];

      const { data: link } = await supabase
        .from("telegram_links")
        .select("teacher_student_id")
        .eq("chat_id", chatId)
        .maybeSingle();

      if (!link?.teacher_student_id) {
        await answerCallbackQuery(cfg.bot_token, cb.id, "اللينك ده مش شغال.");
        return new Response("ok");
      }

      const { data: session } = await supabase
        .from("student_class_sessions")
        .select("session_date")
        .eq("id", sessionId)
        .eq("student_id", link.teacher_student_id)
        .maybeSingle();

      if (!session) {
        await answerCallbackQuery(cfg.bot_token, cb.id, "الحصة دي مش لاقيها.");
        return new Response("ok");
      }

      const { error: rpcError } = await supabase.rpc("telegram_confirm_private_session", {
        p_session_id: sessionId,
        p_teacher_student_id: link.teacher_student_id,
        p_attended: attended,
      });
      if (rpcError) {
        console.error("telegram_confirm_private_session failed", rpcError);
        await answerCallbackQuery(cfg.bot_token, cb.id, "في مشكلة، جربي تاني بعدين.");
        return new Response("ok");
      }

      await answerCallbackQuery(cfg.bot_token, cb.id);
      await editMessageText(
        cfg.bot_token, chatId, messageId,
        attended ? "تمام، سجّلنا إنك حضرتي ✅ (هتتأكد من المدرّسة)."
                 : "تمام، سجّلنا إنك معنديش ❌",
      );

      const { data: student } = await supabase.from("teacher_students")
        .select("full_name").eq("id", link.teacher_student_id).maybeSingle();
      const dateLabel = new Date(session.session_date + "T12:00:00Z")
        .toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
      await sendMessage(cfg.bot_token, cfg.admin_chat_id,
        attended
          ? `📋 ${student?.full_name ?? "طالبة"} قالت إنها حضرت حصة ${dateLabel} (عبر تيليجرام) — أكدي في اللوحة`
          : `⚠️ ${student?.full_name ?? "طالبة"} قالت إنها معندهاش حصة ${dateLabel} (عبر تيليجرام) — راجعيها`);

      return new Response("ok");
    }

    const msg = update?.message;
    if (!msg?.chat?.id) return new Response("ok");

    const chatId: number = msg.chat.id;
    const isPrivate = msg.chat.type === "private";
    const text: string = (msg.text ?? "").trim();
    const from = msg.from;
    const tgName = displayName(from);

    // Re talking to her own bot — nothing to do.
    if (String(chatId) === String(cfg.admin_chat_id)) return new Response("ok");

    const startMatch = text.match(/^\/start(?:@\w+)?(?:\s+([A-Za-z0-9_-]{1,64}))?$/);

    // Re, 19 Oct 2026: some students share one class group with a sibling
    // (e.g. "Solafa and Lamar" — one teacher_students row, one group chat).
    // /start with a code works the same in that group as it does 1:1: it
    // just points the row's chat_id at the GROUP instead of a private chat,
    // so the attendance question (and everything else) goes there. Anything
    // OTHER than that linking command in a non-private chat is this group's
    // own business (homework photos, etc.) and is ignored below.
    if (startMatch && !isPrivate) {
      const code = startMatch[1];
      if (code) {
        const { data: link } = await supabase
          .from("telegram_links")
          .select("id, teacher_student_id, user_id, chat_id")
          .eq("link_code", code)
          .maybeSingle();

        if (!link) {
          await sendMessage(cfg.bot_token, chatId, "اللينك ده مش شغال 🙏 اطلب من المدرّسة لينك ربط جديد.");
          return new Response("ok");
        }

        let studentName = "";
        if (link.teacher_student_id) {
          const { data } = await supabase.from("teacher_students")
            .select("full_name").eq("id", link.teacher_student_id).maybeSingle();
          studentName = data?.full_name ?? "";
        }

        const alreadySameChat = link.chat_id === chatId;
        const { error } = await supabase.from("telegram_links").update({
          chat_id: chatId,
          tg_username: null,
          tg_first_name: msg.chat.title ?? null,
          linked_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }).eq("id", link.id);
        if (error) throw error;

        await sendMessage(cfg.bot_token, chatId,
          `تم ربط جروب "${msg.chat.title ?? "الجروب"}" بحساب ${studentName || "الطالبة"} في Klovers بنجاح ✅\nهتوصل هنا مواعيد الحصص والتنبيهات المهمة.`);

        if (!alreadySameChat) {
          await sendMessage(cfg.bot_token, cfg.admin_chat_id,
            `🔗 ${studentName || "طالب"} ربط جروب "${msg.chat.title ?? ""}" على تيليجرام` +
            (link.chat_id && link.chat_id !== chatId ? "\n⚠️ اللينك كان مربوط بحساب تاني قبل كده، واتنقل للجروب الجديد." : ""));
        }
      }
      return new Response("ok");
    }

    if (!isPrivate) return new Response("ok");

    if (startMatch) {
      const code = startMatch[1];
      if (!code) {
        // Opened the bot without a personal link. If already linked, greet them.
        const { data: existing } = await supabase
          .from("telegram_links").select("id").eq("chat_id", chatId).maybeSingle();
        await sendMessage(cfg.bot_token, chatId, existing
          ? "أهلاً بيك تاني في Klovers 👋 حسابك مربوط بالفعل، وهتوصلك هنا مواعيد الحصص والتنبيهات المهمة."
          : "أهلاً بيك في Klovers 👋\nعشان نربط حسابك، افتح لينك الربط الخاص بيك اللي بعتتهولك المدرّسة واضغط Start.");
        return new Response("ok");
      }

      const { data: link } = await supabase
        .from("telegram_links")
        .select("id, teacher_student_id, user_id, chat_id")
        .eq("link_code", code)
        .maybeSingle();

      if (!link) {
        await sendMessage(cfg.bot_token, chatId,
          "اللينك ده مش شغال 🙏 اطلب من المدرّسة لينك ربط جديد.");
        return new Response("ok");
      }

      // Resolve the student's name for the welcome and for Re's notice.
      let studentName = "";
      if (link.teacher_student_id) {
        const { data } = await supabase.from("teacher_students")
          .select("full_name").eq("id", link.teacher_student_id).maybeSingle();
        studentName = data?.full_name ?? "";
      } else if (link.user_id) {
        const { data } = await supabase.from("profiles")
          .select("name").eq("user_id", link.user_id).maybeSingle();
        studentName = data?.name ?? "";
      }

      const alreadySameChat = link.chat_id === chatId;
      const { error } = await supabase.from("telegram_links").update({
        chat_id: chatId,
        tg_username: from?.username ?? null,
        tg_first_name: from?.first_name ?? null,
        linked_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq("id", link.id);
      if (error) throw error;

      await sendMessage(cfg.bot_token, chatId,
        `أهلاً ${studentName || tgName} 👋\nتم ربط حسابك في Klovers بنجاح ✅\nهتوصلك هنا مواعيد الحصص والتنبيهات المهمة.`);

      if (!alreadySameChat) {
        const handle = from?.username ? ` (@${from.username})` : "";
        await sendMessage(cfg.bot_token, cfg.admin_chat_id,
          `🔗 ${studentName || "طالب"} ربط تيليجرام${handle}` +
          (link.chat_id && link.chat_id !== chatId ? "\n⚠️ اللينك كان مربوط بحساب تيليجرام تاني قبل كده، واتنقل للحساب الجديد." : ""));
      }
      return new Response("ok");
    }

    // Any other message: forward to Re with who sent it.
    const { data: linked } = await supabase
      .from("telegram_links")
      .select("teacher_student_id, user_id")
      .eq("chat_id", chatId)
      .maybeSingle();

    let who = tgName || String(chatId);
    if (linked?.teacher_student_id) {
      const { data } = await supabase.from("teacher_students")
        .select("full_name").eq("id", linked.teacher_student_id).maybeSingle();
      if (data?.full_name) who = data.full_name;
    } else if (linked?.user_id) {
      const { data } = await supabase.from("profiles")
        .select("name").eq("user_id", linked.user_id).maybeSingle();
      if (data?.name) who = data.name;
    }

    const body = text || "(رسالة بدون نص — صورة أو ملف أو فويس)";
    await sendMessage(cfg.bot_token, cfg.admin_chat_id,
      `📩 ${who}${linked ? "" : " (مش مربوط)"}${from?.username ? ` @${from.username}` : ""}:\n${body}`);
  } catch (e) {
    console.error("telegram-webhook error", e);
  }
  return new Response("ok");
});
