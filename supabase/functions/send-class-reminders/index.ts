// The day-before reminder for paid group classes.
//
// Rewritten 16 Sep 2026. The previous version had no cron job (it never ran),
// no authorisation, wrote English only, and put one global link
// (app_settings.zoom_meeting_url) in every letter instead of the group's room.
//
// Now:
//   * Invoked hourly by pg_cron (trigger_class_reminders, :50).
//   * Who: fn_class_reminders_due() - seated students of STARTED groups with a
//     session tomorrow (Cairo), not yet reminded for that session.
//   * What: the `class_reminder` letter via send-confirmation-email, in the
//     class language, with the group's own meeting_url and WhatsApp.
//   * Once: each send is recorded in class_reminder_sends.
//   * When: live runs send only 09:00-21:59 Cairo; outside that they list who
//     is due and send nothing.
//   * Safety: `dry_run` defaults to TRUE. The cron passes `dry_run: false`.
//
// verify_jwt is false in supabase/config.toml; the function authorises itself
// (cron secret via Vault, or an admin JWT).

import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { cairoHour, zonedMidnightUtc } from "../_shared/cairoTime.ts";
import { isCronOrAdmin } from "../_shared/cronAuth.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const SEND_FROM_HOUR = 9;
const SEND_UNTIL_HOUR = 22;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

interface DueRow {
  session_id: string;
  user_id: string;
  session_date: string;
  group_name: string | null;
  start_time: string | null;
  duration_min: number | null;
  timezone: string | null;
  level: string | null;
  meeting_url: string;
  name: string | null;
  email: string;
  language: string;
  unsubscribe_token: string | null;
  email_unsubscribed: boolean;
}

const CITY_AR: Record<string, string> = { "Africa/Cairo": "القاهرة" };

/** "الخميس 17 سبتمبر · 15:00 بتوقيت القاهرة" / "Thursday 17 September · 15:00 Cairo" */
function whenLabel(date: string, time: string | null, tz: string, isAr: boolean): string {
  const noon = new Date(zonedMidnightUtc(date, tz).getTime() + 12 * 60 * 60_000);
  const day = new Intl.DateTimeFormat(isAr ? "ar-EG-u-nu-latn" : "en-GB", {
    weekday: "long", day: "numeric", month: "long", timeZone: tz,
  }).format(noon);
  const hhmm = (time ?? "").slice(0, 5);
  const city = tz.split("/").pop()!.replace(/_/g, " ");
  if (!hhmm) return day;
  return isAr
    ? `${day} · ${hhmm} بتوقيت ${CITY_AR[tz] ?? city}`
    : `${day} · ${hhmm} ${city}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set");
    }
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

    if (!(await isCronOrAdmin(req, supabase))) {
      return json({ ok: false, error: "Unauthorized" }, 401);
    }

    let body: { dry_run?: boolean } = {};
    try { body = await req.json(); } catch { /* empty body = dry run */ }
    const dryRun = body?.dry_run !== false;

    const hourNow = cairoHour();
    const outsideHours = hourNow < SEND_FROM_HOUR || hourNow >= SEND_UNTIL_HOUR;
    const holdSend = dryRun || outsideHours;

    const { data, error } = await supabase.rpc("fn_class_reminders_due");
    if (error) throw new Error(`fn_class_reminders_due: ${error.message}`);
    const rows = (data ?? []) as DueRow[];

    const recipients: Array<{ session_id: string; email: string; group: string | null; language: string; when: string }> = [];
    let sent = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const r of rows) {
      const isAr = r.language === "ar";
      const tz = r.timezone || "Africa/Cairo";
      const when = whenLabel(r.session_date, r.start_time, tz, isAr);

      if (r.email_unsubscribed) {
        if (!holdSend) {
          await supabase.from("class_reminder_sends")
            .insert({ session_id: r.session_id, user_id: r.user_id });
        }
        skipped++;
        continue;
      }

      recipients.push({ session_id: r.session_id, email: r.email, group: r.group_name, language: r.language, when });
      if (holdSend) continue;

      try {
        const { error: sendErr } = await supabase.functions.invoke("send-confirmation-email", {
          body: {
            email: r.email,
            name: (r.name || "").trim() || (isAr ? "طالبتنا العزيزة" : "there"),
            language: isAr ? "ar" : "en",
            template: "class_reminder",
            level: r.level,
            group_name: r.group_name,
            class_link_url: r.meeting_url,
            class_time_label: when,
            ...(r.unsubscribe_token ? { unsubscribe_token: r.unsubscribe_token } : {}),
          },
        });
        if (sendErr) throw new Error(sendErr.message);
        const { error: stampErr } = await supabase.from("class_reminder_sends")
          .insert({ session_id: r.session_id, user_id: r.user_id });
        if (stampErr) errors.push(`${r.session_id}/${r.user_id}: sent but not recorded - ${stampErr.message}`);
        sent++;
      } catch (e) {
        errors.push(`${r.session_id}/${r.user_id}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    const result = {
      ok: true, dry_run: dryRun, cairo_hour: hourNow,
      held_outside_hours: !dryRun && outsideHours,
      matched: rows.length, sent, skipped, recipients, errors,
    };
    console.log("class-reminders:", JSON.stringify(result));
    return json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("class-reminders error:", msg);
    return json({ ok: false, error: msg }, 500);
  }
});
