// Sends the trial-day reminder, about two hours before each class starts.
//
// Invoked every 15 minutes by pg_cron (trigger_trial_reminder). Idempotent:
// every booking carries `reminder_sent_at`, so a re-run inside the same window
// is a no-op and nobody is reminded twice.
//
// WHO: every LIVE booking on today's session — confirmed or silent. That is
// the opposite of send-trial-guide, on purpose. The book is the reward for
// confirming; this letter is the one that fills the room, and two hours before
// the class the useful act for a silent booking is to hand her the link rather
// than ask her again. Cancelled and TBA rows are excluded, as is anyone who
// has unsubscribed.
//
// WHEN: from LEAD_MINUTES before the class start until the class starts. The
// cron runs every 15 minutes, so the window is far wider than one tick: a
// skipped or failed run is caught by the next one, and the stamp still means
// exactly one letter. Past the start time the letter is no longer sent — a
// reminder for a class that has begun is worse than nothing.
//
// The class start is built from `trial_date` + `start_time` — the Cairo
// wall-clock pair every student-facing screen and letter reads — and NOT from
// `starts_at`. On 15 September eight of the eighteen bookings for Friday 18
// September carried a `starts_at` a full week later than their `trial_date`,
// and one of those eight had already confirmed. When two columns disagree, the
// letter follows the one the student was told. See send-trial-followups and
// claude/BOOK_LETTER_DATE_FIX_2026-09-16.md.
//
// Safety: `dry_run` defaults to TRUE, like send-trial-guide and
// send-attendance-confirmations. Nothing is sent unless the caller passes
// `dry_run: false`, which the cron does. A bare manual call lists who is due.
//
// verify_jwt MUST stay false (supabase/config.toml). Deployed with the default
// true, the gateway answers 401 UNAUTHORIZED_INVALID_JWT_FORMAT to the cron
// before a line of this file runs — measured on send-trial-guide, 15 Sep 2026.

import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { cairoDateKey, cairoHour, zonedMidnightUtc } from "../_shared/cairoTime.ts";
import { isCronOrAdmin } from "../_shared/cronAuth.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

/** How long before the class the reminder goes out. */
const LEAD_MINUTES = 120;

// Cairo hours in which a letter may be sent: 07:00 up to, not including,
// 22:00. Every trial today starts in the afternoon, so this only matters for a
// hypothetical dawn class — and a 05:00 letter would be worse than a missed
// one. Outside those hours a live run lists who is due and sends nothing.
const SEND_FROM_HOUR = 7;
const SEND_UNTIL_HOUR = 22;

// Resend allows 10 requests per second and answers the eleventh with a 429.
// On 17 September a batch of twelve letters lost two that way. This loop is
// sequential, so it can only reach that ceiling on a fast day - but a trial
// with twenty-five seats is exactly the day it would, and a reminder that
// does not arrive is the one failure this function exists to prevent. So the
// sends are spaced, and a 429 is retried once after a full second rather than
// left for the next quarter-hour run.
const SEND_GAP_MS = 150;
const RATE_LIMIT_WAIT_MS = 1200;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const isRateLimit = (msg: string) => /rate.?limit|\b429\b|too many requests/i.test(msg);

// The book, in the PRIVATE `student-materials` bucket, signed per letter. Same
// objects send-trial-guide uses. Optional here: this is a reminder, so if
// signing fails the letter still goes with the room link and simply carries no
// book button.
const GUIDE_OBJECT_AR = "klovers-trial-guide-ar.pdf";
const GUIDE_OBJECT_EN = "trial-guide-en.pdf";
const GUIDE_BUCKET = "student-materials";
const SIGNED_URL_TTL_SECONDS = 24 * 60 * 60;
const GUIDE_URL_OVERRIDE_AR = Deno.env.get("TRIAL_GUIDE_URL_AR") ?? "";
const GUIDE_URL_OVERRIDE_EN = Deno.env.get("TRIAL_GUIDE_URL_EN") ?? "";

const DEFAULT_SLOT_TZ = "Africa/Cairo";
const AR_LOCALE = "ar-EG-u-nu-latn";
const EN_LOCALE = "en-GB";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

interface Booking {
  id: string;
  name: string | null;
  email: string | null;
  trial_date: string;
  start_time: string | null;
  slot_id: string | null;
  user_id: string | null;
  level: string | null;
  class_language: string | null;
  meeting_url: string | null;
  reminder_sent_at: string | null;
}

interface SlotTime {
  start_time: string | null;
  timezone: string | null;
}

const SELECT_COLUMNS =
  "id, name, email, trial_date, start_time, slot_id, user_id, level, class_language, meeting_url, reminder_sent_at";

function pickLanguage(classLanguage: string | null): "ar" | "en" {
  return classLanguage === "arabic" ? "ar" : "en";
}

/** "HH:MM" from either the booking's own start_time or its slot's. */
function wallClock(b: Booking, slot: SlotTime | undefined): string {
  const own = (b.start_time ?? "").slice(0, 5);
  if (own) return own;
  return (slot?.start_time ?? "").slice(0, 5);
}

/** The instant the class starts, in epoch ms, or null when the time is unknown. */
function classStartMs(b: Booking, slot: SlotTime | undefined): number | null {
  const time = wallClock(b, slot);
  if (!b.trial_date || !time) return null;
  const [h, m] = time.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  const tz = slot?.timezone || DEFAULT_SLOT_TZ;
  return zonedMidnightUtc(b.trial_date, tz).getTime() + (h * 60 + m) * 60_000;
}

/** "الجمعة، 18 سبتمبر · 16:30 بتوقيت القاهرة" / "Friday 18 September · 16:30 Cairo" */
function classTimeLabel(b: Booking, slot: SlotTime | undefined, lang: "ar" | "en"): string {
  const locale = lang === "ar" ? AR_LOCALE : EN_LOCALE;
  const tz = slot?.timezone || DEFAULT_SLOT_TZ;
  const time = wallClock(b, slot);
  if (!b.trial_date || !time) return "";
  // Midday keeps the weekday right either side of a DST change; the printed
  // time is the literal wall-clock, unconverted.
  const noon = new Date(zonedMidnightUtc(b.trial_date, tz).getTime() + 12 * 60 * 60_000);
  const day = new Intl.DateTimeFormat(locale, {
    weekday: "long", day: "numeric", month: "long", timeZone: tz,
  }).format(noon);
  return lang === "ar" ? `${day} · ${time} بتوقيت القاهرة` : `${day} · ${time} Cairo`;
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

    let body: { dry_run?: boolean } = {};
    try { body = await req.json(); } catch { /* empty body = dry run */ }
    const dryRun = body?.dry_run !== false;

    const hourNow = cairoHour();
    const outsideHours = hourNow < SEND_FROM_HOUR || hourNow >= SEND_UNTIL_HOUR;
    const holdSend = dryRun || outsideHours;

    /** A fresh signed link for one reader, or null when it cannot be made. */
    async function guideUrlFor(lang: "ar" | "en"): Promise<string | null> {
      const override = lang === "ar" ? GUIDE_URL_OVERRIDE_AR : GUIDE_URL_OVERRIDE_EN;
      if (override) return override;
      const object = lang === "ar" ? GUIDE_OBJECT_AR : GUIDE_OBJECT_EN;
      const { data, error } = await supabase.storage
        .from(GUIDE_BUCKET)
        .createSignedUrl(object, SIGNED_URL_TTL_SECONDS);
      if (error || !data?.signedUrl) {
        console.error(`sign ${object}:`, error?.message ?? "no url returned");
        return null;
      }
      return data.signedUrl;
    }

    const today = cairoDateKey();

    const { data, error } = await supabase
      .from("trial_bookings")
      .select(SELECT_COLUMNS)
      .eq("trial_date", today)
      .is("reminder_sent_at", null)
      .not("is_tba", "is", true)
      .neq("status", "cancelled")
      .not("email", "is", null)
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

    const now = Date.now();
    const due = rows.filter(b => {
      const startMs = classStartMs(b, b.slot_id ? slots.get(b.slot_id) : undefined);
      if (startMs === null) return false;
      return now >= startMs - LEAD_MINUTES * 60_000 && now < startMs;
    });

    const recipients: Array<{ id: string; email: string; language: string; when: string; has_room: boolean }> = [];
    let sent = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const b of due) {
      if (!b.email) { skipped++; continue; }
      const slot = b.slot_id ? slots.get(b.slot_id) : undefined;
      const lang = pickLanguage(b.class_language);
      const when = classTimeLabel(b, slot, lang);
      const room = (b.meeting_url ?? "").trim();

      // No room, no reminder. The letter's one button is the room, and a
      // booking left unstamped is picked up by the next run once the room is
      // filled in — which is the behaviour Re needs on a day when a room is
      // assigned late.
      if (!room) {
        errors.push(`${b.id}: no meeting_url`);
        continue;
      }

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
              .update({ reminder_sent_at: new Date().toISOString() }).eq("id", b.id);
          }
          skipped++;
          continue;
        }
        unsubscribeToken = profile?.unsubscribe_token ?? undefined;
      }

      recipients.push({ id: b.id, email: b.email, language: lang, when, has_room: true });
      if (holdSend) continue;

      // Optional, unlike the book letter: a signing failure costs this letter
      // its second link, not its send.
      const guideUrl = await guideUrlFor(lang);

      const payload = {
        email: b.email,
        name: b.name || "there",
        language: lang,
        template: "trial_reminder",
        level: b.level,
        class_time_label: when,
        meeting_url: room,
        ...(guideUrl ? { guide_url: guideUrl } : {}),
        ...(unsubscribeToken ? { unsubscribe_token: unsubscribeToken } : {}),
      };

      const sendOnce = async () => {
        const { error: sendErr } = await supabase.functions.invoke("send-confirmation-email", {
          body: payload,
        });
        if (sendErr) throw new Error(sendErr.message);
      };

      try {
        try {
          await sendOnce();
        } catch (first) {
          const msg = first instanceof Error ? first.message : String(first);
          if (!isRateLimit(msg)) throw first;
          // One second is the whole window: waiting it out costs this run a
          // second and saves the student a letter that would otherwise arrive
          // fifteen minutes later, or - if the class has started by then -
          // never.
          await sleep(RATE_LIMIT_WAIT_MS);
          await sendOnce();
        }
        await supabase.from("trial_bookings")
          .update({ reminder_sent_at: new Date().toISOString() }).eq("id", b.id);
        sent++;
      } catch (e) {
        errors.push(`${b.id}: ${e instanceof Error ? e.message : String(e)}`);
      }

      await sleep(SEND_GAP_MS);
    }

    const result = {
      ok: true, dry_run: dryRun, date: today, lead_minutes: LEAD_MINUTES,
      cairo_hour: hourNow, held_outside_hours: !dryRun && outsideHours,
      today_unreminded: rows.length, due: due.length, sent, skipped, recipients, errors,
    };
    console.log("trial-reminder:", JSON.stringify(result));
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("trial-reminder error:", msg);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
