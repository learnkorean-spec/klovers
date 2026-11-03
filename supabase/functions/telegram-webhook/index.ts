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

// Re, 2 Nov 2026: "group classes must be auto as well same like private" --
// group equivalent of the "att:" branch below. A group session is shared by
// several members (telegram_links keyed by user_id, not teacher_student_id),
// so the callback_data carries which member is answering as a 4th segment:
// gatt:<yes|no>:<session_id>:<user_id>. Same claim-only semantics as private:
// telegram_confirm_group_session inserts an UNAPPROVED pkg_attendance row,
// never bills by itself -- Re still approves it in GroupAttendanceManager.
async function handleGroupAttendanceTap(
  supabase: ReturnType<typeof createClient>,
  cfg: Config,
  chatId: number,
  messageId: number,
  cb: { id: string; from?: { id?: number } },
  gmatch: RegExpMatchArray,
) {
  const yes = gmatch[1] === "yes";
  const sessionId = gmatch[2];
  const userId = gmatch[3];
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

  // Resolve by (user_id) from the button itself, same reasoning as the
  // private flow: don't trust chat_id alone to pick the right member.
  const { data: link } = await supabase
    .from("telegram_links")
    .select("user_id, chat_id, tg_user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!link || link.chat_id !== chatId) {
    await answerCallbackQuery(cfg.bot_token, cb.id, "اللينك ده مش شغال.");
    return;
  }

  const { data: profile } = await supabase.from("profiles")
    .select("name, language").eq("user_id", userId).maybeSingle();
  const name = profile?.name ?? "";
  const dateLabel = new Date(session.session_date + "T12:00:00Z")
    .toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  const lang = profile?.language === "en" ? "en" : "ar";

  // Same identity lock as the private "att:" flow: confirm the tap actually
  // came from THIS member, not a groupmate answering on her behalf. Only
  // enforced once we actually have her tg_user_id on file.
  if (link.tg_user_id != null && tapperId != null && link.tg_user_id !== tapperId) {
    await answerCallbackQuery(
      cfg.bot_token, cb.id,
      lang === "en"
        ? `This button is only for ${name || "that student"} to answer.`
        : `الزرار ده مخصص لـ ${name || "الطالبة"} بس 🙏`,
    );
    return;
  }

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
      // happened (telegram-group-attendance-ask). A group session is shared
      // by several members, so the callback also carries which member is
      // answering -- that's the 4th segment, handled separately below.
      const gmatch = !match && typeof cb.data === "string"
        ? cb.data.match(/^gatt:(yes|no):([0-9a-fA-F-]{36}):([0-9a-fA-F-]{36})$/)
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
    const isPrivate = msg.chat.type === "private";
    const text: string = (msg.text ?? "").trim();
    const from = msg.from;
    const tgName = displayName(from);

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

    const body = text || "(رسالة بدون نص — صورة أو ملف أو فويس)";
    await sendMessage(cfg.bot_token, cfg.admin_chat_id,
      `📩 ${who}${linked ? "" : " (مش مربوط)"}${from?.username ? ` @${from.username}` : ""}:\n${body}`);
  } catch (e) {
    console.error("telegram-webhook error", e);
  }
  return new Response("ok");
});
