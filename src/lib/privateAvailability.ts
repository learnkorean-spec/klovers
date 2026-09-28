import { supabase } from "@/integrations/supabase/client";
import { TIMEZONE, PRIVATE_TIME_OPTIONS, WEEKDAYS } from "@/constants/scheduling";

export interface PrivateSlotOption {
  weekday: string;
  dayIndex: number;
  time: string;
  timeFormatted: string;
  timezone: string;
}

export function formatTime12(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${ampm}`;
}

/**
 * Pure function: given explicit private day names, compute private slot options.
 */
export function computePrivateAvailability(
  privateDayNames: string[],
  timeOptions: string[] = PRIVATE_TIME_OPTIONS
): { courseDays: string[]; privateAllowedDays: string[]; options: PrivateSlotOption[] } {
  const privateAllowedDays = privateDayNames.filter(d => WEEKDAYS.includes(d));
  // courseDays = all days NOT in private (informational)
  const courseDays = WEEKDAYS.filter(d => !privateAllowedDays.includes(d));

  const options: PrivateSlotOption[] = [];
  for (const day of privateAllowedDays) {
    const dayIndex = WEEKDAYS.indexOf(day);
    for (const time of timeOptions) {
      options.push({
        weekday: day,
        dayIndex,
        time,
        timeFormatted: formatTime12(time),
        timezone: TIMEZONE,
      });
    }
  }

  if (import.meta.env.DEV) {
    console.log("[privateAvailability] privateAllowedDays:", privateAllowedDays);
    console.log("[privateAvailability] timeOptions:", timeOptions);
  }

  return { courseDays, privateAllowedDays, options };
}

/**
 * Fetch configured private time options from app_settings.
 * Falls back to PRIVATE_TIME_OPTIONS constant if not found.
 */
async function fetchPrivateTimeOptions(): Promise<string[]> {
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "private_time_options")
    .maybeSingle();

  if (data?.value) {
    try {
      const parsed = JSON.parse(data.value);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch { /* fall through */ }
  }
  return PRIVATE_TIME_OPTIONS;
}

/**
 * Fetch admin-configured private class days from app_settings.
 *
 * 29 Sep 2026 (Re: "private must see all available times, all times, and
 * groups if its empty and not activated"): the old fallback excluded every
 * day that had ANY active schedule_packages row of course_type != "private" —
 * and every one of the 7 weekdays has one, so a private booker saw zero
 * days, always. A schedule_packages row only means a group slot is
 * *configured*, not that a real group is running and full there — the
 * fallback was blocking on the wrong signal. Group occupancy (pkg_groups /
 * pkg_group_members) is close to empty across the board right now, so the
 * fix is: offer every day for a private class unless Re has explicitly
 * fenced some off via private_class_days.
 */
async function fetchPrivateDays(): Promise<string[]> {
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "private_class_days")
    .maybeSingle();

  if (data?.value) {
    try {
      const parsed = JSON.parse(data.value);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch { /* fall through */ }
  }

  // No explicit fence configured — a private class can be requested on any
  // day of the week. (Real group fullness, not mere configuration, is what
  // should ever narrow this; nothing here currently does, on purpose.)
  return WEEKDAYS;
}

/**
 * Fetch private availability using admin-configured days and times.
 */
export async function fetchPrivateAvailability() {
  const [privateDays, timeOptions] = await Promise.all([
    fetchPrivateDays(),
    fetchPrivateTimeOptions(),
  ]);

  return computePrivateAvailability(privateDays, timeOptions);
}
