// The bot's own follow-ups. Cron, every 15 minutes (trigger_telegram_followups),
// service role only. Three independent sweeps; each is idempotent, so a
// re-run in the same window sends nothing twice.
//
//   1. Trial reminder    her trial starts within 75 minutes and she pressed
//                        Start on the bot: the class link arrives on Telegram
//                        too, beside the email that sometimes never does.
//   2. Enrol nudge       she came to the trial, two days have passed, and
//                        there is still no enrolment: one message with the
//                        enrol link. Once per booking, daytime Cairo only.
//   3. Absence alert     a group student has missed three classes in a row
//                        (on a real signal, see the SQL function): Re is told
//                        once per streak, on Telegram and in the dashboard.
//   4. Carry the link    she pressed Start as a TRIAL student and now has an
//                        account: her chat is copied onto telegram_links, the
//                        table every paid-student reminder reads. Without
//                        this she would have to be sent a second link and
//                        press Start again the day she enrols, and until she
//                        did, her class reminders would go nowhere.
//
// Re, 13 Nov 2026: "all not connected steps that why i am lost and cannot
// sent the emails so they pay". Sweeps 1 and 2 are the two places a student
// used to fall through with nobody noticing; sweep 3 is the same hole on the
// paid side.

import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { ENROLL_NOW_LINK, firstName, getTelegramConfig, sendText } from "../_shared/telegram.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function isAuthorizedServiceCall(req: Request): boolean {
  const header = req.headers.get("authorization")?.trim();
  const token = header?.startsWith("Bearer ") ? header.slice(7).trim() : null;
  return !!token && token === SERVICE_ROLE_KEY;
}

function cairoHour(): number {
  return Number(
    new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Cairo", hour: "2-digit", hourCycle: "h23" })
      .format(new Date()),
  );
}

function cairoClock(at: string, isAr: boolean): string {
  const clock = new Intl.DateTimeFormat(isAr ? "ar-EG-u-nu-latn" : "en-US", {
    hour: "numeric", minute: "2-digit", timeZone: "Africa/Cairo",
  }).format(new Date(at));
  return isAr ? `${clock} بتوقيت مصر` : `${clock} (Cairo time)`;
}

Deno.serve(async (req) => {
  if (!isAuthorizedServiceCall(req)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { "Content-Type": "application/json" },
    });
  }
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  let cfg;
  try {
    cfg = await getTelegramConfig(supabase);
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "config error" }), { status: 500 });
  }

  const out = {
    trial_reminders: 0, enroll_nudges: 0, absence_alerts: 0, links_carried: 0, errors: [] as string[],
  };

  // 1. Trial reminders ------------------------------------------------------
  {
    const { data, error } = await supabase.rpc("telegram_trial_reminder_candidates");
    if (error) out.errors.push(`reminder: ${error.message}`);
    for (const r of (data ?? []) as {
      booking_id: string; name: string; chat_id: number; class_language: string;
      meeting_url: string; starts_at: string;
    }[]) {
      const isAr = r.class_language !== "english";
      const first = firstName(r.name);
      const text = isAr
        ? `هاي ${first || "يا قمر"} \u{1F44B}\nحصة التراير بتاعتك قربت، الساعة ${cairoClock(r.starts_at, true)}.\nلينك الحصة:\n${r.meeting_url}`
        : `Hi ${first || "there"} \u{1F44B}\nYour trial class is coming up at ${cairoClock(r.starts_at, false)}.\nClass link:\n${r.meeting_url}`;
      const sent = await sendText(cfg.bot_token, r.chat_id, text);
      if (!sent.ok) continue;
      await supabase.from("trial_telegram")
        .update({ trial_reminder_sent_at: new Date().toISOString() })
        .eq("booking_id", r.booking_id);
      out.trial_reminders++;
    }
  }

  // 2. Enrol nudges ---------------------------------------------------------
  // Nobody wants a sales nudge at 3am: 10:00 to 20:59 Cairo only. Outside
  // that the candidates simply wait for the next daytime run.
  const hour = cairoHour();
  if (hour >= 10 && hour < 21) {
    const { data, error } = await supabase.rpc("telegram_trial_nudge_candidates");
    if (error) out.errors.push(`nudge: ${error.message}`);
    for (const r of (data ?? []) as {
      booking_id: string; name: string; chat_id: number; class_language: string;
    }[]) {
      const isAr = r.class_language !== "english";
      const first = firstName(r.name);
      const text = isAr
        ? `هاي ${first || "يا قمر"} \u{1F33F}\nمبسوطين إنك جربتي الحصة معانا. لو حابة تكملي، مكانك لسه متاح، سجلي من هنا:\n${ENROLL_NOW_LINK}\n\nولو عندك أي سؤال اكتبيه هنا وهنرد عليكي.`
        : `Hi ${first || "there"} \u{1F33F}\nWe loved having you in the trial. If you'd like to continue, your seat is still open:\n${ENROLL_NOW_LINK}\n\nAny question, just write it here and we'll answer.`;
      const sent = await sendText(cfg.bot_token, r.chat_id, text);
      if (!sent.ok) continue;
      await supabase.from("trial_telegram")
        .update({ enroll_nudge_sent_at: new Date().toISOString() })
        .eq("booking_id", r.booking_id);
      await sendText(cfg.bot_token, cfg.admin_chat_id,
        `\u{1F4E8} البوت فكّر ${r.name || "طالبة"} بلينك التسجيل (حضرت التراير ومسجلتش لسه).`);
      out.enroll_nudges++;
    }
  }

  // 3. Repeated absence -----------------------------------------------------
  {
    const { data, error } = await supabase.rpc("telegram_repeated_absence_candidates");
    if (error) out.errors.push(`absence: ${error.message}`);
    for (const r of (data ?? []) as {
      user_id: string; group_id: string; full_name: string; group_name: string;
      last_session_id: string; last_session_date: string;
    }[]) {
      // Log first: if the log insert fails (a concurrent run got there), skip
      // the alert rather than send it twice.
      const { error: logError } = await supabase.from("telegram_absence_alert_log").insert({
        user_id: r.user_id, group_id: r.group_id, last_session_id: r.last_session_id,
      });
      if (logError) continue;

      await supabase.from("admin_notifications").insert({
        message: `${r.full_name} has missed 3 classes in a row in ${r.group_name} (last: ${r.last_session_date}) — check in with her`,
        category: "update",
        type: "repeated_absence",
        related_user_id: r.user_id,
      });
      await sendText(cfg.bot_token, cfg.admin_chat_id,
        `\u{26A0}\u{FE0F} ${r.full_name} غابت 3 حصص ورا بعض في ${r.group_name} (آخرها ${r.last_session_date}) — كلميها.`);
      out.absence_alerts++;
    }
  }

  // 4. Carry trial links onto the student's account -------------------------
  // Private chats only (chat_id > 0): a trial link is always pressed in a
  // 1:1 chat with the bot, and a group id here would point every reminder
  // for her at a room full of other people.
  try {
    const { data: linked, error } = await supabase
      .from("trial_telegram")
      .select("booking_id, chat_id, tg_user_id, tg_username, tg_first_name, linked_at")
      .gt("chat_id", 0);
    if (error) throw error;

    const rows = (linked ?? []) as {
      booking_id: string; chat_id: number; tg_user_id: number | null;
      tg_username: string | null; tg_first_name: string | null; linked_at: string | null;
    }[];

    if (rows.length > 0) {
      const { data: bookings, error: bErr } = await supabase
        .from("trial_bookings")
        .select("id, email, user_id")
        .in("id", rows.map((r) => r.booking_id));
      if (bErr) throw bErr;

      const emails = Array.from(new Set(
        (bookings ?? []).filter((b) => !b.user_id && b.email).map((b) => String(b.email).toLowerCase()),
      ));
      const userByEmail = new Map<string, string>();
      if (emails.length > 0) {
        const { data: profiles, error: pErr } = await supabase
          .from("profiles").select("user_id, email").in("email", emails);
        if (pErr) throw pErr;
        for (const p of profiles ?? []) {
          if (p.user_id && p.email) userByEmail.set(String(p.email).toLowerCase(), p.user_id);
        }
      }

      // Newest link wins when one student has more than one trial booking.
      const byUser = new Map<string, typeof rows[number]>();
      for (const r of rows) {
        const b = (bookings ?? []).find((x) => x.id === r.booking_id);
        const uid = b?.user_id ?? (b?.email ? userByEmail.get(String(b.email).toLowerCase()) : undefined);
        if (!uid) continue;
        const prev = byUser.get(uid);
        if (!prev || (r.linked_at ?? "") > (prev.linked_at ?? "")) byUser.set(uid, r);
      }

      if (byUser.size > 0) {
        const { data: existing, error: eErr } = await supabase
          .from("telegram_links").select("user_id, chat_id").in("user_id", Array.from(byUser.keys()));
        if (eErr) throw eErr;
        const have = new Map((existing ?? []).map((e) => [e.user_id as string, e.chat_id as number | null]));

        for (const [uid, r] of byUser) {
          // Already linked as a student, by her own press of a student link:
          // that is the newer, deliberate choice. Never overwrite it.
          if (have.get(uid) != null) continue;
          const fields = {
            chat_id: r.chat_id,
            tg_user_id: r.tg_user_id,
            tg_username: r.tg_username,
            tg_first_name: r.tg_first_name,
            linked_at: r.linked_at ?? new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          const { error: wErr } = have.has(uid)
            ? await supabase.from("telegram_links").update(fields).eq("user_id", uid).is("chat_id", null)
            : await supabase.from("telegram_links").insert({ user_id: uid, ...fields });
          if (wErr) {
            out.errors.push(`carry ${uid}: ${wErr.message}`);
            continue;
          }
          out.links_carried++;
        }
      }
    }
  } catch (e) {
    out.errors.push(`carry: ${String((e as Error)?.message ?? e)}`);
  }

  return new Response(JSON.stringify(out), { headers: { "Content-Type": "application/json" } });
});
