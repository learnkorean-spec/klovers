import { supabase } from "@/integrations/supabase/client";
import { buildGoogleCalendarUrl, formatTime12h } from "@/lib/calendarUrl";
import { TRIAL_CONFIRMATION_EMAIL_ENABLED } from "@/lib/siteConfig";

/**
 * Sends the trial_confirmed email (calendar link + formatted date/time),
 * gated by TRIAL_CONFIRMATION_EMAIL_ENABLED. Single source of truth for the
 * admin "approve trial" flow — previously duplicated across three admin
 * panels with slightly different date formatting in each.
 *
 * Returns true iff an email was actually sent (false when the feature flag
 * is off), so callers can reflect the real outcome in their toast/UI instead
 * of referencing the flag directly.
 */
export async function sendTrialConfirmationEmail(params: {
  email: string;
  name: string;
  level?: string | null;
  trial_date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  timezone?: string | null;
  language?: string; // defaults "ar"
  // The real Meet room for this class (trial_bookings.meeting_url /
  // trial_slots.meeting_url). Pass it whenever it's known — otherwise the
  // "Add to Google Calendar" button in this email carries no meeting link,
  // and the calendar event ends up pointing somewhere other than where the
  // class actually is.
  meeting_url?: string | null;
}): Promise<boolean> {
  if (!TRIAL_CONFIRMATION_EMAIL_ENABLED) return false;

  const tz = params.timezone || "Africa/Cairo";
  const calendarUrl = buildGoogleCalendarUrl({
    title: "Free Korean Trial Class by Klovers Academy",
    date: params.trial_date,
    time: params.start_time,
    durationMin: 45,
    description: `Level: ${params.level || "Beginner"}`,
    timezone: tz,
    location: params.meeting_url,
  });
  const trialDateFormatted = new Date(`${params.trial_date}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const { error } = await supabase.functions.invoke("send-confirmation-email", {
    body: {
      template: "trial_confirmed",
      email: params.email,
      name: params.name,
      level: params.level || "Beginner",
      trial_date: trialDateFormatted,
      trial_time: formatTime12h(params.start_time),
      trial_timezone: tz,
      calendar_url: calendarUrl,
      language: params.language || "ar",
    },
  });
  if (error) throw error;
  return true;
}
