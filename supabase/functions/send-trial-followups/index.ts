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
// Users who already have an APPROVED enrollment are skipped (they converted),
// and so is anyone who answered the attendance question with "no".
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
  // 'yes' | 'no' | null. NULL is the common case: most bookings never answer.
  attendance_response: string | null;
  followup_prep_sent_at: string | null;
  followup_day1_sent_at: string | null;
  followup_day3_sent_at: string | null;
  followup_day7_sent_at: string | null;
}

/**
 * The two mailing-preference columns, which live on `profiles` for a student
 * with an account and on `leads` for one without. Both tables carry the same
 * pair, and public.unsubscribe_by_token(uuid) already resolves a token against
 * profiles first and leads second, so a leads token is a working link.
 */
interface ContactPrefs {
  unsubscribe_token: string | null;
  email_unsubscribed: boolean | null;
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
  "attendance_response, " +
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
 * Did this student answer the attendance question with "no"?
 *
 * WHY THIS IS A TYPESCRIPT FILTER AND NOT `.neq("attendance_response", "no")`
 * PostgREST's `neq` is SQL `<>`, and `NULL <> 'no'` is NULL, not true — so a
 * `.neq()` would drop every row whose attendance_response is NULL. That is
 * everyone who has not answered, i.e. almost the whole list: the entire
 * sequence would go silent and nobody would notice for weeks. Do not
 * "simplify" this back into the query.
 */
function hasDeclined(b: Booking): boolean {
  return b.attendance_response === "no";
}

/**
 * The mailing preferences for one booking: `profiles` by user_id first, then
 * `leads` by lowercased email.
 *
 * WHY THE FALLBACK EXISTS
 * This used to read `profiles` only. A student who booked a trial without
 * signing up has `user_id = NULL` — 12 of the 39 live bookings — so no token
 * was ever found, her letters carried no unsubscribe link at all, and
 * `leads.email_unsubscribed` was never consulted. The only way out she was
 * offered was a WhatsApp number, and a student who does not use WhatsApp had
 * no way off this list but to write to us and ask. `leads` has carried
 * unsubscribe_token / email_unsubscribed / unsubscribed_at since migration
 * 20260916113000 and all 111 leads have a token, so the plumbing was there;
 * only this sender was not using it.
 */
async function resolveContactPrefs(
  supabase: ReturnType<typeof createClient>,
  userId: string | null,
  email: string,
): Promise<ContactPrefs> {
  if (userId) {
    const { data } = await supabase
      .from("profiles")
      .select("unsubscribe_token, email_unsubscribed")
      .eq("user_id", userId)
      .maybeSingle();
    const profile = (data ?? null) as ContactPrefs | null;
    if (profile) return profile;
  }

  const normalised = email.trim().toLowerCase();
  if (!normalised) return { unsubscribe_token: null, email_unsubscribed: null };

  const { data } = await supabase
    .from("leads")
    .select("unsubscribe_token, email_unsubscribed")
    .eq("email", normalised)
    .maybeSingle();
  const lead = (data ?? null) as ContactPrefs | null;
  return lead ?? { unsubscribe_token: null, email_unsubscribed: null };
}

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
    // written to, no-shows included, which Re decided is the right trade —
    // everyone, that is, except the students who told us they were not coming;
    // those are dropped in TypeScript below, see hasDeclined.
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

    // A declining booking is NOT filtered here. respond_trial_attendance
    // records attendance_response = 'no' and deliberately leaves `status`
    // alone (only a yes moves the row to confirmed_attendance), so the only
    // marker of a decline is that column — and it is nullable, which makes
    // `.neq()` the wrong tool. See hasDeclined.
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
    // A decline ends the sequence — prep, postclass, day3 and day7 alike.
    // Before this check, clicking "I can't make it" changed nothing at all:
    // Souâd Rahmouni declined her 19 Sep trial on 13 Sep and was still sent
    // the "your trial is tomorrow" letter on 17 Sep, and would have had three
    // more. Stamp the stage column so the row stops being re-queried hourly,
    // exactly like the already-enrolled skip below.
    if (hasDeclined(b)) {
      await supabase.from("trial_bookings").update({ [column]: new Date().toISOString() }).eq("id", b.id);
      skipped++;
      continue;
    }

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

    // Respect the unsubscribe preference and fetch the token so every stage's
    // email includes a working one-click unsubscribe link — including for a
    // student who booked without an account, who until now got a letter with
    // no way out of the list at all.
    const prefs = await resolveContactPrefs(supabase, b.user_id, b.email);
    if (prefs.email_unsubscribed) {
      await supabase.from("trial_bookings").update({ [column]: new Date().toISOString() }).eq("id", b.id);
      skipped++;
      continue;
    }
    const unsubscribeToken: string | undefined = prefs.unsubscribe_token ?? undefined;

    // The share link still needs an account: it is a referral to the booker's
    // own profile, so a booking with no user_id carries no ref. Unchanged.
    const referralUrl: string | undefined =
      stage === "day7" && b.user_id ? `https://kloversegy.com/free-trial?ref=${b.user_id}` : undefined;

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
