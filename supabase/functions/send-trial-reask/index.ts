// The second ask: writes to the bookings on one trial date that were asked
// whether they are coming and never answered.
//
// Manual by design — no cron. Who gets a second letter, and when, is Re's
// call: it depends on how many seats are already confirmed and whether the
// class is still worth running. `dry_run` therefore defaults to TRUE, and the
// caller must pass `dry_run: false` to send anything.
//
// One letter per booking, ever: `attendance_followup_manual_at` is stamped on
// a 2xx and every query excludes rows that already carry it. Re-running the
// same day is a no-op.
//
// It does NOT carry the book link. The book is for the students who confirm
// (send-trial-guide); including it here would hand it to everyone written to.
//
// verify_jwt is false in supabase/config.toml — the function does its own
// authorisation with isCronOrAdmin. A missing entry there means the gateway
// answers 401 before this file runs, which cost a debugging session on
// 15 Sep 2026.

import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { cairoDateKey, zonedMidnightUtc } from "../_shared/cairoTime.ts";
import { isCronOrAdmin } from "../_shared/cronAuth.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const DEFAULT_SLOT_TZ = "Africa/Cairo";
const DEFAULT_DURATION_MIN = 30;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

interface Booking {
  id: string;
  name: string | null;
  email: string | null;
  trial_date: string;
  starts_at: string | null;
  slot_id: string | null;
  duration_min: number | null;
  user_id: string | null;
  level: string | null;
  class_language: string | null;
  confirmation_token: string | null;
}

interface SlotTime {
  start_time: string | null;
  timezone: string | null;
}

const SELECT_COLUMNS =
  "id, name, email, trial_date, starts_at, slot_id, duration_min, user_id, level, class_language, confirmation_token";

function pickLanguage(classLanguage: string | null): "ar" | "en" {
  return classLanguage === "arabic" ? "ar" : "en";
}

/**
 * "الجمعة 18 سبتمبر · 16:30 بتوقيت القاهرة" / "Friday 18 September · 16:30 Cairo"
 *
 * From `trial_date` and the slot's own `start_time`, never from `starts_at`.
 * Eight bookings on Friday 18 September carried a `starts_at` of 25 September,
 * seven of them silent and therefore exactly the readers of this letter - it
 * would have offered them next Friday. `trial_date` is the date each of them
 * was told. Same correction as PR #426 (post-class letter) and #434 (book
 * letter); this was the last student-facing reader of `starts_at`.
 */
function classTimeLabel(
  trialDate: string,
  slot: SlotTime | undefined,
  startsAt: string | null,
  lang: "ar" | "en",
): string {
  const locale = lang === "ar" ? "ar-EG" : "en-GB";
  const tz = slot?.timezone || DEFAULT_SLOT_TZ;
  const time = (slot?.start_time ?? "").slice(0, 5);

  if (trialDate && time) {
    // Midday on that date, in the slot's own zone: the weekday stays right
    // either side of a DST change, and the printed time is the slot's literal
    // start_time, unconverted.
    const noon = new Date(zonedMidnightUtc(trialDate, tz).getTime() + 12 * 60 * 60_000);
    const day = new Intl.DateTimeFormat(locale, {
      weekday: "long", day: "numeric", month: "long", timeZone: tz,
    }).format(noon);
    return lang === "ar"
      ? `${day} · ${time} بتوقيت القاهرة`
      : `${day} · ${time} Cairo`;
  }

  if (!startsAt) return "";
  const d = new Date(startsAt);
  const day = new Intl.DateTimeFormat(locale, {
    weekday: "long", day: "numeric", month: "long", timeZone: DEFAULT_SLOT_TZ,
  }).format(d);
  const fallbackTime = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit", minute: "2-digit", hour12: false, timeZone: DEFAULT_SLOT_TZ,
  }).format(d);
  return lang === "ar"
    ? `${day} · ${fallbackTime} بتوقيت القاهرة`
    : `${day} · ${fallbackTime} Cairo`;
}

function durationLabel(minutes: number, lang: "ar" | "en"): string {
  return lang === "ar"
    ? `${minutes} دقيقة · مباشرة مع المدرّسة · مجموعة صغيرة`
    : `${minutes} minutes · live with the teacher · small group`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set");
    }
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    if (!(await isCronOrAdmin(req, supabase))) {
      return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let body: { trial_date?: string; dry_run?: boolean } = {};
    try { body = await req.json(); } catch { /* empty body = dry run, next date */ }
    const dryRun = body?.dry_run !== false;

    // Which class. Given explicitly, or the earliest upcoming date that still
    // has an unanswered booking - never a past date, so a forgotten call can
    // not write to a class that has already happened.
    let targetDate = (body?.trial_date ?? "").trim();
    if (!targetDate) {
      const { data: next, error: nextErr } = await supabase
        .from("trial_bookings")
        .select("trial_date")
        .gte("trial_date", cairoDateKey())
        .is("attendance_response", null)
        .is("attendance_followup_manual_at", null)
        .not("is_tba", "is", true)
        .neq("status", "cancelled")
        .order("trial_date", { ascending: true })
        .limit(1);
      if (nextErr) throw new Error(`next date: ${nextErr.message}`);
      targetDate = (next ?? [])[0]?.trial_date ?? "";
    }

    if (!targetDate) {
      return new Response(JSON.stringify({
        ok: true, dry_run: dryRun, trial_date: null,
        matched: 0, sent: 0, skipped: 0, recipients: [], errors: [],
        note: "no upcoming date has an unanswered booking",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data, error } = await supabase
      .from("trial_bookings")
      .select(SELECT_COLUMNS)
      .eq("trial_date", targetDate)
      .is("attendance_response", null)
      .is("attendance_followup_manual_at", null)
      .not("attendance_email_sent_at", "is", null)
      .not("is_tba", "is", true)
      .neq("status", "cancelled")
      .not("email", "is", null)
      .not("confirmation_token", "is", null)
      .limit(200);

    if (error) throw new Error(`query: ${error.message}`);
    const rows = (data ?? []) as Booking[];

    // One round trip for the slot wall-clocks, keyed by slot id.
    const slotIds = [...new Set(rows.map(r => r.slot_id).filter((s): s is string => Boolean(s)))];
    const slots = new Map<string, SlotTime>();
    if (slotIds.length > 0) {
      const { data: slotRows, error: slotErr } = await supabase
        .from("trial_slots")
        .select("id, start_time, timezone")
        .in("id", slotIds);
      if (slotErr) console.error("slot times:", slotErr.message);
      for (const s of slotRows ?? []) {
        slots.set(s.id as string, {
          start_time: (s.start_time as string) ?? null,
          timezone: (s.timezone as string) ?? null,
        });
      }
    }

    const recipients: Array<{ id: string; name: string | null; email: string; language: string; when: string }> = [];
    let sent = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const b of rows) {
      if (!b.email || !b.confirmation_token) { skipped++; continue; }
      const lang = pickLanguage(b.class_language);
      const when = classTimeLabel(b.trial_date, b.slot_id ? slots.get(b.slot_id) : undefined, b.starts_at, lang);

      let unsubscribeToken: string | undefined;
      if (b.user_id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("unsubscribe_token, email_unsubscribed")
          .eq("user_id", b.user_id)
          .maybeSingle();
        if (profile?.email_unsubscribed) {
          if (!dryRun) {
            await supabase.from("trial_bookings")
              .update({ attendance_followup_manual_at: new Date().toISOString() })
              .eq("id", b.id);
          }
          skipped++;
          continue;
        }
        unsubscribeToken = profile?.unsubscribe_token ?? undefined;
      }

      recipients.push({ id: b.id, name: b.name, email: b.email, language: lang, when });
      if (dryRun) continue;

      try {
        const { error: sendErr } = await supabase.functions.invoke("send-confirmation-email", {
          body: {
            email: b.email,
            name: b.name || (lang === "ar" ? "طالبتنا" : "there"),
            language: lang,
            template: "trial_reask",
            level: b.level,
            confirmation_token: b.confirmation_token,
            class_time_label: when,
            duration_label: durationLabel(b.duration_min ?? DEFAULT_DURATION_MIN, lang),
            ...(unsubscribeToken ? { unsubscribe_token: unsubscribeToken } : {}),
          },
        });
        if (sendErr) throw new Error(sendErr.message);
        await supabase.from("trial_bookings")
          .update({ attendance_followup_manual_at: new Date().toISOString() })
          .eq("id", b.id);
        sent++;
      } catch (e) {
        errors.push(`${b.id}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    const result = {
      ok: true, dry_run: dryRun, trial_date: targetDate,
      matched: rows.length, sent, skipped, recipients, errors,
    };
    console.log("trial-reask:", JSON.stringify(result));
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("trial-reask error:", msg);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
