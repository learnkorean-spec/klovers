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
// Re, 24 Oct 2026: "anytime there is a meeting link send the question must be
// sent auto" -- but Telegram gives a bot no visibility into Re's own personal
// chats, so a class she arranges herself (outside the weekly schedule) can't
// be auto-detected. The bridge is the /newclass admin command below: Re tells
// the bot about the exception once, in one message from her own admin chat,
// and from there it's an ordinary session -- the existing reminder and
// attendance-ask sweeps (both every 15 minutes) pick it up automatically,
// exactly like a regular scheduled class.
//
// Re, 2 Nov 2026: "the person with the msg name must get the yes or no from
// the specific person, because they can't confirm for each other". A shared
// group chat (e.g. two sisters, each her own teacher_students row, same
// telegram chat_id) let EITHER person tap the Yes/No meant for the OTHER --
// the old check only verified the tap came from the right GROUP, never the
// right PERSON inside it. Fix: telegram_links now also stores tg_user_id,
// the numeric Telegram id of whoever ran /start with that student's own link
// code. The att: callback now checks the tapper's id against it and refuses
// a mismatch. Links made before this fix have tg_user_id = null and are left
// unrestricted (nothing to check against) until the student runs /start
// again, which backfills it silently.
//
// Re, 4 Nov 2026: "each chat must get ... new joiners" welcomed -- when
// someone joins the big community group or the alumni group, greet them and
// point them at a free trial. Channels don't emit new_chat_members (only
// groups/supergroups do), so this only applies to those two. The alumni
// group's id changed from -883335779 to -1004374526296 the moment the bot
// was promoted to admin there (Telegram silently upgrades a basic group to
// a supergroup, with a new id, the first time it needs supergroup-only
// features like a non-creator admin) -- same reason post-scheduled-
// telegram-posts and telegram-group-broadcast use the new id now too.
//
// Re, 13 Nov 2026: "the people attend the trial and i dont have thier number
// after that i lost them ... add them to telegram and do the group ... all
// not connected steps". Three additions close that:
//   * /start with a TRIAL link code (trial_telegram.link_code, shown on the
//     booking confirmation screen) links a trial student before she ever has
//     an account, so the bot can reach her without a phone number.
//   * my_chat_member keeps telegram_chats current: which groups the bot is
//     in, and whether it may create invite links there. Re can also type
//     /register inside a group to add it by hand.
//   * chat_member reports the exact invite link a new member used. Each
//     trial student gets her own single-use link (telegram-trial-invite), so
//     a join is matched back to her booking and stamped joined_at.
// A basic group that Telegram upgrades to a supergroup changes its chat id;
// the migrate_to_chat_id service message is followed so no link goes stale.
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

// A client built without a generated Database type. `ReturnType<typeof
// createClient>` resolves every table and RPC to `never` under current
// supabase-js typings, which failed `deno check` on every line that read a
// column. Type-only: nothing about what runs has changed.
// deno-lint-ignore no-explicit-any
type Db = any;
import { refreshChat } from "../_shared/telegram.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Klovers Academy community chats (see klovers-telegram-integration notes).
const WELCOME_GROUP_CHAT_IDS = new Set([-1001890232265, -1004374526296]);

type Config = { bot_token: string; admin_chat_id: string; webhook_secret: string };

let cachedConfig: Config | null = null;

async function getConfig(supabase: Db): Promise<Config> {
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

// Re, 2 Nov 2026: "group classes must be auto as well same like private" --
// group equivalent of the "att:" branch below. Same claim-only semantics as
// private: telegram_confirm_group_session inserts an UNAPPROVED
// pkg_attendance row, never bills by itself -- Re still approves it in
// GroupAttendanceManager.
//
// 13 Nov 2026: callback_data used to be gatt:<yes|no>:<session_id>:<user_id>
// -- two UUIDs, 82 bytes, over Telegram's 64-byte callback_data cap, so
// every send of this button had been failing outright (BUTTON_DATA_INVALID).
// Dropped user_id from the button; a group session is shared by several
// members, so instead of trusting a value baked into the tapped button, we
// resolve exactly who tapped from who she actually is on Telegram: her own
// tg_user_id, scoped to this chat. That's a tighter identity check than the
// old "does the button's user_id match who tapped" comparison, not a looser
// one -- it can't be spoofed by a crafted callback_data at all.
async function handleGroupAttendanceTap(
  supabase: Db,
  cfg: Config,
  chatId: number,
  messageId: number,
  cb: { id: string; from?: { id?: number } },
  gmatch: RegExpMatchArray,
) {
  const yes = gmatch[1] === "yes";
  const sessionId = gmatch[2];
  const tapperId: number | undefined = cb.from?.id;

  const { data: session } = await supabase
    .from("pkg_group_sessions")
    .select("id, session_date, group_id")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session) {
    await answerCallbackQuery(cfg.bot_token, cb.id, "الحصة دي مش لاقيها.");
    return;
  }

  if (tapperId == null) {
    await answerCallbackQuery(cfg.bot_token, cb.id, "مش قادرين نتأكد مين بيضغط، جربي تاني.");
    return;
  }

  const { data: link } = await supabase
    .from("telegram_links")
    .select("user_id, chat_id, tg_user_id")
    .eq("chat_id", chatId)
    .eq("tg_user_id", tapperId)
    .maybeSingle();

  if (!link) {
    await answerCallbackQuery(cfg.bot_token, cb.id, "حسابك مش مربوط بالجروب ده. دوسي لينكك الشخصي الأول.");
    return;
  }
  const userId = link.user_id as string;

  const { data: profile } = await supabase.from("profiles")
    .select("name, language").eq("user_id", userId).maybeSingle();
  const name = profile?.name ?? "";
  const dateLabel = new Date(session.session_date + "T12:00:00Z")
    .toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  const lang = profile?.language === "en" ? "en" : "ar";

  const { error: rpcError } = await supabase.rpc("telegram_confirm_group_session", {
    p_session_id: sessionId,
    p_user_id: userId,
    p_attended: yes,
  });
  if (rpcError) {
    console.error("telegram_confirm_group_session failed", rpcError);
    await answerCallbackQuery(cfg.bot_token, cb.id,
      lang === "en" ? "Something went wrong, try again later." : "في مشكلة، جربي تاني بعدين.");
    return;
  }

  await answerCallbackQuery(cfg.bot_token, cb.id);
  const confirmText = lang === "en"
    ? (yes
        ? `Got it, we recorded that ${name || "the student"} attended ✅ (the teacher will confirm).`
        : `Got it, we recorded that ${name || "the student"} didn't attend ❌`)
    : (yes
        ? `تمام، سجّلنا إن ${name || "الطالبة"} حضرت ✅ (هتتأكد من المدرّسة).`
        : `تمام، سجّلنا إن ${name || "الطالبة"} ماحضرتش ❌`);
  await editMessageText(cfg.bot_token, chatId, messageId, confirmText);
  await sendMessage(cfg.bot_token, cfg.admin_chat_id,
    yes
      ? `📋 ${name || "طالبة"} قالت إنها حضرت جروب يوم ${dateLabel} (عبر تيليجرام) — أكدي في اللوحة`
      : `⚠️ ${name || "طالبة"} قالت إنها ماحضرتش جروب يوم ${dateLabel} (عبر تيليجرام) — راجعيها`);
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

    // The bot itself was added to / removed from / promoted in a chat.
    const mine = update?.my_chat_member;
    if (mine?.chat?.id && mine.chat.type !== "private") {
      const status: string = mine.new_chat_member?.status ?? "unknown";
      const canInvite = status === "creator" ||
        (status === "administrator" && mine.new_chat_member?.can_invite_users === true);
      const { error } = await supabase.from("telegram_chats").upsert({
        chat_id: mine.chat.id,
        title: mine.chat.title ?? null,
        chat_type: mine.chat.type,
        bot_status: status,
        can_invite: canInvite,
        updated_at: new Date().toISOString(),
      }, { onConflict: "chat_id" });
      if (error) console.error("telegram_chats upsert (my_chat_member) failed", error);
      return new Response("ok");
    }

    // Somebody's membership changed in a group the bot administers. Only one
    // case matters here: she joined through a link the bot made for her.
    const member = update?.chat_member;
    if (member?.chat?.id) {
      const usedLink: string | undefined = member.invite_link?.invite_link;
      const nowIn = ["member", "administrator", "restricted", "creator"]
        .includes(member.new_chat_member?.status ?? "");
      if (nowIn) {
        // Her own single-use link, when she was sent one. Otherwise (a public
        // group, where everyone shares one link) the student who was invited
        // to THIS group and whose Telegram account is the one that just
        // joined: known only if she pressed Start on the bot.
        const joinedId: number | undefined = member.new_chat_member?.user?.id;
        let tt: { booking_id: string; joined_at: string | null } | null = null;
        if (usedLink) {
          const { data } = await supabase
            .from("trial_telegram")
            .select("booking_id, joined_at")
            .eq("invite_link", usedLink)
            .maybeSingle();
          tt = data;
        }
        if (!tt && joinedId) {
          const { data } = await supabase
            .from("trial_telegram")
            .select("booking_id, joined_at")
            .eq("invite_chat_id", member.chat.id)
            .eq("tg_user_id", joinedId)
            .is("joined_at", null)
            .order("invite_sent_at", { ascending: false })
            .limit(1);
          tt = data?.[0] ?? null;
        }
        if (tt && !tt.joined_at) {
          const joined = member.new_chat_member?.user;
          await supabase.from("trial_telegram").update({
            joined_at: new Date().toISOString(),
            tg_user_id: joined?.id ?? null,
            tg_username: joined?.username ?? null,
            updated_at: new Date().toISOString(),
          }).eq("booking_id", tt.booking_id);
          const { data: booking } = await supabase.from("trial_bookings")
            .select("name").eq("id", tt.booking_id).maybeSingle();
          await sendMessage(cfg.bot_token, cfg.admin_chat_id,
            `✅ ${booking?.name || "طالبة التراير"} دخلت جروب "${member.chat.title ?? ""}".`);
        }
      }
      return new Response("ok");
    }

    const cb = update?.callback_query;
    if (cb) {
      const chatId: number | undefined = cb.message?.chat?.id;
      const messageId: number | undefined = cb.message?.message_id;
      const tapperId: number | undefined = cb.from?.id;
      // "att:" = confirming attendance of a lesson that already happened
      // (telegram-attendance-ask). "resched:" = confirming/declining a
      // newly proposed class time (Re messaging the group directly about a
      // reschedule) -- same buttons, different semantics, see below.
      const match = typeof cb.data === "string"
        ? cb.data.match(/^(att|resched):(yes|no):([0-9a-fA-F-]{36})$/)
        : null;
      // "gatt:" = confirming attendance of a GROUP class that already
      // happened (telegram-group-attendance-ask). Which member is answering
      // is resolved inside handleGroupAttendanceTap from her own tg_user_id
      // (not from the button), so the callback only carries the session id.
      const gmatch = !match && typeof cb.data === "string"
        ? cb.data.match(/^gatt:(yes|no):([0-9a-fA-F-]{36})$/)
        : null;

      if (!chatId || !messageId || (!match && !gmatch)) {
        await answerCallbackQuery(cfg.bot_token, cb.id);
        return new Response("ok");
      }

      if (gmatch) {
        await handleGroupAttendanceTap(supabase, cfg, chatId, messageId, cb, gmatch);
        return new Response("ok");
      }

      const kind = match![1] as "att" | "resched";
      const yes = match![2] === "yes";
      const sessionId = match![3];

      // Resolve by session id FIRST, not by chat_id: a shared group (e.g.
      // two sisters, each her own teacher_students row) can have more than
      // one telegram_links row pointing at the SAME chat_id, so looking the
      // student up by chat_id alone is ambiguous -- `.maybeSingle()` would
      // error on the second matching row and silently break every tap in
      // that group. The session id baked into the button already says
      // exactly which student this question is about; chat_id is only
      // checked afterward, as a "this button belongs in this chat" guard.
      const { data: session } = await supabase
        .from("student_class_sessions")
        .select("id, session_date, student_id, note")
        .eq("id", sessionId)
        .maybeSingle();

      if (!session) {
        await answerCallbackQuery(cfg.bot_token, cb.id, "الحصة دي مش لاقيها.");
        return new Response("ok");
      }

      const { data: link } = await supabase
        .from("telegram_links")
        .select("teacher_student_id, chat_id, tg_user_id")
        .eq("teacher_student_id", session.student_id)
        .maybeSingle();

      if (!link || link.chat_id !== chatId) {
        await answerCallbackQuery(cfg.bot_token, cb.id, "اللينك ده مش شغال.");
        return new Response("ok");
      }

      const { data: student } = await supabase.from("teacher_students")
        .select("full_name").eq("id", session.student_id).maybeSingle();
      const name = student?.full_name ?? "";
      const dateLabel = new Date(session.session_date + "T12:00:00Z")
        .toLocaleDateString("en-GB", { day: "2-digit", month: "short" });

      // Per-student language (Namy etc. get English), same helper used by
      // telegram-class-reminder / telegram-attendance-ask.
      const { data: localeRows } = await supabase.rpc("telegram_student_locale", {
        p_ids: [session.student_id],
      });
      const lang = (Array.isArray(localeRows) ? localeRows[0]?.language : undefined) === "en" ? "en" : "ar";

      // Re, 2 Nov 2026: in a shared group chat, confirm the tap actually
      // came from THIS student, not a groupmate answering on her behalf.
      // Only enforced once we actually have her tg_user_id on file -- a
      // link made before this fix has it null, so it's left unrestricted
      // rather than locking someone out with no way to pass the check.
      if (link.tg_user_id != null && tapperId != null && link.tg_user_id !== tapperId) {
        await answerCallbackQuery(
          cfg.bot_token, cb.id,
          lang === "en"
            ? `This button is only for ${name || "that student"} to answer.`
            : `الزرار ده مخصص لـ ${name || "الطالبة"} بس 🙏`,
        );
        return new Response("ok");
      }

      if (kind === "att") {
        const { error: rpcError } = await supabase.rpc("telegram_confirm_private_session", {
          p_session_id: sessionId,
          p_teacher_student_id: session.student_id,
          p_attended: yes,
        });
        if (rpcError) {
          console.error("telegram_confirm_private_session failed", rpcError);
          await answerCallbackQuery(cfg.bot_token, cb.id,
            lang === "en" ? "Something went wrong, try again later." : "في مشكلة، جربي تاني بعدين.");
          return new Response("ok");
        }

        await answerCallbackQuery(cfg.bot_token, cb.id);
        const confirmText = lang === "en"
          ? (yes
              ? `Got it, we recorded that ${name || "the student"} attended ✅ (the teacher will confirm).`
              : `Got it, we recorded that ${name || "the student"} didn't attend ❌`)
          : (yes
              ? `تمام، سجّلنا إن ${name || "الطالبة"} حضرت ✅ (هتتأكد من المدرّسة).`
              : `تمام، سجّلنا إن ${name || "الطالبة"} ماحضرتش ❌`);
        await editMessageText(cfg.bot_token, chatId, messageId, confirmText);
        await sendMessage(cfg.bot_token, cfg.admin_chat_id,
          yes
            ? `📋 ${name || "طالبة"} قالت إنها حضرت حصة ${dateLabel} (عبر تيليجرام) — أكدي في اللوحة`
            : `⚠️ ${name || "طالبة"} قالت إنها ماحضرتش حصة ${dateLabel} (عبر تيليجرام) — راجعيها`);
        return new Response("ok");
      }

      // kind === "resched": the class hasn't happened yet, so this is a
      // yes/no RSVP to a proposed time, not an attendance claim -- nothing
      // to count via telegram_confirm_private_session. Just log the reply
      // on the session and tell Re.
      const noteLine = `[telegram ${new Date().toISOString()}] ${name || "الطالبة"} ${yes ? "وافقت على" : "معندهاش في"} ميعاد ${dateLabel}`;
      await supabase.from("student_class_sessions")
        .update({ note: session.note ? `${session.note}\n${noteLine}` : noteLine })
        .eq("id", sessionId);

      await answerCallbackQuery(cfg.bot_token, cb.id);
      await editMessageText(
        cfg.bot_token, chatId, messageId,
        yes ? `تمام، سجّلنا موافقة ${name || "الطالبة"} على حصة ${dateLabel} ✅`
            : `تمام، سجّلنا إن ${name || "الطالبة"} معندهاش في ${dateLabel} ❌`,
      );
      await sendMessage(cfg.bot_token, cfg.admin_chat_id,
        yes
          ? `✅ ${name || "طالبة"} أكدت حصة ${dateLabel} (عبر تيليجرام)`
          : `⚠️ ${name || "طالبة"} قالت معندهاش في ${dateLabel} — راجعيها`);
      return new Response("ok");
    }

    const msg = update?.message;
    if (!msg?.chat?.id) return new Response("ok");

    const chatId: number = msg.chat.id;

    // --- new member welcome (community groups only; channels don't emit
    // this event) -------------------------------------------------------
    if (Array.isArray(msg.new_chat_members) && msg.new_chat_members.length > 0 && WELCOME_GROUP_CHAT_IDS.has(chatId)) {
      for (const member of msg.new_chat_members) {
        if (member.is_bot) continue;
        const name = displayName(member);
        const greeting = name ? `أهلاً بيكي ${name}` : "أهلاً بيكي";
        await sendMessage(cfg.bot_token, chatId,
          `${greeting} في عيلة Klovers 🇰🇷🌸\nهنا هتلاقي كل جديد عن الكورسات، مقالات تساعدك تتعلمي، وعروض من وقت للتاني.\nابدئي بحصة تجريبية مجانية من هنا:\n👉 https://kloversegy.com/free-trial`);
      }
      return new Response("ok");
    }

    const isPrivate = msg.chat.type === "private";
    const text: string = (msg.text ?? "").trim();
    const from = msg.from;
    const tgName = displayName(from);

    // A basic group became a supergroup: same group, new chat id. Follow it
    // everywhere the old id is stored, or every reminder and invite for that
    // group would start failing silently.
    const migratedTo: number | undefined = msg.migrate_to_chat_id;
    if (migratedTo) {
      await supabase.from("telegram_links")
        .update({ chat_id: migratedTo, updated_at: new Date().toISOString() }).eq("chat_id", chatId);
      await supabase.from("trial_telegram")
        .update({ invite_chat_id: migratedTo, updated_at: new Date().toISOString() }).eq("invite_chat_id", chatId);
      await supabase.from("telegram_chats").delete().eq("chat_id", chatId);
      await refreshChat(supabase, cfg.bot_token, migratedTo);
      return new Response("ok");
    }

    // Re typed /register inside one of her groups: record the group so it
    // shows up in the "Who came" panel's group picker. Answered in her own
    // chat with the bot, not in the group.
    if (!isPrivate && /^\/register(?:@\w+)?$/i.test(text) && String(from?.id) === String(cfg.admin_chat_id)) {
      const row = await refreshChat(supabase, cfg.bot_token, chatId);
      await sendMessage(cfg.bot_token, cfg.admin_chat_id, !row
        ? `⚠️ معرفتش أسجل جروب "${msg.chat.title ?? ""}".`
        : row.can_invite
          ? `✅ جروب "${row.title ?? ""}" اتسجل، والبوت يقدر يعمل لينكات دعوة فيه.`
          : `✅ جروب "${row.title ?? ""}" اتسجل، بس البوت لسه مش أدمن بصلاحية "Invite Users via Link" — خليه أدمن عشان يقدر يعمل لينكات دعوة.`);
      return new Response("ok");
    }

    // Re talking to her own bot.
    if (String(chatId) === String(cfg.admin_chat_id)) {
      // --- /newclass admin command ---------------------------------------
      // Re, 24 Oct 2026: for an "exception class" she arranges herself
      // outside the normal weekly schedule, the bot has no way to detect it
      // automatically -- it can't see Re's own personal chats with students.
      // This command is the bridge: Re tells the bot about the class once,
      // in one message, and from there it's an ordinary session -- the
      // existing reminder and attendance-ask sweeps (every 15 minutes) pick
      // it up and handle the rest on their own, same as a regular class.
      //
      // Syntax (time is Bangkok time, same convention as every other class
      // time stored in the system):
      //   /newclass <student name> today|tomorrow|YYYY-MM-DD HH:MM
      // Examples:
      //   /newclass Namy today 19:00
      //   /newclass Menna 2026-11-02 16:00
      const newClassMatch = text.match(
        /^\/newclass\s+(.+?)\s+(today|tomorrow|\d{4}-\d{2}-\d{2})\s+(\d{1,2}):(\d{2})$/i,
      );

      if (newClassMatch) {
        const [, rawName, when, hh, mm] = newClassMatch;
        const studentNameQuery = rawName.trim();

        let sessionDate: string;
        if (/^\d{4}-\d{2}-\d{2}$/.test(when)) {
          sessionDate = when;
        } else {
          // "today"/"tomorrow" relative to Bangkok's current date, since
          // that's the timezone every class time is stored in.
          const bkkParts = new Intl.DateTimeFormat("en-CA", {
            timeZone: "Asia/Bangkok",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }).format(new Date());
          const [by, bm, bd] = bkkParts.split("-").map(Number);
          const bkkDate = new Date(Date.UTC(by, bm - 1, bd));
          if (when.toLowerCase() === "tomorrow") bkkDate.setUTCDate(bkkDate.getUTCDate() + 1);
          sessionDate = bkkDate.toISOString().slice(0, 10);
        }
        const startTime = `${hh.padStart(2, "0")}:${mm}`;

        const { data: candidates, error: findError } = await supabase.rpc(
          "admin_find_linked_student",
          { p_name: studentNameQuery },
        );
        if (findError) {
          console.error("admin_find_linked_student failed", findError);
          await sendMessage(cfg.bot_token, chatId, `⚠️ حصل خطأ وأنا بدوّر على "${studentNameQuery}".`);
          return new Response("ok");
        }
        if (!candidates || candidates.length === 0) {
          await sendMessage(cfg.bot_token, chatId,
            `⚠️ مش لاقية طالبة اسمها "${studentNameQuery}" مربوطة بتيليجرام.`);
          return new Response("ok");
        }
        if (candidates.length > 1) {
          const names = candidates.map((c: { full_name: string }) => c.full_name).join("، ");
          await sendMessage(cfg.bot_token, chatId,
            `⚠️ في أكتر من طالبة اسمها شبيه: ${names}. اكتبي الاسم بالكامل.`);
          return new Response("ok");
        }

        const student = candidates[0] as {
          student_id: string; full_name: string; chat_id: number | null;
          meeting_url: string | null; language: string | null;
        };

        const { data: newSessionId, error: createError } = await supabase.rpc(
          "admin_create_exception_session",
          { p_student_id: student.student_id, p_session_date: sessionDate, p_start_time: startTime },
        );
        if (createError || !newSessionId) {
          console.error("admin_create_exception_session failed", createError);
          await sendMessage(cfg.bot_token, chatId, `⚠️ حصل خطأ وأنا بسجّل حصة ${student.full_name}.`);
          return new Response("ok");
        }

        const lang = student.language === "en" ? "en" : "ar";
        const dateLabel = new Date(sessionDate + "T12:00:00Z")
          .toLocaleDateString("en-GB", { day: "2-digit", month: "short" });

        // Send the class link to the student right away (same idea as
        // telegram-class-reminder) and mark the reminder as already sent so
        // the 15-minute cron doesn't duplicate it.
        let studentNotified = false;
        if (student.chat_id && student.meeting_url) {
          const studentText = lang === "en"
            ? `Hi ${student.full_name} 👋\nYour class today is set -- here's the link:\n${student.meeting_url}`
            : `هاي ${student.full_name} 👋\nحصتك النهاردة جاهزة، اتفضلي اللينك:\n${student.meeting_url}`;
          await sendMessage(cfg.bot_token, student.chat_id, studentText);
          await supabase.from("student_class_sessions")
            .update({ telegram_reminder_sent_at: new Date().toISOString() })
            .eq("id", newSessionId);
          studentNotified = true;
        }

        await sendMessage(cfg.bot_token, chatId,
          `✅ اتسجلت حصة استثنائية لـ ${student.full_name} يوم ${dateLabel} الساعة ${startTime} (توقيت بانكوك).` +
          (studentNotified
            ? "\nاتبعتلها اللينك دلوقتي، وهيتبعتلها سؤال الحضور تلقائي بعد الحصة."
            : "\n⚠️ معندهاش رابط ميتنج محفوظ أو مش مربوطة بتيليجرام -- ابعتيلها اللينك بنفسك، وسؤال الحضور هيتبعت تلقائي بعد الحصة."));
        return new Response("ok");
      }

      // Anything else Re sends her own bot — nothing to do.
      return new Response("ok");
    }

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
          tg_user_id: from?.id ?? null,
          tg_username: from?.username ?? null,
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
        // .limit(1), not .maybeSingle(): two rows can share one chat (sisters
        // in one family chat), and maybeSingle() turns that into an error and
        // tells an already-linked student she is not linked.
        const { data: studentRows } = await supabase
          .from("telegram_links").select("id").eq("chat_id", chatId).limit(1);
        const { data: trialRows } = await supabase
          .from("trial_telegram").select("booking_id").eq("chat_id", chatId).limit(1);
        const existing = (studentRows?.length ?? 0) > 0 || (trialRows?.length ?? 0) > 0;
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
        // Not an enrolled student's code. A trial booking's code?
        const { data: trial } = await supabase
          .from("trial_telegram")
          .select("booking_id, chat_id")
          .eq("link_code", code)
          .maybeSingle();

        if (trial) {
          const { data: booking } = await supabase.from("trial_bookings")
            .select("name, class_language").eq("id", trial.booking_id).maybeSingle();
          const firstTime = trial.chat_id !== chatId;
          const { error: trialError } = await supabase.from("trial_telegram").update({
            chat_id: chatId,
            tg_user_id: from?.id ?? null,
            tg_username: from?.username ?? null,
            tg_first_name: from?.first_name ?? null,
            linked_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }).eq("booking_id", trial.booking_id);
          if (trialError) throw trialError;

          const en = booking?.class_language === "english";
          await sendMessage(cfg.bot_token, chatId, en
            ? `Hi ${booking?.name || tgName} 👋
You're connected to Klovers ✅
We'll send your trial class link here before it starts, and you can write to us here any time.`
            : `أهلاً ${booking?.name || tgName} 👋
اتربطتي بـ Klovers ✅
هنبعتلك هنا لينك حصة التراير قبل ما تبدأ، وتقدري تكتبيلنا هنا في أي وقت.`);

          if (firstTime) {
            const handle = from?.username ? ` (@${from.username})` : "";
            await sendMessage(cfg.bot_token, cfg.admin_chat_id,
              `🔗 ${booking?.name || "طالبة تراير"} (تراير) ربطت تيليجرام${handle}`);
          }
          return new Response("ok");
        }

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
        tg_user_id: from?.id ?? null,
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

    // A trial student who linked from her booking: name her, and say so, so
    // Re knows this is a lead writing in and not an enrolled student.
    let isTrialLead = false;
    if (!linked) {
      const { data: trialRows } = await supabase
        .from("trial_telegram")
        .select("booking_id")
        .eq("chat_id", chatId)
        .order("linked_at", { ascending: false })
        .limit(1);
      const bookingId = trialRows?.[0]?.booking_id;
      if (bookingId) {
        const { data } = await supabase.from("trial_bookings")
          .select("name").eq("id", bookingId).maybeSingle();
        if (data?.name) who = data.name;
        isTrialLead = true;
      }
    }

    const body = text || "(رسالة بدون نص — صورة أو ملف أو فويس)";
    await sendMessage(cfg.bot_token, cfg.admin_chat_id,
      `📩 ${who}${linked ? "" : isTrialLead ? " (تراير)" : " (مش مربوط)"}${from?.username ? ` @${from.username}` : ""}:\n${body}`);
  } catch (e) {
    console.error("telegram-webhook error", e);
  }
  return new Response("ok");
});
