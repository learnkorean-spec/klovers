import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkAndSendTrialCapacityAlert } from "../_shared/trialCapacityAlert.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// DB-backed rate limiter — survives Edge Function cold starts.
// Uses the trial_rate_limits table with 1-hour windows.
// Max RATE_LIMIT_MAX attempts per identifier per window.
const RATE_LIMIT_MAX = 5;

async function checkRateLimit(
  supabase: ReturnType<typeof createClient>,
  identifier: string,
  action = "book",
): Promise<boolean> {
  // Truncate to the current hour bucket
  const windowStart = new Date();
  windowStart.setMinutes(0, 0, 0);

  // UPSERT: increment counter; if it exceeds the limit, we're rate-limited.
  const { data, error } = await supabase.rpc("upsert_trial_rate_limit", {
    p_identifier: identifier,
    p_action: action,
    p_window_start: windowStart.toISOString(),
    p_max_attempts: RATE_LIMIT_MAX,
  });
  if (error) {
    // Fail open — don't block legitimate requests if the table/function is missing.
    // But surface it: a silent fail-open means abuse protection is effectively
    // off, so flag it in admin_notifications instead of only console.warn.
    console.warn("[book-trial] rate limit check error:", error.message);
    try {
      await supabase.from("admin_notifications").insert({
        message: `Trial rate limiter is failing open (identifier=${identifier}): ${error.message}`,
        type: "trial_rate_limit_error",
      });
    } catch { /* never let alerting break the booking flow */ }
    return false;
  }
  // Returns true if the caller is rate-limited (attempt_count > max)
  return data === true;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * Compute the next occurrence of a given day_of_week (0=Sun) from today,
 * constrained to the admin-configured monthly window (trial_settings.
 * window_start_day/window_end_day — NULL/NULL means no restriction). This
 * is only a fallback for when the frontend doesn't pass an explicit
 * trial_date; the normal path always books a specific dated trial_slots row.
 */
function nextDateForDay(dayOfWeek: number, windowStartDay: number | null, windowEndDay: number | null): string {
  const today = new Date();
  const todayDay = today.getUTCDay();
  let diff = dayOfWeek - todayDay;
  if (diff <= 0) diff += 7; // always at least 1 day in the future
  const next = new Date(today);
  next.setUTCDate(today.getUTCDate() + diff);
  if (windowStartDay != null && windowEndDay != null) {
    while (next.getUTCDate() > windowEndDay || next.getUTCDate() < windowStartDay) {
      next.setUTCDate(next.getUTCDate() + 7);
    }
  }
  return next.toISOString().split("T")[0]; // YYYY-MM-DD
}

/** Build a Google Calendar "Add Event" URL. */
function buildCalendarUrl(params: {
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  durationMin: number;
  description: string;
  timezone: string;
  // The real Meet room (trial_slots.meeting_url). Without this the generated
  // calendar event carries no meeting link, so Google Calendar can mint its
  // own fresh Meet room on save -- a link that is NOT the one the teacher
  // actually runs the class from and NOT the one in the confirmation email.
  location?: string | null;
}): string {
  const { title, date, time, durationMin, description, timezone, location } = params;
  const [h, m] = time.split(":").map(Number);
  // Format: YYYYMMDDTHHmmSS
  const dateClean = date.replace(/-/g, "");
  const start = `${dateClean}T${String(h).padStart(2, "0")}${String(m).padStart(2, "0")}00`;
  const endH = h + Math.floor((m + durationMin) / 60);
  const endM = (m + durationMin) % 60;
  const end = `${dateClean}T${String(endH).padStart(2, "0")}${String(endM).padStart(2, "0")}00`;

  const fullDescription = location && location.trim()
    ? `${description}\n\nJoin: ${location.trim()}`
    : description;

  const params2 = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${start}/${end}`,
    details: fullDescription,
    ctz: timezone,
  });
  if (location && location.trim()) {
    params2.set("location", location.trim());
  }
  return `https://calendar.google.com/calendar/render?${params2.toString()}`;
}

function formatTime12h(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

/**
 * Validate a client-supplied IANA timezone.
 *
 * The value comes from `Intl.DateTimeFormat().resolvedOptions().timeZone` in
 * the student's own browser, so it is normally right — but it arrives in a
 * request body, which makes it untrusted input. Intl itself is the check: an
 * unknown zone makes the constructor throw. Anything that fails returns null,
 * and null is stored as null. We never substitute a guess for a zone we could
 * not verify.
 */
function normalizeStudentTimezone(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const tz = value.trim();
  if (!tz || tz.length > 64) return null;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz }).format(new Date());
    return tz;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      "unknown";

    const body = await req.json();
    const { name, email, phone, country, level, goal, day_of_week, start_time, trial_date: bodyTrialDate, class_language, referrer_id, authed, student_timezone } = body;
    // The student's own zone, read from their browser. Distinct from the
    // slot's `timezone` below, which is the teacher's.
    const studentTimezone = normalizeStudentTimezone(student_timezone);

    // ── Authenticated path: derive identity from JWT, skip placeholder hacks ──
    // When the client passes `authed: true` AND a valid Authorization bearer
    // token, we trust the JWT-resolved profile instead of the body fields.
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ── DB-backed rate limiting (survives cold starts) ─────────────────────
    if (await checkRateLimit(supabase, ip)) {
      return new Response(
        JSON.stringify({ error: "Too many submissions. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let resolvedUserId: string | null = null;
    let resolvedEmail: string | null = null;
    let resolvedName: string | null = null;
    let resolvedLevel: string | null = null;
    if (authed) {
      const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
      const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
      if (token) {
        const { data: userData } = await supabase.auth.getUser(token);
        if (userData?.user) {
          resolvedUserId = userData.user.id;
          resolvedEmail = userData.user.email ?? null;
          // Capture level from user_metadata as a fallback for email-confirmation
          // signups where the profile row hasn't been updated yet.
          const metaLevel = (userData.user.user_metadata?.level as string | undefined)?.trim();
          if (metaLevel) resolvedLevel = metaLevel;
          // Pull the name + level from profiles for nicer display
          const { data: profileRow } = await supabase
            .from("profiles")
            .select("name, email, level")
            .eq("user_id", resolvedUserId)
            .maybeSingle();
          if (profileRow) {
            resolvedName = profileRow.name ?? null;
            if (!resolvedEmail && profileRow.email) resolvedEmail = profileRow.email;
            const profileLevel = (profileRow.level as string | undefined)?.trim();
            if (profileLevel) resolvedLevel = profileLevel;
          }
        }
      }
    }

    // Validation — accept email from JWT in the authed path
    const effectiveEmail = resolvedEmail ?? email;
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!effectiveEmail || !emailRegex.test(effectiveEmail)) {
      return new Response(
        JSON.stringify({ error: "Invalid email address." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (typeof day_of_week !== "number" || day_of_week < 0 || day_of_week > 6) {
      return new Response(
        JSON.stringify({ error: "Invalid day_of_week." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!start_time || typeof start_time !== "string") {
      return new Response(
        JSON.stringify({ error: "Invalid start_time." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const finalName = (resolvedName || name || "").trim() || effectiveEmail.split("@")[0];
    const normalizedEmail = effectiveEmail.trim().toLowerCase();
    // Use the actual group date from the frontend if provided; fall back to computing the next occurrence.
    let trialDate = bodyTrialDate && /^\d{4}-\d{2}-\d{2}$/.test(bodyTrialDate) ? bodyTrialDate : null;
    if (!trialDate) {
      const { data: settingsRow } = await supabase
        .from("trial_settings")
        .select("window_start_day, window_end_day")
        .eq("id", 1)
        .maybeSingle();
      trialDate = nextDateForDay(
        day_of_week,
        settingsRow?.window_start_day ?? null,
        settingsRow?.window_end_day ?? null,
      );
    }

    // Look up slot metadata in one query (timezone, duration, meeting link).
    const { data: slotTzRow } = await supabase
      .from("trial_slots")
      .select("timezone, duration_min, meeting_url")
      .eq("trial_date", trialDate)
      .eq("start_time", start_time)
      .maybeSingle();
    const _slot = slotTzRow as { timezone?: string | null; duration_min?: number | null; meeting_url?: string | null } | null;
    // Fallback matches the trial_slots column default and ADMIN_TIMEZONE: the
    // teacher's own zone. It was Asia/Ho_Chi_Minh, an hour off, which put every
    // slot an hour later for her and an hour earlier for the student.
    const timezone: string = _slot?.timezone || "Asia/Kuala_Lumpur";
    const slotDurationMin: number = _slot?.duration_min ?? 30;
    const meetingUrl: string | null = _slot?.meeting_url ?? null;

    // Registrations close 1 day before the class, compared in the slot's own
    // timezone (not a hardcoded region) — trial cohorts have moved timezones
    // before (MYT batch replaced an earlier Cairo-anchored one) and a fixed
    // UTC offset silently goes stale whenever that happens again.
    const todayInSlotTz = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    const trialMs = new Date(trialDate + "T00:00:00Z").getTime();
    const todayMs = new Date(todayInSlotTz + "T00:00:00Z").getTime();
    if (Math.round((trialMs - todayMs) / 86_400_000) <= 1) {
      // Same class of failure as the other pre-checks above (invalid email,
      // bad day_of_week, bad start_time) -- a real 400, not a 200 wrapping
      // an error. Body shape is unchanged.
      return new Response(
        JSON.stringify({ ok: false, success: false, error: "Booking is closed — registrations close 1 day before the class." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Upsert lead
    const goalWithPhone = [
      goal || "Free trial",
      phone ? `WhatsApp: ${phone}` : "",
      referrer_id ? `ref:${referrer_id}` : "",
    ].filter(Boolean).join(" | ");

    const dayName = DAY_NAMES[day_of_week];
    const scheduleStr = `${dayName} ${formatTime12h(start_time)}`;

    const { data: existingLead } = await supabase
      .from("leads")
      .select("id")
      .eq("email", normalizedEmail)
      .limit(1)
      .maybeSingle();

    if (existingLead) {
      await supabase
        .from("leads")
        .update({
          name: finalName,
          country: country?.trim() || undefined,
          level: level?.trim() || undefined,
          goal: goalWithPhone,
          schedule: scheduleStr,
          source: authed ? "trial-booking-authed" : "free-trial-page",
          status: "trial_booked",
          ...(resolvedUserId ? { user_id: resolvedUserId } : {}),
        })
        .eq("id", existingLead.id);
    } else {
      await supabase.from("leads").insert({
        name: finalName,
        email: normalizedEmail,
        country: country?.trim() || "Unknown",
        level: level?.trim() || "",
        goal: goalWithPhone,
        schedule: scheduleStr,
        source: authed ? "trial-booking-authed" : "free-trial-page",
        status: "trial_booked",
        ...(resolvedUserId ? { user_id: resolvedUserId } : {}),
      });
    }

    // 2. For authenticated users rebooking, close any existing booking (TBA or
    // real) so the INSERT below succeeds and admin keeps a visible audit trail.
    // Unauthenticated path only closes TBA placeholders; real bookings there hit
    // 23505 and return a friendly message.
    // Look up existing booking — prefer user_id match (reliable), fall back to email.
    let existingBooking: { id: string; start_time: string | null; trial_date: string | null; is_tba: boolean | null; rollover_status: string | null } | null = null;
    if (resolvedUserId) {
      const { data, error: e1 } = await supabase
        .from("trial_bookings")
        .select("id, start_time, trial_date, is_tba, rollover_status")
        .eq("user_id", resolvedUserId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (e1) console.error("book-trial lookup by user_id error:", JSON.stringify(e1));
      existingBooking = data;
    }
    if (!existingBooking) {
      const { data, error: e2 } = await supabase
        .from("trial_bookings")
        .select("id, start_time, trial_date, is_tba, rollover_status")
        .eq("email", normalizedEmail)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (e2) console.error("book-trial lookup by email error:", JSON.stringify(e2));
      existingBooking = data;
    }

    const isTbaPlaceholder =
      !!existingBooking &&
      (existingBooking.is_tba === true ||
        !existingBooking.start_time || !existingBooking.trial_date ||
        existingBooking.start_time === "TBA" ||
        existingBooking.trial_date === "2099-12-31");

    // A booking whose group never reached the minimum to run isn't an active
    // booking anymore — treat it like a TBA placeholder so the student (authed
    // or not) can freely pick a new date instead of hitting "already booked".
    const isRollover = !!existingBooking && existingBooking.rollover_status != null;

    // Authenticated rebook: mark previous booking cancelled (any kind) to allow
    // slot change while preserving changed_at/cancelled_at for admin.
    // Unauthenticated: only close TBA placeholders (or rollover bookings).
    const shouldCloseExisting = existingBooking && (authed || isTbaPlaceholder || isRollover);
    if (shouldCloseExisting) {
      const auditUpdate = await supabase
        .from("trial_bookings")
        .update({
          status: "cancelled",
          changed_at: new Date().toISOString(),
          cancelled_at: new Date().toISOString(),
          cancel_reason: authed ? "student_reschedule" : "tba_rebook",
        } as any)
        .eq("id", existingBooking!.id);

      if (auditUpdate.error) {
        const missingAuditColumn =
          auditUpdate.error.code === "42703" ||
          /changed_at|cancelled_at|cancel_reason/i.test(auditUpdate.error.message || "");
        if (!missingAuditColumn) throw auditUpdate.error;

        const fallback = await supabase
          .from("trial_bookings")
          .update({ status: "cancelled" } as any)
          .eq("id", existingBooking!.id);
        if (fallback.error) throw fallback.error;
      }
    }

    // Every booking waits on the student's own confirmation.
    //
    // This used to be `authed && resolvedUserId ? "awaiting_attendance" : "confirmed"`,
    // which meant the confirmation step existed only for students who happened
    // to be signed in. Everyone else was written straight to "confirmed" and
    // counted as attending without ever saying so, and there is nothing a
    // reader could perceive that would explain why they got a different flow
    // from the person next to them. It also made the number Reham looks at
    // before a class untrue: a mix of people who confirmed and people who were
    // assumed.
    //
    // Signing in is not needed to confirm. TrialConfirmPage works entirely
    // from the token in the emailed link, and both RPCs behind it
    // (get_trial_booking_by_token, respond_trial_attendance) are granted to
    // anon - checked on production before making this change.
    const bookingStatus = "awaiting_attendance";

    // Atomic insert via Postgres RPC. p_delete_id remains for older deployments,
    // but rebooks now preserve the old row as cancelled for admin visibility.
    const { data: newBookingId, error: bookingError } = await supabase.rpc("upsert_trial_booking", {
      p_delete_id:   null,
      p_name:        finalName,
      p_email:       normalizedEmail,
      p_phone:       phone?.trim() || null,
      p_level:       level?.trim() || null,
      p_goal:        goal?.trim() || null,
      p_day_of_week: day_of_week,
      p_start_time:  start_time,
      p_trial_date:  trialDate,
      p_timezone:    timezone,
      p_language:    class_language === "arabic" ? "arabic" : "english",
      p_user_id:     resolvedUserId || null,
      p_status:      bookingStatus,
    });

    // Wrap result in same shape the rest of the function expects
    const booking = newBookingId ? { id: newBookingId as string } : null;

    if (bookingError || !booking) {
      // Unique constraint: user has a real booking -- a real conflict, so a
      // real 409, not a 200 wrapping an error.
      if (bookingError?.code === "23505") {
        return new Response(
          JSON.stringify({
            ok: false,
            success: false,
            error: "You already have a trial class booked. Check your email for details.",
          }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      // Exclusion constraint: somebody else holds this exact slot.
      //
      // 23P01 only became reachable once upsert_trial_booking started writing
      // starts_at — before that slot_range was always NULL and
      // trial_bookings_no_overlap never applied to a single row, so two
      // students could book the same half hour and neither would be told.
      // This is a race the student can act on, so it reads as "gone" rather
      // than as an error they caused.
      if (
        bookingError?.code === "23P01" ||
        bookingError?.message?.includes("trial_bookings_no_overlap")
      ) {
        return new Response(
          JSON.stringify({
            ok: false,
            success: false,
            error: "Sorry — that time was just taken. Please pick another slot.",
            error_code: "slot_taken",
          }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      // Rejoin cooldown: this email cancelled a trial recently.
      //
      // Raised by tg_trial_bookings_rejoin_cooldown (migration 20260903170000)
      // as P0001, with the date they may book again inside the message:
      //
      //   trial_rejoin_cooldown: this email cancelled a trial on 2026-08-02;
      //   it can book again from 2026-09-01
      //
      // Without this branch the student falls through to the generic 500 and
      // is shown that raw sentence - a database exception, in a booking form.
      //
      // The second date is pulled out and given to them, because "a month
      // after you cancelled" is not an answer to someone who does not
      // remember cancelling. If the message ever stops carrying it the
      // wording degrades to the vaguer sentence rather than breaking.
      if (bookingError?.message?.includes("trial_rejoin_cooldown")) {
        const dates = bookingError.message.match(/\d{4}-\d{2}-\d{2}/g);
        const bookAgainFrom = dates && dates.length >= 2 ? dates[1] : null;
        return new Response(
          JSON.stringify({
            ok: false,
            success: false,
            error: bookAgainFrom
              ? `You cancelled a trial recently, so this email can book again from ${bookAgainFrom}. Message us on WhatsApp if you need to come sooner.`
              : "You cancelled a trial recently. This email can book again a month after that date. Message us on WhatsApp if you need to come sooner.",
            error_code: "rejoin_cooldown",
            ...(bookAgainFrom ? { book_again_from: bookAgainFrom } : {}),
          }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      // Conflict trigger: trial time overlaps an existing enrolled class
      if (bookingError?.code === "23514" || bookingError?.message?.includes("trial_booking_conflict")) {
        return new Response(
          JSON.stringify({
            ok: false,
            success: false,
            error: "This trial time overlaps with one of your existing classes. Please pick a different slot or contact us on WhatsApp.",
          }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      // Surface the real DB error in the response body instead of throwing a
      // generic 500 — this lets the UI show a meaningful message and lets us
      // see the error code/message without needing server-side log access.
      // Genuinely unexpected (not one of the known conflict codes above), so
      // a real 500 -- this was the most dangerous of the four 200s: an actual
      // bug returning "success" to every caller and monitor.
      const errMsg = bookingError?.message ?? "Failed to insert trial booking";
      const errCode = bookingError?.code ?? "unknown";
      console.error("book-trial insert error:", errCode, errMsg, JSON.stringify(bookingError));
      return new Response(
        JSON.stringify({ ok: false, success: false, error: errMsg, error_code: errCode }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2b. Record the student's own timezone. Best effort, never fatal.
    //
    // This is a follow-up UPDATE rather than a new argument to
    // upsert_trial_booking on purpose: changing that RPC's signature would
    // touch every other caller, and a booking must never fail because a
    // display preference could not be stored.
    if (studentTimezone) {
      const { error: tzError } = await supabase
        .from("trial_bookings")
        .update({ student_timezone: studentTimezone } as any)
        .eq("id", booking.id);
      if (tzError) {
        // 42703 = column does not exist, i.e. migration 20260901100000 has
        // not been dispatched yet. That window is expected between this
        // deploy and the Apply Migrations run; the row simply keeps NULL and
        // the emails fall back to the Cairo + GMT pair. Not worth an alert.
        if (tzError.code !== "42703") {
          console.warn("[book-trial] could not store student_timezone:", tzError.code, tzError.message);
        }
      }
    }

    // 3. The admin notification for a new trial booking is written by the
    //    `trg_notify_new_trial_booking` trigger on trial_bookings (migration
    //    20260915234500), so every booking path notifies and not just this
    //    one. Inserting it here as well would duplicate that row.

    // 3b. Check whether this booking filled the slot, and if so alert the
    // teacher and this student. Best effort: never blocks or affects the
    // booking response.
    //
    // This was gated on `bookingStatus === "confirmed"`, a value this function
    // no longer produces - so leaving the gate would have silently retired the
    // alert. A seat is taken the moment the row exists, whatever its status,
    // so the check belongs on every booking.
    try {
      await checkAndSendTrialCapacityAlert(supabase, trialDate, start_time);
    } catch (e) {
      console.warn("checkAndSendTrialCapacityAlert failed:", e);
    }

    // 4. Build calendar URL for the response
    const calendarUrl = buildCalendarUrl({
      title: "Free Korean Trial Class — Klovers Academy",
      date: trialDate,
      time: start_time,
      durationMin: slotDurationMin,
      description: `Your free ${slotDurationMin}-min trial Korean class with Klovers Academy.\nLevel: ${level || "Beginner"}\n\nhttps://kloversegy.com`,
      timezone,
      location: meetingUrl,
    });
    // meetingUrl already resolved from the merged slot query above

    // 5. One confirmation email, for everyone.
    //
    // There were two: trial_attendance_confirmation for signed-in students,
    // carrying the Meet link and a "confirm my attendance" button, and
    // trial_confirmed for everyone else, carrying the link and nothing to
    // click. Two letters for one event, chosen by a detail the reader cannot
    // see. Now one letter, and everybody gets the button.
    //
    // Awaited rather than fired and forgotten: this is the email the whole
    // booking depends on, so a failure should be recorded before the response
    // goes back, not after it.
    const { data: newBookingRow } = await supabase
      .from("trial_bookings")
      .select("id, confirmation_token")
      .eq("id", booking.id)
      .maybeSingle();

    const confirmationToken =
      (newBookingRow as { confirmation_token?: string | null } | null)?.confirmation_token ?? null;

    if (!confirmationToken) {
      // The button in the email is built from this token. Without it the
      // reader gets a letter they cannot act on, so it is worth an admin
      // notification rather than a silent send.
      console.error("[book-trial] no confirmation_token for booking", booking.id);
      try {
        await supabase.from("admin_notifications").insert({
          message: `Trial booking ${booking.id} has no confirmation_token — the confirmation email has no working button.`,
          type: "trial_confirmation_token_missing",
        });
      } catch { /* never let alerting break the booking flow */ }
    }

    try {
      const emailResponse = await fetch(
        `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-confirmation-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({
            template: "trial_attendance_confirmation",
            email: normalizedEmail,
            name: finalName,
            language: class_language === "arabic" ? "ar" : "en",
            trial_date: trialDate,
            trial_time: start_time,
            trial_timezone: timezone,
            student_timezone: studentTimezone,
            trial_duration_min: slotDurationMin,
            level: level?.trim() || "",
            calendar_url: calendarUrl,
            class_link_url: meetingUrl,
            booking_id: newBookingRow?.id ?? booking.id,
            confirmation_token: confirmationToken,
          }),
        },
      );
      if (!emailResponse.ok) {
        throw new Error(`send-confirmation-email returned ${emailResponse.status}`);
      }
    } catch (e) {
      console.warn("trial_attendance_confirmation email failed:", e);
      // Mark it so admin sees it in the dashboard and can resend by hand.
      try {
        await supabase
          .from("trial_bookings")
          .update({ confirmation_email_failed_at: new Date().toISOString() })
          .eq("id", booking.id);
      } catch { /* non-critical */ }
    }

    return new Response(
      JSON.stringify({
        success: true,
        booking: {
          id: booking.id,
          trial_date: trialDate,
          day_name: dayName,
          start_time,
          start_time_12h: formatTime12h(start_time),
          duration_min: slotDurationMin,
          timezone,
          calendar_url: calendarUrl,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("book-trial error:", err);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
