// Shared Telegram Bot API helpers for the trial -> group -> enrolment flow
// (telegram-trial-invite, telegram-followups, and the webhook's new branches).
//
// The bot token, Re's chat id and the webhook secret live in Supabase Vault
// and are read through public.telegram_bot_config(), which only the service
// role can execute. Nothing secret is in this file or in env vars.

// deno-lint-ignore no-explicit-any
type Db = any;

export type TelegramConfig = { bot_token: string; admin_chat_id: string; webhook_secret: string };

export const BOT_USERNAME = "learnkoreanwithkloversbot";
export const ENROLL_NOW_LINK = "https://kloversegy.com/enroll-now";
// The open community group every visitor can already join from the site
// footer. Used only as the fallback when no class group was chosen.
export const COMMUNITY_GROUP_LINK = "https://t.me/+Fu5T7d4wLMsxNDY9";

export async function getTelegramConfig(supabase: Db): Promise<TelegramConfig> {
  const { data, error } = await supabase.rpc("telegram_bot_config");
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.bot_token) throw new Error("telegram config missing from vault");
  return row as TelegramConfig;
}

export type TgResult<T> = { ok: true; result: T } | { ok: false; status: number; description: string };

/** One Bot API call. Never throws on a Telegram-side refusal: returns it. */
export async function tg<T = unknown>(
  token: string,
  method: string,
  body: Record<string, unknown> = {},
): Promise<TgResult<T>> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.ok) {
      const description = json?.description ?? `HTTP ${res.status}`;
      console.error(`telegram ${method} failed`, res.status, description);
      return { ok: false, status: res.status, description };
    }
    return { ok: true, result: json.result as T };
  } catch (e) {
    console.error(`telegram ${method} threw`, e);
    return { ok: false, status: 0, description: String(e) };
  }
}

export function sendText(token: string, chatId: number | string, text: string) {
  return tg(token, "sendMessage", { chat_id: chatId, text, disable_web_page_preview: true });
}

/** The bot's own numeric id is the part of its token before the colon. */
export function botIdFromToken(token: string): number {
  return Number(token.split(":")[0]);
}

export function trialBotLink(linkCode: string): string {
  return `https://t.me/${BOT_USERNAME}?start=${linkCode}`;
}

export function firstName(name: string | null | undefined): string {
  return (name || "").trim().split(/\s+/)[0] || "";
}

/**
 * What a student who came to the trial is sent: her class group and the
 * enrol link, in one message. Same wording on Telegram and on WhatsApp so Re
 * sees one message whichever way it travels.
 */
export function cameMessage(name: string | null, isAr: boolean, groupLink: string): string {
  const first = firstName(name);
  return isAr
    ? `هاي ${first || "يا قمر"} \u{1F44B} سعيدين إنك جيتِ التراير!\n\n` +
      `ده لينك جروب الكلاس على تيليجرام، ادخلي منه:\n${groupLink}\n\n` +
      `وعشان تثبتي مكانك وتكملي الكورس:\n${ENROLL_NOW_LINK}`
    : `Hi ${first || "there"} \u{1F44B} so glad you made it to the trial!\n\n` +
      `Here is your class group on Telegram, tap to join:\n${groupLink}\n\n` +
      `And to lock in your seat and continue the course:\n${ENROLL_NOW_LINK}`;
}

/**
 * Ask Telegram what the bot is in this chat right now, and store it.
 * Returns the stored row, or null when Telegram no longer knows the chat.
 */
export async function refreshChat(supabase: Db, token: string, chatId: number) {
  const chat = await tg<{ id: number; title?: string; type: string; username?: string }>(
    token, "getChat", { chat_id: chatId },
  );
  if (!chat.ok) {
    await supabase.from("telegram_chats")
      .update({ bot_status: "unreachable", can_invite: false, updated_at: new Date().toISOString() })
      .eq("chat_id", chatId);
    return null;
  }
  const me = await tg<{ status: string; can_invite_users?: boolean }>(token, "getChatMember", {
    chat_id: chatId,
    user_id: botIdFromToken(token),
  });
  const status = me.ok ? me.result.status : "unknown";
  // A group creator can do everything; an administrator needs the right.
  const canInvite = me.ok &&
    (status === "creator" || (status === "administrator" && me.result.can_invite_users === true));
  const row = {
    chat_id: chatId,
    title: chat.result.title ?? null,
    chat_type: chat.result.type,
    bot_status: status,
    can_invite: canInvite,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase.from("telegram_chats").upsert(row, { onConflict: "chat_id" });
  if (error) console.error("telegram_chats upsert failed", error);
  // A public group has a permanent t.me/<username> link anyone can join by.
  // Returned to the caller, not stored: it is Telegram's to change.
  return { ...row, public_link: chat.result.username ? `https://t.me/${chat.result.username}` : null };
}

// chat_member is never delivered unless it is asked for by name, and it is
// how the bot learns that a student used her invite link.
const WANTED_UPDATES = ["message", "callback_query", "my_chat_member", "chat_member"];

/**
 * Make sure the webhook is subscribed to membership updates. Idempotent: a
 * no-op once the subscription is in place. The URL is whatever Telegram
 * already has; only allowed_updates changes, and the secret is re-sent
 * because setWebhook clears it when it is omitted.
 */
export async function ensureWebhookUpdates(cfg: TelegramConfig): Promise<"ok" | "updated" | "failed"> {
  const info = await tg<{ url?: string; allowed_updates?: string[] }>(cfg.bot_token, "getWebhookInfo");
  if (!info.ok || !info.result.url) return "failed";
  const current = info.result.allowed_updates ?? [];
  if (WANTED_UPDATES.every((u) => current.includes(u))) return "ok";
  const merged = Array.from(new Set([...current, ...WANTED_UPDATES]));
  const set = await tg(cfg.bot_token, "setWebhook", {
    url: info.result.url,
    secret_token: cfg.webhook_secret,
    allowed_updates: merged,
  });
  return set.ok ? "updated" : "failed";
}
