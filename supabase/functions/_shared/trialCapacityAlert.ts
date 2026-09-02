import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface ClaimResult {
  should_send: boolean;
  day_of_week: number | null;
  class_language: string | null;
  timezone: string | null;
  capacity: number | null;
  confirmed_count: number | null;
  fourth_email: string | null;
  fourth_name: string | null;
}

/**
 * The zone this student's browser reported when they booked.
 *
 * claim_trial_capacity_alert does not return it, and widening that RPC's
 * return type means a migration for one nullable text column - so read it
 * off the booking instead. Best-effort by design: a booking made before
 * student_timezone shipped has none, and an environment where the column
 * doesn't exist yet answers 42703. Both give null, and the template's
 * unknown-zone branch is exactly the behaviour we have today.
 */
async function lookupStudentTimezone(
  supabase: SupabaseClient,
  trialDate: string,
  startTime: string,
  email: string,
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("trial_bookings")
      .select("student_timezone")
      .eq("trial_date", trialDate)
      .eq("start_time", startTime)
      .ilike("email", email)
      .not("student_timezone", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      // Don't log the row or the address - only that the lookup didn't land.
      if (error.code !== "42703") console.warn("student_timezone lookup failed:", error.code);
      return null;
    }
    const tz = (data as { student_timezone?: string | null } | null)?.student_timezone ?? null;
    return typeof tz === "string" && tz.trim() ? tz.trim() : null;
  } catch {
    return null;
  }
}

/**
 * Checks whether a trial slot/date just reached its confirmed-registration
 * capacity alert threshold, and if so — exactly once per occurrence — emails
 * the teacher and the student who completed that spot. Best-effort: never
 * throws, so callers can fire-and-forget this after a booking succeeds.
 *
 * Must be called with a service-role Supabase client (the count+claim RPC
 * is service_role-only) from edge-function code, not from a DB trigger —
 * see the comment on claim_trial_capacity_alert in
 * supabase/migrations/20260801120000_trial_monthly_schedule_vietnam.sql for
 * why the trigger-based approach doesn't work in this project.
 */
export async function checkAndSendTrialCapacityAlert(
  supabase: SupabaseClient,
  trialDate: string,
  startTime: string,
): Promise<void> {
  try {
    const { data, error } = await supabase.rpc("claim_trial_capacity_alert", {
      p_trial_date: trialDate,
      p_start_time: startTime,
    });
    if (error) {
      console.warn("claim_trial_capacity_alert error:", error.message);
      return;
    }
    const claim = (Array.isArray(data) ? data[0] : data) as ClaimResult | null;
    if (!claim?.should_send) return;

    const dayName = claim.day_of_week != null ? DAY_NAMES[claim.day_of_week] : "";
    const languageLabel = claim.class_language === "arabic" ? "Arabic" : "English";
    const timezone = claim.timezone ?? "Asia/Ho_Chi_Minh";
    const confirmedCount = claim.confirmed_count ?? 4;

    // Teacher alert — reuses the existing admin_notifications ->
    // notify-admin-email pipeline (already proven working: book-trial uses
    // it for every new-booking notification).
    try {
      await supabase.from("admin_notifications").insert({
        message:
          `Trial group full: ${languageLabel} class on ${dayName} ${trialDate} at ` +
          `${startTime} (${timezone}) just reached ${confirmedCount} confirmed students.`,
        type: "trial_capacity_reached",
      });
    } catch (e) {
      console.warn("trial capacity admin_notifications insert failed:", e);
    }

    // Student alert — the confirming student's own email.
    if (claim.fourth_email && SUPABASE_URL && SERVICE_ROLE_KEY) {
      // Her own zone, so this email states the class at the same hour every
      // other trial email does. Null falls back to the slot time plus GMT.
      const studentTimezone = await lookupStudentTimezone(
        supabase, trialDate, startTime, claim.fourth_email,
      );
      try {
        await fetch(`${SUPABASE_URL}/functions/v1/send-confirmation-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({
            template: "trial_group_full",
            email: claim.fourth_email,
            name: claim.fourth_name || claim.fourth_email.split("@")[0],
            language: claim.class_language === "arabic" ? "ar" : "en",
            class_language: claim.class_language,
            trial_date: trialDate,
            trial_time: startTime,
            trial_timezone: timezone,
            trial_day_name: dayName,
            student_timezone: studentTimezone,
            confirmed_count: confirmedCount,
          }),
        });
      } catch (e) {
        console.warn("trial_group_full email failed:", e);
      }
    }
  } catch (e) {
    console.warn("checkAndSendTrialCapacityAlert failed:", e);
  }
}
