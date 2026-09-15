// Post-trial follow-up sequence dispatcher.
// Invoked hourly by pg_cron (trigger_trial_followups). Idempotent: each
// trial_booking tracks which stages have been sent, so re-running the
// same hour is a no-op.
//
// Four stages:
//   prep       — trial is tomorrow (Cairo)      → placement test + prep tips
//   postclass  — 2 h after the class ENDS       → enrolment CTA
//   day3       — trial was 3 days ago (Cairo)   → WhatsApp final nudge
//   day7       — trial was 7 days ago (Cairo)   → check-in + share link
//
// Users who already have an APPROVED enrollment are skipped (they converted).
//
// Auth comes from _shared/cronAuth.ts — a cron secret verified against Vault,
// or an admin JWT. It used to be a local copy that read CRON_SECRET from the
// environment; nothing ever set it, so every scheduled call was refused with
// 401 and not one follow-up email has ever been sent.

import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { cairoDateKey, shiftDateKey, zonedMidnightUtc } from "../_shared/cairoTime.ts";
import { isCronOrAdmin } from "../_shared/cronAuth.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

type Stage = "prep" | "postclass" | "day3" | "day7";

interface Booking {
  id: string;
  name: string | null;
  email: string | null;
  trial_date: string;
  start_time: string | null;
  duration_min: number | null;
  user_id: string | null;
  level: string | null;
  class_language: string | null;
  followup_prep_sent_at: string | null;
  followup_day1_sent_at: string | null;
  followup_day3_sent_at: string | null;
  followup_day7_sent_at: string | null;
}

function pickLanguage(classLanguage: string | null): "ar" | "en" {
  if (classLanguage === "arabic") return "ar";
  return "en";
}

// `postclass` keeps the `trial_followup_day1` slug and the
// `followup_day1_sent_at` column. Registering a new slug would mean editing
// the 61 KB trial.ts and the template union in common.ts; the letter's COPY
// moved to templates/postTrial.ts instead, which is the part that needed to
// change. The name in this file is the honest one: it fires off the clock,
// not off a calendar day.
const STAGE_TEMPLATE: Record<Stage, "trial_prep" | "trial_followup_day1" | "trial_followup_day3" | "trial_followup_day7"> = {
  prep: "trial_prep",
  postclass: "trial_followup_day1",
  day3: "trial_followup_day3",
  day7: "trial_followup_day7",
};

const STAGE_COLUMN: Record<Stage, "followup_prep_sent_at" | "followup_day1_sent_at" | "followup_day3_sent_at" | "followup_day7_sent_at"> = {
  prep: "followup_prep_sent_at",
  postclass: "followup_day1_sent_at",
  day3: "followup_day3_sent_at",
  day7: "followup_day7_sent_at",
};

// Offset in days from today (Cairo) to the trial_date we want to target, for
// the stages that are aimed at a calendar day.
//   prep  → trial is tomorrow  (+1)
//   day3  → 3 days after trial (-3)
//   day7  → 7 days after trial (-7)
//
// Because each of these matches an EXACT date, turning this endpoint back on
// does not replay a backlog: bookings whose trial has already passed by more
// than the offset are never selected again.
const STAGE_DAY_OFFSET: Record<"prep" | "day3" | "day7", number> = {
  prep: 1,
  day3: -3,
  day7: -7,
};

const SELECT_COLUMNS =
  "id, name, email, trial_date, start_time, duration_min, user_id, level, class_language, " +
  "followup_prep_sent_at, followup_day1_sent_at, followup_day3_sent_at, followup_day7_sent_at";

/** Two hours after the class ends, and for the 24 h after that. */
const POSTCLASS_DELAY_MS = 2 * 60 * 60 * 1000;
/**
 * How long the window stays open. The cron runs hourly, so one skipped or
 * failed hour would silently lose everyone in a 60-minute slice if the window
 * were exact. A day of slack means a missed hour is caught on the next run,
 * and the `followup_day1_sent_at` stamp still guarantees exactly one letter.
 */
const POSTCLASS_WINDOW_MS = 24 * 60 * 60 * 1000;
/**
 * How far back the postclass query looks. The window closes 26 h after a class
 * ends, so two days of trial_date covers every row that could still be due,
 * with a day to spare for a late class and a skipped run.
 */
const POSTCLASS_LOOKBACK_DAYS = 2;
/** Fallback when duration_min is null. Every live booking today is 30. */
const DEFAULT_DURATION_MIN = 30;

/**
 * When this booking's class ends, as an epoch millisecond count.
 *
 * Built from `trial_date` + `start_time` — the Cairo wall-clock pair that every
 * other trial view in the app reads, and the pair `trial_slots` is keyed on —
 * rather than from the `starts_at` instant.
 *
 * WHY NOT starts_at
 * On 15 September eight of the eighteen bookings for Friday 18 September
 * carried a starts_at a full week later than their trial_date. The invitation,
 * the attendance question and every screen read trial_date, so those eight had
 * been told Friday, and one of them had already answered that she was coming.
 * A dispatcher reading starts_at would have written to ten people on the night
 * and reached the other eight seven days after their class. When two columns
 * disagree, the letter has to follow the one the student was told.
 */
function classEndMs(b: Booking): number | null {
  if (!b.trial_date || !b.start_time) return null;
  const [h, m, s] = b.start_time.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  const startMs =
    zonedMidnightUtc(b.trial_date).getTime() +
    ((h * 60 + m) * 60 + (Number.isFinite(s) ? s : 0)) * 1000;
  return startMs + (b.duration_min ?? DEFAULT_DURATION_MIN) * 60_000;
}

async function dispatchStage(
  supabase: ReturnType<typeof createClient>,
  stage: Stage,
): Promise<{ stage: Stage; attempted: number; sent: number; skipped: number; errors: string[] }> {
  const column = STAGE_COLUMN[stage];

  let rows: Booking[] = [];

  if (stage === "postclass") {
    // Off the clock, not off the calendar. NOTHING in the database records
    // that a trial happened — no attended mark, no completed status — so a
    // follow-up can never be aimed at the people who actually came. The time
    // can be aimed precisely, though: the class's own start plus its duration
    // plus 2 h is knowable without any attendance data. Everyone who booked is
    // written to, no-shows included, which Re decided is the right trade.
    //
    // The query is a coarse date range; the exact decision is made below, per
    // booking, from that booking's own start time and duration. See classEndMs
    // for why the wall-clock pair is the source and starts_at is not.
    const now = Date.now();
    const today = cairoDateKey();

    const { data, error } = await supabase
      .from("trial_bookings")
      .select(SELECT_COLUMNS)
      .gte("trial_date", shiftDateKey(today, -POSTCLASS_LOOKBACK_DAYS))
      .lte("trial_date", today)
      .is(column, null)
      .not("is_tba", "is", true)
      .neq("status", "cancelled")
      .not("email", "is", null)
      .limit(200);

    if (error) throw new Error(`query ${stage}: ${error.message}`);

    rows = ((data ?? []) as Booking[]).filter(b => {
      const endsAt = classEndMs(b);
      if (endsAt === null) return false;
      const due = endsAt + POSTCLASS_DELAY_MS;
      return now >= due && now < due + POSTCLASS_WINDOW_MS;
    });
  } else {
    const targetDate = shiftDateKey(cairoDateKey(), STAGE_DAY_OFFSET[stage]);

    const { data, error } = await supabase
      .from("trial_bookings")
      .select(SELECT_COLUMNS)
      .eq("trial_date", targetDate)
      .is(column, null)
      .not("is_tba", "is", true)
      .neq("status", "cancelled")
      .not("email", "is", null)
      .limit(200);

    if (error) throw new Error(`query ${stage}: ${error.message}`);
    rows = (data ?? []) as Booking[];
  }

  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  // Collect user_ids to check enrollment status in one round trip.
  //
  // `approval_status`, not `status`. Both columns exist on enrollments and
  // they disagree: rows sit at status=APPROVED / approval_status=REJECTED.
  // approval_status is the one the rest of the app reads, and the one that
  // means "this person enrolled".
  const userIds = rows.map(r => r.user_id).filter((u): u is string => Boolean(u));
  let approvedUsers = new Set<string>();
  if (userIds.length > 0) {
    const { data: enrolls } = await supabase
      .from("enrollments")
      .select("user_id")
      .eq("approval_status", "APPROVED")
      .in("user_id", userIds);
    approvedUsers = new Set((enrolls ?? []).map(e => e.user_id as string));
  }

  for (const b of rows) {
    // This check used to be written `if (false && ...)`, so it has never once
    // run: a student who had already enrolled still received the whole
    // follow-up sequence asking her to enrol.
    if (b.user_id && approvedUsers.has(b.user_id)) {
      // Already a student — mark the column so we stop re-querying this row.
      await supabase.from("trial_bookings").update({ [column]: new Date().toISOString() }).eq("id", b.id);
      skipped++;
      continue;
    }
    if (!b.email) { skipped++; continue; }

    // Respect unsubscribe preference and fetch the token so every stage's
    // email includes a working one-click unsubscribe link.
    let unsubscribeToken: string | undefined;
    let referralUrl: string | undefined;
    if (b.user_id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("unsubscribe_token, email_unsubscribed")
        .eq("user_id", b.user_id)
        .maybeSingle();
      if (profile?.email_unsubscribed) {
        await supabase.from("trial_bookings").update({ [column]: new Date().toISOString() }).eq("id", b.id);
        skipped++;
        continue;
      }
      unsubscribeToken = profile?.unsubscribe_token ?? undefined;
      if (stage === "day7") referralUrl = `https://kloversegy.com/free-trial?ref=${b.user_id}`;
    }

    try {
      const { error: sendErr } = await supabase.functions.invoke("send-confirmation-email", {
        body: {
          email: b.email,
          name: b.name || "there",
          language: pickLanguage(b.class_language),
          template: STAGE_TEMPLATE[stage],
          level: b.level,
          ...(unsubscribeToken ? { unsubscribe_token: unsubscribeToken } : {}),
          ...(referralUrl ? { referral_url: referralUrl } : {}),
        },
      });
      if (sendErr) throw new Error(sendErr.message);
      await supabase.from("trial_bookings").update({ [column]: new Date().toISOString() }).eq("id", b.id);
      sent++;
    } catch (e) {
      errors.push(`${b.id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return { stage, attempted: rows.length, sent, skipped, errors };
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

    // Run each stage independently so one failure doesn't block others
    const results = await Promise.allSettled(
      (["prep", "postclass", "day3", "day7"] as Stage[]).map(s => dispatchStage(supabase, s)),
    );
    const settled = results.map(r =>
      r.status === "fulfilled" ? r.value : { stage: "unknown", error: r.reason?.message ?? String(r.reason) }
    );

    console.log("trial-followups:", JSON.stringify(settled));
    return new Response(JSON.stringify({ ok: true, results: settled }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("trial-followups error:", msg);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
