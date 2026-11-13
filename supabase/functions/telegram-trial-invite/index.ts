// Admin-only. The two things the "Who came" panel needs from Telegram:
//
//   { action: "chats" }
//     The groups the bot knows about, re-checked against Telegram so each one
//     says truthfully whether the bot may create invite links there.
//
//   { action: "send", booking_id, chat_id }
//     Create an invite link for THAT group, for THAT student (one use, named
//     after her), and get it to her together with the enrol link:
//       - on Telegram, straight away, if she pressed Start on the bot;
//       - otherwise as a ready WhatsApp link Re opens and sends herself.
//
// Re, 13 Nov 2026: "i have telegram and many groups, how to fill this gap and
// use the telegram bot as well and groups". Before this, the message after a
// trial carried one community link for everybody, and nothing recorded
// whether she ever joined. A per-student link fixes both: it lands her in
// the right class group, and Telegram tells the bot when that exact link is
// used (see the chat_member branch in telegram-webhook), so the panel can
// show "joined".
//
// A bot cannot add anyone to a group by phone number, and it cannot message
// someone who never pressed Start. Both are Telegram's rules, not ours; the
// invite link and the WhatsApp fallback are the ways round them.

import { authorizationError, authorizeRequest } from "../_shared/authorize.ts";
import {
  cameMessage,
  ensureWebhookUpdates,
  getTelegramConfig,
  refreshChat,
  sendText,
  tg,
} from "../_shared/telegram.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  // Admins from the dashboard; the service role so the same call can be made
  // from SQL (app_private.invoke_edge) to check the bot's groups without a
  // browser session.
  const auth = await authorizeRequest(req, "admin-or-service");
  if (!auth.ok) return authorizationError(auth, corsHeaders);
  const supabase = auth.serviceClient;

  let body: { action?: string; booking_id?: string; chat_id?: number | string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  let cfg;
  try {
    cfg = await getTelegramConfig(supabase);
  } catch (e) {
    console.error(e);
    return json({ error: "Telegram is not configured" }, 500);
  }

  // ── chats ────────────────────────────────────────────────────────────────
  if (body.action === "chats") {
    // Subscribing to membership updates is what makes "joined" work at all,
    // so it is checked here, on the one call every use of the panel makes.
    const webhook = await ensureWebhookUpdates(cfg);

    const { data: known, error } = await supabase.from("telegram_chats").select("chat_id");
    if (error) {
      // 42P01: the migration has not been applied yet.
      return json({ error: "not_ready", detail: error.message }, 409);
    }

    // The community group and the alumni group are hard-wired in
    // telegram-webhook (WELCOME_GROUP_CHAT_IDS) and never went through a
    // student's /start, so nothing seeded them: check them here too.
    const ids = new Set<number>([-1001890232265, -1004374526296]);
    for (const row of known ?? []) ids.add(Number(row.chat_id));
    const publicLinks = new Map<number, string>();
    for (const id of ids) {
      const fresh = await refreshChat(supabase, cfg.bot_token, id);
      if (fresh?.public_link) publicLinks.set(id, fresh.public_link);
    }

    const { data: chats } = await supabase
      .from("telegram_chats")
      .select("chat_id, title, chat_type, bot_status, can_invite")
      .in("bot_status", ["administrator", "creator", "member", "restricted"])
      .order("title", { ascending: true });

    return json({
      chats: (chats ?? []).map((c: { chat_id: number }) => ({
        ...c,
        public_link: publicLinks.get(Number(c.chat_id)) ?? null,
      })),
      webhook,
    });
  }

  // ── send ─────────────────────────────────────────────────────────────────
  if (body.action === "send") {
    const bookingId = body.booking_id ?? "";
    const chatId = Number(body.chat_id);
    if (!UUID.test(bookingId) || !Number.isFinite(chatId) || chatId >= 0) {
      return json({ error: "booking_id and a group chat_id are required" }, 400);
    }

    const { data: booking } = await supabase
      .from("trial_bookings")
      .select("id, name, phone, class_language")
      .eq("id", bookingId)
      .maybeSingle();
    if (!booking) return json({ error: "Booking not found" }, 404);

    const { data: chat } = await supabase
      .from("telegram_chats")
      .select("chat_id, title")
      .eq("chat_id", chatId)
      .maybeSingle();
    if (!chat) return json({ error: "Unknown Telegram group" }, 404);

    // Her row may not exist yet (she booked before this shipped).
    await supabase.from("trial_telegram")
      .upsert({ booking_id: bookingId }, { onConflict: "booking_id", ignoreDuplicates: true });
    const { data: tt, error: ttError } = await supabase
      .from("trial_telegram")
      .select("booking_id, chat_id, invite_chat_id, invite_link, joined_at")
      .eq("booking_id", bookingId)
      .maybeSingle();
    if (ttError || !tt) return json({ error: "not_ready", detail: ttError?.message }, 409);

    // Reuse a link she has not used yet for the same group; a new group, or a
    // link she already joined with (it is single-use), needs a fresh one.
    let inviteLink: string | null =
      tt.invite_link && Number(tt.invite_chat_id) === chatId && !tt.joined_at ? tt.invite_link : null;

    // Set when the bot may not create links in this group but the group is
    // public: she is sent the group's own t.me link instead. It is the same
    // link for everyone, so it is NOT stored as her invite_link (that column
    // is unique per student, and is how a join is matched to a booking). A
    // join through it is matched by her Telegram user id instead, which the
    // bot only knows if she pressed Start (see chat_member in telegram-webhook).
    let sharedLink: string | null = null;

    if (!inviteLink) {
      const created = await tg<{ invite_link: string }>(cfg.bot_token, "createChatInviteLink", {
        chat_id: chatId,
        // Shown to Re in the group's invite-link list. Telegram caps it at 32.
        name: `Trial: ${(booking.name || "student").trim()}`.slice(0, 32),
        member_limit: 1,
      });
      if (created.ok) {
        inviteLink = created.result.invite_link;
      } else {
        const fresh = await refreshChat(supabase, cfg.bot_token, chatId);
        if (!fresh?.public_link) {
          return json({
            error: "cannot_invite",
            detail: created.description,
            group: chat.title,
          }, 409);
        }
        sharedLink = fresh.public_link;
      }
    }

    const linkToSend = (inviteLink ?? sharedLink)!;
    const isAr = (booking.class_language ?? "arabic") !== "english";
    const text = cameMessage(booking.name, isAr, linkToSend);

    let sentVia: "telegram" | "whatsapp" = "whatsapp";
    if (tt.chat_id) {
      const sent = await sendText(cfg.bot_token, Number(tt.chat_id), text);
      // She may have blocked the bot since linking: fall back to WhatsApp
      // rather than report a message she never received.
      if (sent.ok) sentVia = "telegram";
    }

    const { error: saveError } = await supabase.from("trial_telegram").update({
      invite_chat_id: chatId,
      invite_link: inviteLink,
      invite_sent_at: new Date().toISOString(),
      invite_sent_via: sentVia,
      joined_at: Number(tt.invite_chat_id) === chatId ? tt.joined_at : null,
      updated_at: new Date().toISOString(),
    }).eq("booking_id", bookingId);
    if (saveError) console.error("trial_telegram save failed", saveError);

    const digits = (booking.phone ?? "").replace(/[^0-9]/g, "");
    const whatsappUrl = sentVia === "whatsapp" && digits.length >= 8
      ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
      : null;

    return json({
      sent_via: sentVia,
      invite_link: linkToSend,
      // false: the group's public link went out, so "joined" will only show
      // for a student who is on the bot.
      personal_link: inviteLink !== null,
      group: chat.title,
      whatsapp_url: whatsappUrl,
      // When there is neither a linked bot chat nor a phone, Re still gets
      // the text to paste wherever she does reach the student.
      text,
    });
  }

  return json({ error: "Unknown action" }, 400);
});
