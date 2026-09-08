import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { authorizationError, authorizeRequest } from "../_shared/authorize.ts";

/**
 * send-attendance-confirmations — the letter that asks a booked student whether
 * they are actually coming, and stamps that we asked.
 *
 * WHY THIS FUNCTION HAD TO EXIST
 * ------------------------------
 * The letter itself has existed since May: template trial_attendance_confirmation,
 * with a confirm button and (since 2026-09-08) a decline button beside it, both
 * driven by respond_trial_attendance. book-trial sends it once, at the moment of
 * booking. Nothing else ever sent it to a group.
 *
 * So asking a whole session to confirm meant an admin clicking a per-booking
 * "Resend confirmation" button 57 times — except that button was gated on
 * status = 'awaiting_attendance' and all 57 bookings are 'pending', so it was
 * never rendered for any of them. There was no path at all from "a session is
 * on Thursday" to "everybody in it has been asked whether they are coming".
 *
 * This is the sibling of send-trial-invitations and is built to the same shape
 * on purpose: same authorization, same guards, same result body. The two
 * letters answer different questions and carry different stamps —
 * email_sent_at for the invitation, attendance_email_sent_at for this one — and
 * conflating them is what made /admin/today claim nobody had been asked.
 *
 * WHAT IT WILL NOT DO
 * -------------------
 *  - It will not send without `dry_run: false`. The default is a preview, and
 *    there is no cron job and no trigger anywhere that calls it. Nothing here
 *    sends on merge, or on any schedule; a person has to ask, twice.
 *  - It will not send a letter with no confirmation_token. The confirm and
 *    decline buttons are built from that token; without one the reader gets a
 *    question they cannot answer, which is worse than not being asked.
 *  - It will not send for a slot with no meeting_url or no start_time, or for a
 *    booking whose date disagrees with its slot's. Those are reported, not sent.
 *  - It will not send twice on the same run: attendance_email_sent_at is
 *    written after a 2xx and is the skip condition on the next run. Clearing it
 *    (or a later round) is how a second ask happens — deliberately, not by
 *    accident.
 *  - It will not guess a timezone. trial_timezone is passed from the SLOT.
 *    buildTrialConfirmedEmail falls back to Asia/Kuala_Lumpur when the caller
 *    omits it, which for a Cairo class is a five-hour error in the one line the
 *    student acts on.
 *
 * WHO IS ASKED
 * ------------
 * Every live booking on an upcoming date that has not been asked yet. Not
 * filtered by status — the 57 waiting bookings are 'pending' and filtering on
 * status is the exact bug this replaces. Not filtered by attendance_response
 * either: Re's instruction is that everyone gets asked, including anyone who
 * answered a previous round, because an answer given three weeks ago about a
 * date that has since moved is not an answer about this class.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

interface SlotRow {
  id: string;
  trial_date: string | null;
  start_time: string | null;
  timezone: string | null;
  duration_min: number | null;
  meeting_url: string | null;
  class_language: string | null;
}

interface BookingRow {
  id: string;
  name: string | null;
  email: string | null;
  level: string | null;
  trial_date: string | null;
  timezone: string | null;
  student_timezone: string | null;
  class_language: string | null;
  calendar_url: string | null;
  confirmation_token: string | null;
  attendance_response: string | null;
  slot_id: string | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  const authorization = await authorizeRequest(req, "admin-or-service");
  if (!authorization.ok) return authorizationError(authorization, corsHeaders);

  try {
    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    // Sending is opt-in, never the default. A run with no body is a preview.
    const dryRun = (body as { dry_run?: boolean }).dry_run !== false;
    const onlyDate = (body as { trial_date?: string }).trial_date ?? null;
    const onlyIds = (body as { booking_ids?: string[] }).booking_ids ?? null;
    const limit = Math.min(Number((body as { limit?: number }).limit ?? 200), 500);

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const today = new Date().toISOString().slice(0, 10);

    let q = supabase
      .from("trial_bookings")
      .select("id, name, email, level, trial_date, timezone, student_timezone, class_language, calendar_url, confirmation_token, attendance_response, slot_id")
      // Live, dated, reachable, and not already asked. Status is deliberately
      // not part of this — see the note at the top of the file.
      .neq("status", "cancelled")
      .is("attendance_email_sent_at", null)
      .not("email", "is", null)
      .gte("trial_date", today)
      .order("trial_date", { ascending: true })
      .limit(limit);

    if (onlyDate) q = q.eq("trial_date", onlyDate);
    if (onlyIds?.length) q = q.in("id", onlyIds);

    const { data: bookings, error: bookingErr } = await q;
    if (bookingErr) throw bookingErr;
    if (!bookings?.length) {
      return json({
        dry_run: dryRun,
        candidates: 0,
        sent: 0,
        failed: 0,
        failures: [],
        skipped: [],
        preview: [],
        message: "Everyone on this date has already been asked to confirm.",
      });
    }

    const slotIds = [...new Set((bookings as BookingRow[]).map((b) => b.slot_id).filter(Boolean))] as string[];
    const { data: slots, error: slotErr } = await supabase
      .from("trial_slots")
      .select("id, trial_date, start_time, timezone, duration_min, meeting_url, class_language")
      .in("id", slotIds);
    if (slotErr) throw slotErr;
    const slotById = new Map((slots as SlotRow[] ?? []).map((s) => [s.id, s]));

    const skipped: { booking_id: string; reason: string }[] = [];
    const ready: { booking: BookingRow; slot: SlotRow }[] = [];

    for (const b of bookings as BookingRow[]) {
      const slot = b.slot_id ? slotById.get(b.slot_id) : undefined;
      if (!slot) { skipped.push({ booking_id: b.id, reason: "no slot assigned" }); continue; }
      if (!slot.meeting_url) { skipped.push({ booking_id: b.id, reason: `slot ${slot.trial_date} has no meeting_url` }); continue; }
      if (!slot.start_time) { skipped.push({ booking_id: b.id, reason: `slot ${slot.trial_date} has no start_time` }); continue; }
      // The confirm and decline buttons are the entire point of this letter and
      // they are built from the token. A tokenless send is a question with no
      // way to answer it, and the student would read our silence afterwards as
      // theirs.
      if (!b.confirmation_token) { skipped.push({ booking_id: b.id, reason: "no confirmation_token — the letter would have no buttons" }); continue; }
      // The date the student is told must be the date on the slot. If the two
      // ever disagree, the letter and the room are an hour or a day apart, and
      // the student is the one who finds out.
      if (slot.trial_date && b.trial_date && slot.trial_date !== b.trial_date) {
        skipped.push({ booking_id: b.id, reason: `booking date ${b.trial_date} != slot date ${slot.trial_date}` });
        continue;
      }
      ready.push({ booking: b, slot });
    }

    const preview = ready.map(({ booking, slot }) => ({
      booking_id: booking.id,
      email: booking.email,
      trial_date: slot.trial_date,
      trial_time: slot.start_time,
      trial_timezone: slot.timezone,
      // Shown so an admin can see they are re-asking someone who already
      // answered, which is allowed but worth knowing before clicking send.
      already_answered: booking.attendance_response,
      language: (booking.class_language ?? slot.class_language) === "arabic" ? "ar" : "en",
    }));

    if (dryRun) {
      return json({
        dry_run: true,
        candidates: ready.length,
        sent: 0,
        failed: 0,
        failures: [],
        skipped,
        preview,
        note: "Nothing was sent. Call again with {\"dry_run\": false} to send.",
      });
    }

    let sent = 0;
    const failures: { booking_id: string; error: string }[] = [];

    for (const { booking, slot } of ready) {
      const isArabic = (booking.class_language ?? slot.class_language) === "arabic";
      const payload = {
        template: "trial_attendance_confirmation",
        email: booking.email,
        name: booking.name?.trim() || (isArabic ? "طالبنا العزيز" : "there"),
        language: isArabic ? "ar" : "en",
        level: booking.level ?? undefined,
        trial_date: slot.trial_date,
        trial_time: slot.start_time,
        // From the slot, always. See the note at the top of this file.
        trial_timezone: slot.timezone ?? "Africa/Cairo",
        // Only a real student zone, never the booking's default. The booking
        // column carried a wrong host default for ten weeks in 2026; passing it
        // blindly would print a time five hours out.
        student_timezone: booking.student_timezone ?? null,
        trial_duration_min: slot.duration_min ?? 30,
        class_link_url: slot.meeting_url,
        calendar_url: booking.calendar_url ?? undefined,
        booking_id: booking.id,
        confirmation_token: booking.confirmation_token,
      };

      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/send-confirmation-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${SERVICE_KEY}` },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          failures.push({ booking_id: booking.id, error: (await res.text()).slice(0, 300) });
          continue;
        }

        // Stamped only after a 2xx. If this write fails the student would be
        // asked again on the next run, so it counts as a failure and is named.
        const { error: stampErr } = await supabase
          .from("trial_bookings")
          .update({ attendance_email_sent_at: new Date().toISOString() })
          .eq("id", booking.id);
        if (stampErr) {
          failures.push({ booking_id: booking.id, error: `sent but not stamped: ${stampErr.message}` });
          continue;
        }

        sent++;
        const { error: eventErr } = await supabase.from("lead_events").insert({
          session_id: crypto.randomUUID(),
          source_type: "email",
          source_page: "/email/trial-attendance-confirmation",
          cta_label: "trial_attendance_confirmation_sent",
          campaign: "trial_attendance_confirmation",
          metadata: { booking_id: booking.id, trial_date: slot.trial_date },
        });
        // Analytics, not the send. A failure here must not be reported as a
        // failed letter — the student has it — but it must not vanish either.
        if (eventErr) console.warn("[send-attendance-confirmations] lead_events insert failed:", eventErr.message);
      } catch (e) {
        failures.push({ booking_id: booking.id, error: e instanceof Error ? e.message : String(e) });
      }
    }

    return json({ dry_run: false, candidates: ready.length, sent, failed: failures.length, failures, skipped });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[send-attendance-confirmations]", msg);
    return json({ error: msg }, 500);
  }
});
