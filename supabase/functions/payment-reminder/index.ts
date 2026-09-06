/**
 * The payment reminder for Egyptian enrolments awaiting a transfer.
 *
 * WHAT THIS FILE GOT WRONG, BECAUSE IT IS WORTH NOT REPEATING
 * ----------------------------------------------------------
 * Two faults sat on top of each other and both were live for months.
 *
 * 1. It sent the WRONG EMAIL. The POST to send-confirmation-email carried no
 *    `template`, so it fell through to the default — `enrollment`, the
 *    "you're enrolled, here are your class details" letter. People who had not
 *    paid were being told, daily, that they were in a class.
 *
 * 2. It NEVER STOPPED. The condition was `hoursUntilDue <= 6` with no lower
 *    bound: true six hours before the deadline, and true forever after it
 *    passes. Nothing recorded that a reminder had been sent, nothing capped
 *    the count, nothing spaced them out.
 *
 * Measured on production 2026-09-06: 3 enrolments matched, the oldest due on
 * 7 April — 152 days earlier. 39 emails in 30 days to those 3 people.
 *
 * THE RULES NOW, AND WHY EACH ONE EXISTS
 * --------------------------------------
 *   window   due_at within [now - 48h, now + 6h]
 *            A reminder is about a deadline that is close. Once it is days
 *            gone the enrolment needs a person, not another automated nudge.
 *            The upper bound is the original intent; the lower bound is the
 *            one that was missing.
 *
 *   cap      reminder_count < MAX_REMINDERS
 *            Two reminders is a nudge. A third is nagging.
 *
 *   spacing  nothing within 24h of last_reminder_at
 *            Guards against a re-run, a manual invoke, or a schedule change
 *            turning one reminder into several.
 *
 *   record   both columns written only after a send that actually returned 2xx
 *            The old code awaited the fetch and ignored its status, so a
 *            failure was indistinguishable from a success. A failed send now
 *            records nothing and is retried tomorrow, rather than being
 *            counted and dropped.
 *
 * `last_reminder_at` and `reminder_count` already existed on `enrollments` and
 * were never read or written — 0 of 25 rows populated. The plumbing was built
 * and left unconnected. This connects it.
 */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/** How long after the deadline a reminder is still the right thing to send. */
const WINDOW_HOURS_AFTER_DUE = 48;
/** How long before the deadline the first reminder may go. */
const WINDOW_HOURS_BEFORE_DUE = 6;
/** Two is a nudge; three is nagging. */
const MAX_REMINDERS = 2;
/** Never two reminders inside this span, whatever re-runs the function. */
const MIN_HOURS_BETWEEN = 24;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { data: pendingEnrollments, error } = await supabaseAdmin
      .from("enrollments")
      .select("id, user_id, plan_type, duration, amount, currency, due_at, last_reminder_at, reminder_count")
      .eq("approval_status", "PENDING_PAYMENT")
      .eq("currency", "EGP")
      .not("due_at", "is", null);

    if (error) throw error;

    const now = Date.now();
    const sent: string[] = [];
    const skipped: Record<string, number> = {
      outside_window: 0, capped: 0, too_soon: 0, no_email: 0, send_failed: 0,
    };

    for (const enrollment of pendingEnrollments || []) {
      const dueAt = new Date(enrollment.due_at as string).getTime();
      if (Number.isNaN(dueAt)) { skipped.outside_window++; continue; }

      const hoursUntilDue = (dueAt - now) / 3_600_000;

      // The bound that was missing. Without the first half of this test, every
      // overdue enrolment stays eligible for the rest of time.
      if (hoursUntilDue < -WINDOW_HOURS_AFTER_DUE || hoursUntilDue > WINDOW_HOURS_BEFORE_DUE) {
        skipped.outside_window++;
        continue;
      }

      if ((enrollment.reminder_count ?? 0) >= MAX_REMINDERS) { skipped.capped++; continue; }

      if (enrollment.last_reminder_at) {
        const sinceLast = (now - new Date(enrollment.last_reminder_at as string).getTime()) / 3_600_000;
        if (sinceLast < MIN_HOURS_BETWEEN) { skipped.too_soon++; continue; }
      }

      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("name, email")
        .eq("user_id", enrollment.user_id)
        .single();

      if (!profile?.email) { skipped.no_email++; continue; }

      const functionUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-confirmation-email`;
      let ok = false;
      try {
        const res = await fetch(functionUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({
            // Naming the template is the whole point. Without it this falls to
            // `enrollment` — the "you are enrolled" letter — and tells someone
            // who has not paid that they are in a class.
            template: "payment_method_reminder",
            // Required by that template; send-confirmation-email returns 400
            // without it, which is also why email_logs.enrollment_id was null.
            enrollment_id: enrollment.id,
            email: profile.email,
            name: profile.name,
            plan_type: enrollment.plan_type,
            duration: enrollment.duration,
            sessions_total: enrollment.duration === 1 ? 4 : enrollment.duration === 3 ? 12 : 24,
            amount: enrollment.amount,
            language: "ar", // this function only handles EGP enrolments
          }),
        });
        ok = res.ok;
        if (!ok) {
          console.error(`payment_method_reminder failed for enrollment ${enrollment.id}: ${res.status} ${await res.text()}`);
        }
      } catch (sendErr) {
        console.error(`payment_method_reminder threw for enrollment ${enrollment.id}:`, sendErr);
      }

      if (!ok) { skipped.send_failed++; continue; }

      // Recorded only on a verified send, so a failure retries tomorrow
      // instead of consuming one of the two reminders silently.
      const { error: markErr } = await supabaseAdmin
        .from("enrollments")
        .update({
          last_reminder_at: new Date().toISOString(),
          reminder_count: (enrollment.reminder_count ?? 0) + 1,
        })
        .eq("id", enrollment.id);

      if (markErr) {
        // Worth shouting about: the email went out and the counter did not
        // move, which is the state that produces a repeat tomorrow.
        console.error(`sent but could not record reminder for enrollment ${enrollment.id}:`, markErr);
      }

      sent.push(enrollment.id as string);
    }

    return new Response(
      JSON.stringify({ success: true, reminders_sent: sent.length, skipped }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Payment reminder error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
